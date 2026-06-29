import { Link, useFocusEffect } from 'expo-router';
import { ReactElement, useCallback, useState } from 'react';
import { FlatList, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import { getCategoryLabel } from '../src/categories/categories';
import { listPlaces } from '../src/places/placeRepository';
import { PlaceRecord } from '../src/places/placeTypes';
import { colors, spacing } from '../src/shared/theme';

export default function GalleryScreen(): ReactElement {
  const [places, setPlaces] = useState<PlaceRecord[]>([]);

  const loadPlaces = useCallback((): void => {
    setPlaces(listPlaces(''));
  }, []);

  useFocusEffect(loadPlaces);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Gallery</Text>
      <Text style={styles.body}>
        A photo-first view of every place saved locally on this device.
      </Text>

      <FlatList
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        data={places}
        keyExtractor={(item: PlaceRecord): string => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No photos saved yet. Capture a place to build your gallery.
          </Text>
        }
        numColumns={2}
        renderItem={({ item }: { item: PlaceRecord }): ReactElement => (
          <Link asChild href={`/place/${item.id}`}>
            <Pressable style={styles.tile}>
              <ImageBackground
                imageStyle={styles.tileImage}
                source={{ uri: item.photoUri }}
                style={styles.tileImageBackground}
              >
                <View style={styles.tileOverlay}>
                  <Text numberOfLines={1} style={styles.tileTitle}>
                    {item.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.tileMeta}>
                    {getCategoryLabel(item.categoryId)}
                  </Text>
                </View>
              </ImageBackground>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  columnWrapper: {
    gap: spacing.md,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    padding: spacing.lg,
    textAlign: 'center',
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.lg,
  },
  tile: {
    aspectRatio: 0.78,
    borderRadius: 24,
    flex: 1,
    overflow: 'hidden',
  },
  tileImage: {
    borderRadius: 24,
  },
  tileImageBackground: {
    backgroundColor: colors.border,
    flex: 1,
    justifyContent: 'flex-end',
  },
  tileMeta: {
    color: '#E8EEF4',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  tileOverlay: {
    backgroundColor: 'rgba(16, 32, 43, 0.64)',
    padding: spacing.md,
  },
  tileTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    marginBottom: spacing.xs,
  },
});
