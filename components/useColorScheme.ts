import { useTheme } from '@/lib/ThemeContext';

export function useColorScheme() {
  const { theme } = useTheme();
  return theme;
}
