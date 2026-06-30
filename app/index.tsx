import { Link, useFocusEffect } from 'expo-router';
import { ReactElement, useCallback, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { getCategoryLabel } from '../src/categories/categories';
import { isMapsSupported } from '../src/maps/mapsSupport';
import { useIsOnline } from '../src/network/useIsOnline';
import { listPlaces } from '../src/places/placeRepository';
import { PlaceRecord } from '../src/places/placeTypes';
import { colors, spacing } from '../src/shared/theme';

type PlaceFilter = 'all' | 'favorites';

export default function HomeScreen(): ReactElement {
  const [places, setPlaces] = useState<PlaceRecord[]>([]);
  const [placeFilter, setPlaceFilter] = useState<PlaceFilter>('all');
  const [query, setQuery] = useState<string>('');
  const isOnline = useIsOnline();
  const showMap = isOnline && isMapsSupported();

  const loadPlaces = useCallback((): void => {
    const savedPlaces = listPlaces(query);

    if (placeFilter === 'favorites') {
      setPlaces(filterFavoritePlaces(savedPlaces));
      return;
    }

    setPlaces(savedPlaces);
  }, [placeFilter, query]);

  useFocusEffect(loadPlaces);

  const emptyText = placeFilter === 'favorites' ? 'No favorites yet.' : 'No places saved yet.';

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>DuneStack Places</Text>

      <View style={styles.actions}>
        <Link asChild href="/capture">
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Add Place</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.navRow}>
        {showMap ? (
          <Link asChild href="/map">
            <Pressable style={[styles.secondaryButton, styles.navButton]}>
              <Text style={styles.secondaryButtonText}>Map</Text>
            </Pressable>
          </Link>
        ) : null}
        <Link asChild href="/timeline">
          <Pressable style={[styles.secondaryButton, styles.navButton]}>
            <Text style={styles.secondaryButtonText}>Timeline</Text>
          </Pressable>
        </Link>
        <Link asChild href="/gallery">
          <Pressable style={[styles.secondaryButton, styles.navButton]}>
            <Text style={styles.secondaryButtonText}>Gallery</Text>
          </Pressable>
        </Link>
      </View>

      <TextInput
        onChangeText={setQuery}
        placeholder="Search places"
        placeholderTextColor={colors.muted}
        style={styles.search}
        value={query}
      />

      <View style={styles.filterBar}>
        <Pressable
          onPress={(): void => setPlaceFilter('all')}
          style={[
            styles.filterButton,
            placeFilter === 'all' ? styles.filterButtonActive : styles.filterButtonIdle,
          ]}
        >
          <Text
            style={[
              styles.filterButtonText,
              placeFilter === 'all' ? styles.filterButtonTextActive : styles.filterButtonTextIdle,
            ]}
          >
            All
          </Text>
        </Pressable>
        <Pressable
          onPress={(): void => setPlaceFilter('favorites')}
          style={[
            styles.filterButton,
            placeFilter === 'favorites' ? styles.filterButtonActive : styles.filterButtonIdle,
          ]}
        >
          <Text
            style={[
              styles.filterButtonText,
              placeFilter === 'favorites'
                ? styles.filterButtonTextActive
                : styles.filterButtonTextIdle,
            ]}
          >
            Favorites
          </Text>
        </Pressable>
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={places}
        keyExtractor={(item: PlaceRecord): string => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>{emptyText}</Text>}
        renderItem={({ item }: { item: PlaceRecord }): ReactElement => (
          <Link asChild href={`/place/${item.id}`}>
            <Pressable style={styles.card}>
              <Image source={{ uri: item.photoUri }} style={styles.cardImage} />
              <View style={styles.cardOverlay}>
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>{getCategoryLabel(item.categoryId)}</Text>
                </View>
                <View>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardMeta}>
                    {new Date(item.capturedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </Pressable>
          </Link>
        )}
        style={styles.list}
      />

      <PrivacyFooter />
    </View>
  );
}

const filterFavoritePlaces = (places: PlaceRecord[]): PlaceRecord[] =>
  places.filter((place: PlaceRecord): boolean => place.isFavorite);

const PrivacyFooter = (): ReactElement => (
  <Link asChild href="/settings">
    <Pressable style={styles.privacyLink}>
      <Text style={styles.privacyLinkText}>Privacy & Backups</Text>
    </Pressable>
  </Link>
);

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.border,
    borderRadius: 22,
    height: 240,
    overflow: 'hidden',
  },
  cardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  cardBadgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  cardMeta: {
    color: '#E8EEF4',
    fontSize: 14,
    marginTop: 4,
  },
  cardImage: {
    height: '100%',
    width: '100%',
  },
  cardOverlay: {
    backgroundColor: 'rgba(16, 32, 43, 0.40)',
    bottom: 0,
    justifyContent: 'space-between',
    left: 0,
    padding: spacing.md,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    padding: spacing.lg,
    textAlign: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterButton: {
    alignItems: 'center',
    borderRadius: 18,
    flex: 1,
    padding: spacing.sm,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonIdle: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  filterButtonTextIdle: {
    color: colors.text,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  list: {
    flex: 1,
  },
  navButton: {
    flex: 1,
  },
  navRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    flex: 1,
    padding: spacing.md,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  privacyLink: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  privacyLinkText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    padding: spacing.lg,
  },
  search: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    marginBottom: spacing.md,
  },
});
