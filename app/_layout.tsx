import { ThemeProvider } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router/stack';

import { AppProviders } from '@/src/providers/app-providers';
import { useNavigationTheme, useThemeMode } from '@/src/theme';

function RootNavigator() {
  const navigationTheme = useNavigationTheme();
  const themeMode = useThemeMode();

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
