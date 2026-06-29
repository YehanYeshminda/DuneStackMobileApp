import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ReactElement, useCallback, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getCategoryLabel } from '../../src/categories/categories';
import { deleteLocalImage } from '../../src/files/localImages';
import { deletePlace, getPlaceById, setPlaceFavorite } from '../../src/places/placeRepository';
import { PlaceRecord } from '../../src/places/placeTypes';
import { colors, spacing } from '../../src/shared/theme';

type RouteParams = {
  readonly id?: string;
};

export default function PlaceDetailScreen(): ReactElement {
  const params = useLocalSearchParams<RouteParams>();
  const [place, setPlace] = useState<PlaceRecord | null>(null);

  const loadPlace = useCallback((): void => {
    if (typeof params.id !== 'string') {
      throw new Error('Place detail screen requires a place id route parameter.');
    }

    setPlace(getPlaceById(params.id));
  }, [params.id]);

  useFocusEffect(loadPlace);

  const toggleFavorite = (): void => {
    if (place === null) {
      return;
    }

    setPlace(setPlaceFavorite(place.id, !place.isFavorite));
  };

  const confirmDelete = (): void => {
    if (place === null) {
      return;
    }

    Alert.alert('Delete place?', 'This removes the local record and its saved photo from this app.', [
      { style: 'cancel', text: 'Cancel' },
      {
        onPress: deleteCurrentPlace,
        style: 'destructive',
        text: 'Delete',
      },
    ]);
  };

  const deleteCurrentPlace = async (): Promise<void> => {
    if (place === null) {
      return;
    }

    try {
      deletePlace(place.id);
      await deleteLocalImage(place.photoUri);
      router.replace('/');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred while deleting this place.';
      Alert.alert('Could not delete place', message);
    }
  };

  if (place === null) {
    return (
      <View style={styles.screen}>
        <Text style={styles.body}>Loading place...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Image source={{ uri: place.photoUri }} style={styles.image} />
      <Text style={styles.category}>{getCategoryLabel(place.categoryId)}</Text>
      <Text style={styles.title}>{place.title}</Text>

      <View style={styles.metaGrid}>
        <InfoCard label="Latitude" value={place.latitude.toFixed(6)} />
        <InfoCard label="Longitude" value={place.longitude.toFixed(6)} />
        <InfoCard label="Captured" value={new Date(place.capturedAt).toLocaleString()} />
        <InfoCard label="Accuracy" value={formatAccuracy(place.locationAccuracyMeters)} />
      </View>

      <Section title="Notes" value={place.notes.length > 0 ? place.notes : 'No notes saved.'} />
      <Section title="Tags" value={place.tags.length > 0 ? place.tags : 'No tags saved.'} />
      <Section title="Address Label" value={place.addressLabel.length > 0 ? place.addressLabel : 'No manual label saved.'} />
      <Section title="Rating" value={place.rating === null ? 'No rating saved.' : `${place.rating} / 5`} />

      <View style={styles.actions}>
        <Pressable onPress={(): void => router.push(`/place/edit/${place.id}`)} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Edit Place</Text>
        </Pressable>
        <Pressable onPress={(): void => router.push(`/map/${place.id}`)} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>View Saved Position</Text>
        </Pressable>
        <Pressable onPress={toggleFavorite} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>{place.isFavorite ? 'Remove Favorite' : 'Mark Favorite'}</Text>
        </Pressable>
        <Pressable onPress={confirmDelete} style={styles.dangerButton}>
          <Text style={styles.dangerButtonText}>Delete</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

type InfoCardProps = {
  readonly label: string;
  readonly value: string;
};

const InfoCard = ({ label, value }: InfoCardProps): ReactElement => (
  <View style={styles.infoCard}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

type SectionProps = {
  readonly title: string;
  readonly value: string;
};

const Section = ({ title, value }: SectionProps): ReactElement => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.body}>{value}</Text>
  </View>
);

const formatAccuracy = (value: number | null): string => {
  if (value === null) {
    return 'Unknown';
  }

  return `${Math.round(value)} m`;
};

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  body: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  category: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: spacing.lg,
    textTransform: 'uppercase',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  dangerButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.danger,
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.md,
  },
  dangerButtonText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '800',
  },
  image: {
    backgroundColor: colors.border,
    borderRadius: 26,
    height: 320,
    width: '100%',
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexBasis: '48%',
    gap: spacing.xs,
    padding: spacing.md,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  infoValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginVertical: spacing.lg,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    padding: spacing.md,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.md,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  section: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.xs,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    marginTop: spacing.xs,
  },
});
