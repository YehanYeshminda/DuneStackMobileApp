import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ReactElement, useCallback, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCategoryColor, getCategoryLabel } from '../../src/categories/categories';
import { deleteLocalImage } from '../../src/files/localImages';
import { getCurrentMapsUrl } from '../../src/location/externalMaps';
import { listPlacePhotos } from '../../src/places/placePhotoRepository';
import { deletePlace, getPlaceById, setPlaceFavorite } from '../../src/places/placeRepository';
import { PlacePhotoRecord, PlaceRecord } from '../../src/places/placeTypes';
import { colors, fonts, spacing } from '../../src/shared/theme';

type RouteParams = {
  readonly id?: string;
};

export default function PlaceDetailScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<RouteParams>();
  const carouselRef = useRef<ScrollView>(null);
  const [place, setPlace] = useState<PlaceRecord | null>(null);
  const [photos, setPhotos] = useState<PlacePhotoRecord[]>([]);
  const [photoIndex, setPhotoIndex] = useState<number>(0);

  const loadPlace = useCallback((): void => {
    if (typeof params.id !== 'string') {
      throw new Error('Place detail screen requires a place id route parameter.');
    }

    const loaded = getPlaceById(params.id);
    setPlace(loaded);
    setPhotos(listPlacePhotos(loaded.id));
    setPhotoIndex(0);
  }, [params.id]);

  const pageWidth = width - spacing.lg * 2;

  useFocusEffect(loadPlace);

  const toggleFavorite = (): void => {
    if (place === null) {
      return;
    }

    setPlace(setPlaceFavorite(place.id, !place.isFavorite));
  };

  const openExternalMaps = async (): Promise<void> => {
    if (place === null || place.latitude === null || place.longitude === null) {
      return;
    }

    try {
      await Linking.openURL(getCurrentMapsUrl(place));
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'The device could not open the location.';
      Alert.alert('Could not open maps', message);
    }
  };

  const confirmDelete = (): void => {
    if (place === null) {
      return;
    }

    Alert.alert(
      'Delete place?',
      'This removes the local record and its saved photo from this app.',
      [
        { style: 'cancel', text: 'Cancel' },
        { onPress: deleteCurrentPlace, style: 'destructive', text: 'Delete' },
      ],
    );
  };

  const deleteCurrentPlace = async (): Promise<void> => {
    if (place === null) {
      return;
    }

    try {
      deletePlace(place.id);
      const uris = photos.length > 0 ? photos.map((photo: PlacePhotoRecord): string => photo.uri) : [place.photoUri];
      for (const uri of uris) {
        await deleteLocalImage(uri);
      }
      router.replace('/');
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'An unknown error occurred while deleting this place.';
      Alert.alert('Could not delete place', message);
    }
  };

  if (place === null) {
    return (
      <View style={[styles.screen, styles.loading, { paddingTop: insets.top + spacing.xl }]}>
        <Text style={styles.mutedText}>Loading place...</Text>
      </View>
    );
  }

  const tags = parseTags(place.tags);
  const hasLocation = place.latitude !== null && place.longitude !== null;
  const displayPhotos: PlacePhotoRecord[] =
    photos.length > 0
      ? photos
      : [{ id: 'cover', placeId: place.id, position: 0, uri: place.photoUri }];

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={(): void => router.back()}
            style={styles.iconButton}
          >
            <Ionicons color={colors.text} name="chevron-back" size={20} />
          </Pressable>
          <Text
            numberOfLines={1}
            style={[styles.headerCategory, { color: getCategoryColor(place.categoryId) }]}
          >
            {getCategoryLabel(place.categoryId).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerSide}>
          <Pressable
            accessibilityLabel="Toggle favorite"
            accessibilityRole="button"
            onPress={toggleFavorite}
          >
            <Ionicons
              color={colors.accent}
              name={place.isFavorite ? 'heart' : 'heart-outline'}
              size={22}
            />
          </Pressable>
          <Pressable onPress={(): void => router.push(`/place/edit/${place.id}`)}>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScrollView
          horizontal
          onMomentumScrollEnd={(event): void =>
            setPhotoIndex(Math.round(event.nativeEvent.contentOffset.x / pageWidth))
          }
          pagingEnabled
          ref={carouselRef}
          showsHorizontalScrollIndicator={false}
          style={{ width: pageWidth }}
        >
          {displayPhotos.map((photo: PlacePhotoRecord): ReactElement => (
            <Image key={photo.id} source={{ uri: photo.uri }} style={[styles.photo, { width: pageWidth }]} />
          ))}
        </ScrollView>

        <View style={styles.photoStrip}>
          {displayPhotos.length > 1 ? (
            <Text style={styles.photoCounter}>
              {photoIndex + 1} of {displayPhotos.length}
            </Text>
          ) : (
            <View />
          )}
          <View style={styles.thumbs}>
            {displayPhotos.map((photo: PlacePhotoRecord, index: number): ReactElement => (
              <Pressable
                key={photo.id}
                onPress={(): void => {
                  carouselRef.current?.scrollTo({ animated: true, x: index * pageWidth });
                  setPhotoIndex(index);
                }}
              >
                <Image
                  source={{ uri: photo.uri }}
                  style={[styles.thumb, index === photoIndex ? styles.thumbActive : undefined]}
                />
              </Pressable>
            ))}
            <Pressable
              accessibilityLabel="Add a photo"
              accessibilityRole="button"
              onPress={(): void => router.push(`/place/add-photo/${place.id}`)}
              style={styles.addThumb}
            >
              <Ionicons color={colors.muted} name="add" size={22} />
            </Pressable>
          </View>
        </View>

        <Text style={styles.title}>{place.title}</Text>

        <View style={styles.metaRow}>
          <Stars rating={place.rating} />
          <Text style={styles.date}>{formatDate(place.capturedAt)}</Text>
        </View>

        <Text style={styles.sectionLabel}>NOTES</Text>
        <Text style={styles.notes}>{place.notes.length > 0 ? place.notes : 'No notes yet.'}</Text>

        {tags.length > 0 ? (
          <View style={styles.tags}>
            {tags.map((tag: string): ReactElement => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {hasLocation || place.addressLabel.length > 0 ? (
          <View style={styles.locationCard}>
            <Ionicons color={colors.accent} name="location" size={22} />
            <View style={styles.locationBody}>
              <Text style={styles.locationTitle}>
                {place.addressLabel.length > 0 ? place.addressLabel : 'Saved location'}
              </Text>
              {hasLocation ? (
                <Text style={styles.locationCoords}>
                  {place.latitude?.toFixed(4)}, {place.longitude?.toFixed(4)}
                </Text>
              ) : null}
            </View>
            {hasLocation ? (
              <Pressable
                onPress={(): void => {
                  void openExternalMaps();
                }}
                style={styles.mapsButton}
              >
                <Text style={styles.mapsButtonText}>Open in Maps ›</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Pressable onPress={confirmDelete} style={styles.deleteButton}>
          <Text style={styles.deleteText}>Delete place</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const Stars = ({ rating }: { readonly rating: number | null }): ReactElement => {
  const filled = rating ?? 0;

  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((value: number): ReactElement => (
        <Ionicons
          color={value <= filled ? colors.accent : colors.border}
          key={value}
          name={value <= filled ? 'star' : 'star-outline'}
          size={15}
        />
      ))}
    </View>
  );
};

const parseTags = (tags: string): string[] =>
  tags
    .split(/[\s,]+/)
    .map((tag: string): string => tag.trim())
    .filter((tag: string): boolean => tag.length > 0);

const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  date: {
    color: colors.muted,
    fontSize: 14,
  },
  deleteButton: {
    alignItems: 'center',
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  deleteText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
  editText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headerCategory: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerSide: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  loading: {
    alignItems: 'center',
  },
  locationBody: {
    flex: 1,
  },
  locationCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  locationCoords: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  locationTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  mapsButton: {
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mapsButtonText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  mutedText: {
    color: colors.muted,
    fontSize: 16,
  },
  notes: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    marginTop: spacing.xs,
  },
  photo: {
    aspectRatio: 4 / 3,
    backgroundColor: colors.border,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  photoCounter: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  photoStrip: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  addThumb: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  thumb: {
    backgroundColor: colors.border,
    borderRadius: 8,
    height: 44,
    width: 44,
  },
  thumbActive: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  thumbs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'flex-end',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: spacing.lg,
  },
  stars: {
    flexDirection: 'row',
    gap: 3,
  },
  tag: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  tagText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 34,
    marginTop: spacing.md,
  },
});
