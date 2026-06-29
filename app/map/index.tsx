import { AppleMaps, GoogleMaps } from 'expo-maps';
import { router, useFocusEffect } from 'expo-router';
import { ReactElement, useCallback, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { getCategoryLabel } from '../../src/categories/categories';
import { useIsOnline } from '../../src/network/useIsOnline';
import { listPlaces } from '../../src/places/placeRepository';
import { PlaceRecord } from '../../src/places/placeTypes';
import { colors, spacing } from '../../src/shared/theme';

type MapCoordinates = {
  readonly latitude: number;
  readonly longitude: number;
};

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

  if (!isOnline) {
    return (
      <View style={styles.messageScreen}>
        <Text style={styles.messageTitle}>Map needs an internet connection</Text>
        <Text style={styles.messageBody}>Reconnect to view your places on the map.</Text>
      </View>
    );
  }

  if (places.length === 0) {
    return (
      <View style={styles.messageScreen}>
        <Text style={styles.messageTitle}>No places to map yet</Text>
        <Text style={styles.messageBody}>
          Save a place with a photo and it will appear here on the map.
        </Text>
      </View>
    );
  }

  const cameraPosition = {
    coordinates: getCenter(places),
    zoom: 11,
  };

  if (Platform.OS === 'ios') {
    return (
      <AppleMaps.View
        cameraPosition={cameraPosition}
        markers={places.map(toAppleMarker)}
        onMarkerClick={(marker: AppleMaps.Marker): void => openPlace(marker.id)}
        style={styles.map}
      />
    );
  }

  if (Platform.OS === 'android') {
    return (
      <GoogleMaps.View
        cameraPosition={cameraPosition}
        markers={places.map(toGoogleMarker)}
        onMarkerClick={(marker: GoogleMaps.Marker): void => openPlace(marker.id)}
        style={styles.map}
      />
    );
  }

  return (
    <View style={styles.messageScreen}>
      <Text style={styles.messageTitle}>Map unavailable here</Text>
      <Text style={styles.messageBody}>Open the map from the iOS or Android app.</Text>
    </View>
  );
}

const toAppleMarker = (place: PlaceRecord): AppleMaps.Marker => ({
  coordinates: { latitude: place.latitude, longitude: place.longitude },
  id: place.id,
  systemImage: 'mappin.circle.fill',
  tintColor: colors.primary,
  title: place.title,
});

const toGoogleMarker = (place: PlaceRecord): GoogleMaps.Marker => ({
  coordinates: { latitude: place.latitude, longitude: place.longitude },
  id: place.id,
  snippet: getCategoryLabel(place.categoryId),
  title: place.title,
});

const getCenter = (places: PlaceRecord[]): MapCoordinates => {
  const total = places.reduce(
    (accumulator: MapCoordinates, place: PlaceRecord): MapCoordinates => ({
      latitude: accumulator.latitude + place.latitude,
      longitude: accumulator.longitude + place.longitude,
    }),
    { latitude: 0, longitude: 0 },
  );

  return {
    latitude: total.latitude / places.length,
    longitude: total.longitude / places.length,
  };
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
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
