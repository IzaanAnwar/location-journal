import { createContext, use } from 'react';
import { useColorScheme } from 'react-native';

export const palette = {
  background: '#F1F4F3', surface: '#FCFDFC', ink: '#172B26', muted: '#546B63',
  line: '#D8E3DE', accent: '#116653', accentSoft: '#DFEEE6', warning: '#884017', warningSoft: '#FFF0E5',
};
export type Palette = typeof palette;
const darkPalette: Palette = {
  background: '#101B17', surface: '#1A2B23', ink: '#ECF4EF', muted: '#B0C5B9',
  line: '#354C40', accent: '#9BDDBB', accentSoft: '#253F31', warning: '#FFC493', warningSoft: '#3B2A20',
};
export const fonts = { regular: 'Outfit_400Regular', medium: 'Outfit_500Medium', semibold: 'Outfit_600SemiBold' };
export type ThemeMode = 'system' | 'light' | 'dark';
export const ThemeContext = createContext<{ mode: ThemeMode; setMode: (mode: ThemeMode) => void }>({ mode: 'system', setMode: () => {} });
export function useTheme() {
  const context = use(ThemeContext);
  const system = useColorScheme();
  return { ...context, colorScheme: context.mode === 'system' ? system ?? 'light' : context.mode };
}
export function usePalette(): Palette { return useTheme().colorScheme === 'dark' ? darkPalette : palette; }
