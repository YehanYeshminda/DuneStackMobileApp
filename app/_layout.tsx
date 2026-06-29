import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ReactElement, useEffect } from 'react';

import { initializeDatabase } from '../src/database/database';

export default function RootLayout(): ReactElement {
  useEffect((): void => {
    initializeDatabase();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: '#F7F2EA' },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#F7F2EA' },
          headerTintColor: '#24170F',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'DuneStack Places' }} />
        <Stack.Screen name="capture" options={{ title: 'Save a Place' }} />
        <Stack.Screen name="gallery" options={{ title: 'Place Gallery' }} />
        <Stack.Screen name="map/[id]" options={{ title: 'Saved Position' }} />
        <Stack.Screen name="settings" options={{ title: 'Privacy & Backups' }} />
        <Stack.Screen name="place/edit/[id]" options={{ title: 'Edit Place' }} />
        <Stack.Screen name="place/[id]" options={{ title: 'Place Details' }} />
      </Stack>
    </>
  );
}
