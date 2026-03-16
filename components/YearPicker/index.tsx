import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  InputAccessoryView,
  View as RNView,
} from 'react-native';
import { Text, useThemeColor } from '@/components/Themed';
import { Radius, Spacing, TypeScale } from '@/constants/theme';

interface YearPickerProps {
  visible: boolean;
  onConfirm: (year: number) => void;
  onCancel: () => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const INPUT_ACCESSORY_ID = 'yearPickerAccessory';

export default function YearPicker({ visible, onConfirm, onCancel }: YearPickerProps) {
  const [yearText, setYearText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const tint = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const secondaryText = useThemeColor({}, 'secondaryText');
  const bgColor = useThemeColor({}, 'background');
  const overlayColor = useThemeColor({}, 'overlay');
  const scorePoor = useThemeColor({}, 'scorePoor');
  const tertiaryText = useThemeColor({}, 'tertiaryText');
  const backgroundTertiary = useThemeColor({}, 'backgroundTertiary');
  const inverseText = useThemeColor({}, 'inverseText');

  const normalizedYearText = yearText.replace(/[^0-9]/g, '').slice(0, 4);
  const year = parseInt(normalizedYearText.trim(), 10);
  const isValid =
    normalizedYearText.length === 4 && !isNaN(year) && year >= 1800 && year <= CURRENT_YEAR;

  // Reset text when modal opens
  useEffect(() => {
    if (visible) {
      setYearText('');
    }
  }, [visible]);

  const handleConfirm = useCallback(() => {
    const parsed = parseInt(normalizedYearText.trim(), 10);
    const valid =
      normalizedYearText.length === 4 && !isNaN(parsed) && parsed >= 1800 && parsed <= CURRENT_YEAR;
    if (!valid) return;
    Keyboard.dismiss();
    onConfirm(parsed);
  }, [normalizedYearText, onConfirm]);

  const handleCancel = useCallback(() => {
    Keyboard.dismiss();
    onCancel();
  }, [onCancel]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <RNView style={[styles.overlay, { backgroundColor: overlayColor }]}>
        {/* Backdrop - tapping dismisses keyboard only */}
        <Pressable style={styles.backdrop} onPress={() => Keyboard.dismiss()} />

        <KeyboardAvoidingView
          style={styles.avoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
          pointerEvents="box-none"
        >
          <Pressable
            // Block taps from falling through to the backdrop
            onPress={() => {}}
            style={[styles.sheet, { backgroundColor: bgColor, borderColor }]}
          >
            <RNView style={[styles.handle, { backgroundColor: borderColor }]} />

            <Text style={styles.title}>What year was this photo taken?</Text>

            <TextInput
              ref={inputRef}
              style={[
                styles.yearInput,
                {
                  borderColor: isValid || normalizedYearText.length === 0 ? borderColor : scorePoor,
                  color: textColor,
                },
              ]}
              placeholder="Enter year (e.g. 1990)"
              placeholderTextColor={secondaryText}
              keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
              maxLength={4}
              value={normalizedYearText}
              onChangeText={setYearText}
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
              blurOnSubmit={false}
              autoFocus
              inputAccessoryViewID={Platform.OS === 'ios' ? INPUT_ACCESSORY_ID : undefined}
            />

            {normalizedYearText.length > 0 && !isValid && (
              <Text style={[styles.error, { color: scorePoor }]}>
                Enter a year between 1800 and {CURRENT_YEAR}
              </Text>
            )}

            <RNView style={styles.buttons}>
              <Pressable style={[styles.cancelBtn, { borderColor }]} onPress={handleCancel}>
                <Text style={styles.confirmText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.confirmBtn,
                  {
                    backgroundColor: isValid ? tint : backgroundTertiary,
                    opacity: isValid ? 1 : 0.5,
                  },
                ]}
                onPress={handleConfirm}
                hitSlop={12}
                disabled={!isValid}
              >
                <Text style={[styles.confirmText, { color: isValid ? inverseText : tertiaryText }]}>
                  Confirm
                </Text>
              </Pressable>
            </RNView>
          </Pressable>
        </KeyboardAvoidingView>
      </RNView>

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={INPUT_ACCESSORY_ID}>
          <RNView
            style={[styles.accessory, { backgroundColor: bgColor, borderTopColor: borderColor }]}
          >
            <Pressable onPress={handleCancel} hitSlop={8}>
              <Text style={[styles.accessoryBtn, { color: secondaryText }]}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleConfirm} hitSlop={8} disabled={!isValid}>
              <Text
                style={[
                  styles.accessoryBtn,
                  styles.accessoryConfirm,
                  { color: isValid ? tint : tertiaryText },
                ]}
              >
                Confirm
              </Text>
            </Pressable>
          </RNView>
        </InputAccessoryView>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // overlay color applied dynamically
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  avoidingView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Radius.sheet,
    borderWidth: 1,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  handle: {
    width: 36,
    height: Spacing.xs,
    borderRadius: Radius.sm,
    alignSelf: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...TypeScale.title3,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  yearInput: {
    borderWidth: 2,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.buttonY,
    ...TypeScale.title2,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  error: {
    ...TypeScale.footnote,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.buttonY,
    borderRadius: Radius.sheet,
    borderWidth: 1,
    alignItems: 'center',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: Spacing.buttonY,
    borderRadius: Radius.sheet,
    alignItems: 'center',
  },
  confirmText: {
    ...TypeScale.callout,
    fontWeight: '600',
  },
  accessory: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  accessoryBtn: {
    ...TypeScale.callout,
    fontWeight: '500',
  },
  accessoryConfirm: {
    fontWeight: '700',
  },
});
