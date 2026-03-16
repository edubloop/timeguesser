import React, { useState, useCallback } from 'react';
import { StyleSheet, Pressable, TextInput, ActivityIndicator, Keyboard } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { View, Text } from '@/components/Themed';
import { useThemeColor } from '@/components/Themed';
import { Layout, Radius, Spacing, TypeScale } from '@/constants/theme';

interface SearchBarProps {
  onLocationSelected: (lat: number, lng: number, name: string) => void;
  onSearch: (query: string) => Promise<SearchResult[]>;
}

interface SearchResult {
  lat: number;
  lng: number;
  name: string;
}

export default function SearchBar({ onLocationSelected, onSearch }: SearchBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const tint = useThemeColor({}, 'tint');
  const cardBg = useThemeColor({}, 'mapSearchBar');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const tertiaryText = useThemeColor({}, 'tertiaryText');
  const tintSubtle = useThemeColor({}, 'tintSubtle');
  const scorePoor = useThemeColor({}, 'scorePoor');

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      setErrorText('Enter a place name to search.');
      return;
    }
    setLoading(true);
    setErrorText('');
    try {
      const foundResults = await onSearch(query.trim());
      setResults(foundResults);
      if (foundResults.length === 0) {
        setErrorText('No places found. Try a broader query.');
      }
    } catch {
      setResults([]);
      setErrorText('Search failed. Try again in a moment.');
    } finally {
      setLoading(false);
    }
  }, [query, onSearch]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      onLocationSelected(result.lat, result.lng, result.name);
      setExpanded(false);
      setQuery('');
      setResults([]);
      setErrorText('');
      Keyboard.dismiss();
    },
    [onLocationSelected]
  );

  const handleClose = useCallback(() => {
    setExpanded(false);
    setQuery('');
    setResults([]);
    setErrorText('');
    Keyboard.dismiss();
  }, []);

  if (!expanded) {
    return (
      <Pressable
        style={[styles.iconButton, { backgroundColor: cardBg, borderColor }]}
        accessibilityRole="button"
        accessibilityLabel="Open map search"
        onPress={() => setExpanded(true)}
      >
        <FontAwesome name="search" size={20} color={tint} />
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: cardBg, borderColor }]}>
      <View style={[styles.inputRow, { backgroundColor: 'transparent' }]}>
        <FontAwesome name="search" size={16} color={tertiaryText} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: textColor }]}
          placeholder="Search location..."
          placeholderTextColor={tertiaryText}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoFocus
        />
        {loading && <ActivityIndicator size="small" color={tint} />}
        <Pressable
          onPress={handleSearch}
          style={({ pressed }) => [
            styles.searchButton,
            { borderColor, backgroundColor: pressed ? tintSubtle : 'transparent' },
          ]}
          disabled={loading || query.trim().length === 0}
        >
          <Text
            style={styles.searchButtonText}
            lightColor={query.trim().length > 0 ? undefined : tertiaryText}
            darkColor={query.trim().length > 0 ? undefined : tertiaryText}
          >
            Go
          </Text>
        </Pressable>
        <Pressable
          onPress={handleClose}
          style={styles.closeButton}
          accessibilityLabel="Close search"
        >
          <FontAwesome name="times" size={16} color={tertiaryText} />
        </Pressable>
      </View>

      {results.length > 0 && (
        <View
          style={[styles.results, { backgroundColor: 'transparent', borderTopColor: borderColor }]}
        >
          {results.map((result, index) => (
            <Pressable
              key={`${result.lat}-${result.lng}-${index}`}
              style={[styles.resultItem, { borderTopColor: borderColor }]}
              onPress={() => handleSelect(result)}
            >
              <Text style={styles.resultText} numberOfLines={1}>
                {result.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {!loading && errorText.length > 0 && (
        <View style={[styles.errorWrap, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.errorText, { color: scorePoor }]}>{errorText}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  container: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
    maxWidth: 320,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...TypeScale.body,
    paddingVertical: 0,
  },
  closeButton: {
    minWidth: Layout.minTouchTarget,
    minHeight: Layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButton: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  searchButtonText: {
    ...TypeScale.caption1,
  },
  results: {
    borderTopWidth: 1,
  },
  resultItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
  },
  resultText: {
    ...TypeScale.subhead,
  },
  errorWrap: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  errorText: {
    ...TypeScale.caption1,
  },
});
