import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ReactElement, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initializeDatabase } from '../src/database/database';
import { colors } from '../src/shared/theme';

export default function RootLayout(): ReactElement {
  useEffect((): void => {
    initializeDatabase();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="capture" options={{ title: 'Save a Place' }} />
        <Stack.Screen name="gallery" options={{ title: 'Place Gallery' }} />
        <Stack.Screen name="map/[id]" options={{ title: 'Saved Position' }} />
        <Stack.Screen name="place/edit/[id]" options={{ title: 'Edit Place' }} />
        <Stack.Screen name="place/[id]" options={{ title: 'Place Details' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
