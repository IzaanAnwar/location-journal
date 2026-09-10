import { useState } from 'react';
import { Image } from 'react-native';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold } from '@expo-google-fonts/outfit';
import { fonts, usePalette, useTheme, ThemeContext, type ThemeMode } from '../theme';

export default function Layout() {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [isLoaded, fontError] = useFonts({ Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold });
  if (!isLoaded && !fontError) return null;
  return <ThemeContext value={{ mode, setMode }}><JournalLayout /></ThemeContext>;
}

function JournalLayout() {
  const palette = usePalette();
  const isDark = useTheme().colorScheme === 'dark';
  return <>
    <StatusBar style={isDark ? 'light' : 'dark'} />
    <Stack screenOptions={{ headerStyle: { backgroundColor: palette.background },
      headerTintColor: palette.ink, headerShadowVisible: false,
      headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 21 },
      contentStyle: { backgroundColor: palette.background } }}>
      <Stack.Screen name="index" options={{ title: 'Location Journal', headerLeft: () =>
        <Image source={require('../../assets/location-journal-icon.png')} style={{ width: 30, height: 30, borderRadius: 9, marginRight: 10 }} accessibilityIgnoresInvertColors /> }} />
    </Stack>
  </>;
}
