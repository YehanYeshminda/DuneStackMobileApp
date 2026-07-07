import { AppleMaps, GoogleMaps } from 'expo-maps';
import { ReactElement } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { getCategoryLabel } from '../categories/categories';
import { LocatedPlace } from '../places/placeTypes';
import { colors, spacing } from '../shared/theme';

type PlacesMapCanvasProps = {
  readonly onMarkerPress: (id: string | undefined) => void;
  readonly places: LocatedPlace[];
};

type MapCoordinates = {
  readonly latitude: number;
  readonly longitude: number;
};

/**
 * Renders the native map (Apple Maps on iOS, Google Maps on Android).
 *
 * This component statically imports expo-maps, so it must only ever be loaded
 * lazily, behind an `isMapsSupported()` check, to keep the native module out of
 * app startup.
 */
export default function PlacesMapCanvas({
  onMarkerPress,
  places,
}: PlacesMapCanvasProps): ReactElement {
  const cameraPosition = {
    coordinates: getCenter(places),
    zoom: 11,
  };

  if (Platform.OS === 'ios') {
    return (
      <AppleMaps.View
        cameraPosition={cameraPosition}
        markers={places.map(toAppleMarker)}
        onMarkerClick={(marker: AppleMaps.Marker): void => onMarkerPress(marker.id)}
        style={styles.map}
      />
    );
  }

  if (Platform.OS === 'android') {
    return (
      <GoogleMaps.View
        cameraPosition={cameraPosition}
        markers={places.map(toGoogleMarker)}
        onMarkerClick={(marker: GoogleMaps.Marker): void => onMarkerPress(marker.id)}
        style={styles.map}
      />
    );
  }

  return (
    <View style={styles.unsupported}>
      <Text style={styles.unsupportedText}>The map is available on the iOS and Android apps.</Text>
    </View>
  );
}

const toAppleMarker = (place: LocatedPlace): AppleMaps.Marker => ({
  coordinates: { latitude: place.latitude, longitude: place.longitude },
  id: place.id,
  systemImage: 'mappin.circle.fill',
  tintColor: colors.primary,
  title: place.title,
});

const toGoogleMarker = (place: LocatedPlace): GoogleMaps.Marker => ({
  coordinates: { latitude: place.latitude, longitude: place.longitude },
  id: place.id,
  snippet: getCategoryLabel(place.categoryId),
  title: place.title,
});

const getCenter = (places: LocatedPlace[]): MapCoordinates => {
  const total = places.reduce(
    (accumulator: MapCoordinates, place: LocatedPlace): MapCoordinates => ({
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
  unsupported: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  unsupportedText: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
