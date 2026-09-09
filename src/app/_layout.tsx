import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { palette } from '../theme';

export default function Layout() {
  return <>
    <StatusBar style="dark" />
    <Stack screenOptions={{ headerStyle: { backgroundColor: palette.background },
      headerTintColor: palette.ink, headerShadowVisible: false,
      contentStyle: { backgroundColor: palette.background } }}>
      <Stack.Screen name="index" options={{ title: 'Location Log' }} />
    </Stack>
  </>;
}
