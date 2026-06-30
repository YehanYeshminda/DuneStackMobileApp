import { router, useFocusEffect } from 'expo-router';
import { lazy, ReactElement, Suspense, useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { isMapsSupported } from '../../src/maps/mapsSupport';
import { useIsOnline } from '../../src/network/useIsOnline';
import { listPlaces } from '../../src/places/placeRepository';
import { PlaceRecord } from '../../src/places/placeTypes';
import { colors, spacing } from '../../src/shared/theme';

// Lazily loaded so the expo-maps native module is never required at app
// startup — only when this screen actually renders the map.
const PlacesMapCanvas = lazy(() => import('../../src/maps/PlacesMapCanvas'));

export default function PlacesMapScreen(): ReactElement {
  const [places, setPlaces] = useState<PlaceRecord[]>([]);
  const isOnline = useIsOnline();

  useFocusEffect(
    useCallback((): void => {
      setPlaces(listPlaces(''));
    }, []),
  );

  const openPlace = useCallback((id: string | undefined): void => {
    if (id === undefined) {
      return;
    }

    router.push(`/place/${id}`);
  }, []);

  if (!isMapsSupported()) {
    return (
      <MapMessage
        body="The map needs the full app build and isn't available in Expo Go."
        title="Map isn't available here"
      />
    );
  }

  if (!isOnline) {
    return (
      <MapMessage
        body="Reconnect to view your places on the map."
        title="Map needs an internet connection"
      />
    );
  }

  if (places.length === 0) {
    return (
      <MapMessage
        body="Save a place with a photo and it will appear here on the map."
        title="No places to map yet"
      />
    );
  }

  return (
    <Suspense
      fallback={
        <View style={styles.messageScreen}>
          <ActivityIndicator color={colors.primary} />
        </View>
      }
    >
      <PlacesMapCanvas onMarkerPress={openPlace} places={places} />
    </Suspense>
  );
}

type MapMessageProps = {
  readonly body: string;
  readonly title: string;
};

const MapMessage = ({ body, title }: MapMessageProps): ReactElement => (
  <View style={styles.messageScreen}>
    <Text style={styles.messageTitle}>{title}</Text>
    <Text style={styles.messageBody}>{body}</Text>
  </View>
);

const styles = StyleSheet.create({
  messageBody: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  messageScreen: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  messageTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
});
