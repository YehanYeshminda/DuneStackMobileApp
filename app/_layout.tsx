import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ReactElement, useCallback, useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplash } from '../src/components/AnimatedSplash';
import { initializeDatabase } from '../src/database/database';
import { colors } from '../src/shared/theme';

// Keep the native splash up until the animated overlay takes over.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout(): ReactElement {
  const [splashDone, setSplashDone] = useState<boolean>(false);

  useEffect((): void => {
    initializeDatabase();
  }, []);

  const handleSplashFinish = useCallback((): void => {
    setSplashDone(true);
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
        <Stack.Screen name="capture" options={{ headerShown: false }} />
        <Stack.Screen name="gallery" options={{ headerShown: false }} />
        <Stack.Screen name="collections/index" options={{ headerShown: false }} />
        <Stack.Screen name="collections/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="map/[id]" options={{ title: 'Saved Position' }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="place/edit/[id]" options={{ title: 'Edit Place' }} />
        <Stack.Screen name="place/add-photo/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="place/[id]" options={{ headerShown: false }} />
      </Stack>
      {!splashDone && <AnimatedSplash onFinish={handleSplashFinish} />}
    </SafeAreaProvider>
  );
}
