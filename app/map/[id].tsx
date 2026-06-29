import { useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { ReactElement } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { getCategoryLabel } from '../../src/categories/categories';
import { getCurrentMapsUrl } from '../../src/location/externalMaps';
import { getPlaceById } from '../../src/places/placeRepository';
import { PlaceRecord } from '../../src/places/placeTypes';
import { colors, spacing } from '../../src/shared/theme';

type RouteParams = {
  readonly id?: string;
};

export default function SavedPositionScreen(): ReactElement {
  const params = useLocalSearchParams<RouteParams>();

  if (typeof params.id !== 'string') {
    throw new Error('Saved position screen requires a place id route parameter.');
  }

  const place = getPlaceById(params.id);

  const openExternalMaps = async (): Promise<void> => {
    const url = getCurrentMapsUrl(place);

    try {
      await Linking.openURL(url);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'The device could not open the saved coordinates.';
      Alert.alert('Could not open maps', message);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.eyebrow}>{getCategoryLabel(place.categoryId)}</Text>
      <Text style={styles.title}>{place.title}</Text>
      <Text style={styles.body}>This privacy-safe preview uses the saved GPS point without loading online map tiles.</Text>

      <LocalPositionCard onOpenMaps={openExternalMaps} place={place} />

      <View style={styles.photoCard}>
        <Image source={{ uri: place.photoUri }} style={styles.photo} />
        <View style={styles.photoBody}>
          <Text style={styles.photoTitle}>Photo geotag</Text>
          <Text style={styles.photoText}>{new Date(place.capturedAt).toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );
}

type LocalPositionCardProps = {
  readonly onOpenMaps: () => Promise<void>;
  readonly place: PlaceRecord;
};

const LocalPositionCard = ({ onOpenMaps, place }: LocalPositionCardProps): ReactElement => (
  <View style={styles.mapCard}>
    <View style={styles.gridLineVerticalOne} />
    <View style={styles.gridLineVerticalTwo} />
    <View style={styles.gridLineHorizontalOne} />
    <View style={styles.gridLineHorizontalTwo} />
    <View style={styles.pinOuter}>
      <View style={styles.pinInner} />
    </View>
    <View style={styles.coordinatePanel}>
      <Text style={styles.coordinateLabel}>Saved coordinates</Text>
      <Text style={styles.coordinateValue}>{place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}</Text>
      <Text style={styles.coordinateMeta}>Accuracy: {formatAccuracy(place.locationAccuracyMeters)}</Text>
      <Pressable onPress={onOpenMaps} style={styles.mapsButton}>
        <Text style={styles.mapsButtonText}>Open in Maps</Text>
      </Pressable>
    </View>
  </View>
);

const formatAccuracy = (value: number | null): string => {
  if (value === null) {
    return 'Unknown';
  }

  return `${Math.round(value)} m`;
};

const styles = StyleSheet.create({
  body: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  coordinateLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  coordinateMeta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  coordinatePanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    bottom: spacing.md,
    left: spacing.md,
    padding: spacing.md,
    position: 'absolute',
    right: spacing.md,
  },
  coordinateValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  gridLineHorizontalOne: {
    backgroundColor: '#E7D7C3',
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: '34%',
  },
  gridLineHorizontalTwo: {
    backgroundColor: '#E7D7C3',
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: '62%',
  },
  gridLineVerticalOne: {
    backgroundColor: '#E7D7C3',
    bottom: 0,
    left: '32%',
    position: 'absolute',
    top: 0,
    width: 1,
  },
  gridLineVerticalTwo: {
    backgroundColor: '#E7D7C3',
    bottom: 0,
    left: '68%',
    position: 'absolute',
    top: 0,
    width: 1,
  },
  mapCard: {
    backgroundColor: '#EFE2D1',
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    height: 360,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  mapsButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  mapsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  photo: {
    backgroundColor: colors.border,
    borderRadius: 18,
    height: 92,
    width: 92,
  },
  photoBody: {
    flex: 1,
    justifyContent: 'center',
  },
  photoCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  photoText: {
    color: colors.muted,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  photoTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  pinInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    height: 18,
    width: 18,
  },
  pinOuter: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 4,
    height: 40,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
    position: 'absolute',
    top: '45%',
    width: 40,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
});
