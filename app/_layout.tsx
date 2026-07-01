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
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="capture" options={{ headerShown: false }} />
        <Stack.Screen name="gallery" options={{ title: 'Place Gallery' }} />
        <Stack.Screen name="map/index" options={{ title: 'Explore' }} />
        <Stack.Screen name="map/[id]" options={{ title: 'Saved Position' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="place/edit/[id]" options={{ title: 'Edit Place' }} />
        <Stack.Screen name="place/[id]" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
