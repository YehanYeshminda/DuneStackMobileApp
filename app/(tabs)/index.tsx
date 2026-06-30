import { Ionicons } from '@expo/vector-icons';
import { Link, useFocusEffect } from 'expo-router';
import { ReactElement, useCallback, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCategoryLabel } from '../../src/categories/categories';
import { listPlaces } from '../../src/places/placeRepository';
import { PlaceRecord } from '../../src/places/placeTypes';
import { colors, spacing } from '../../src/shared/theme';

type PlaceFilter = 'all' | 'favorites';

const FILTERS: readonly PlaceFilter[] = ['all', 'favorites'];

export default function PlacesScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const [places, setPlaces] = useState<PlaceRecord[]>([]);
  const [placeFilter, setPlaceFilter] = useState<PlaceFilter>('all');
  const [query, setQuery] = useState<string>('');

  const loadPlaces = useCallback((): void => {
    const savedPlaces = listPlaces(query);

    setPlaces(
      placeFilter === 'favorites'
        ? savedPlaces.filter((place: PlaceRecord): boolean => place.isFavorite)
        : savedPlaces,
    );
  }, [placeFilter, query]);

  useFocusEffect(loadPlaces);

  const emptyText = placeFilter === 'favorites' ? 'No favorites yet.' : 'No places saved yet.';

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Your</Text>
          <Text style={styles.title}>Places</Text>
        </View>
        <Link asChild href="/gallery">
          <Pressable accessibilityLabel="Open gallery" accessibilityRole="button" style={styles.iconButton}>
            <Ionicons color={colors.primary} name="images-outline" size={22} />
          </Pressable>
        </Link>
      </View>

      <View style={styles.searchRow}>
        <Ionicons color={colors.muted} name="search" size={18} />
        <TextInput
          onChangeText={setQuery}
          placeholder="Search places"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          value={query}
        />
      </View>

      <View style={styles.filterBar}>
        {FILTERS.map((filter: PlaceFilter): ReactElement => {
          const isActive = placeFilter === filter;

          return (
            <Pressable
              key={filter}
              onPress={(): void => setPlaceFilter(filter)}
              style={[styles.filterChip, isActive ? styles.filterChipActive : styles.filterChipIdle]}
            >
              <Text style={isActive ? styles.filterTextActive : styles.filterTextIdle}>
                {filter === 'all' ? 'All' : 'Favorites'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={places}
        keyExtractor={(item: PlaceRecord): string => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>{emptyText}</Text>}
        renderItem={({ item }: { item: PlaceRecord }): ReactElement => <PlaceCard place={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const PlaceCard = ({ place }: { readonly place: PlaceRecord }): ReactElement => (
  <Link asChild href={`/place/${place.id}`}>
    <Pressable style={styles.card}>
      <Image source={{ uri: place.photoUri }} style={styles.cardImage} />
      <View style={styles.cardOverlay}>
        <View style={styles.cardTopRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{getCategoryLabel(place.categoryId)}</Text>
          </View>
          {place.isFavorite ? <Ionicons color={colors.accent} name="star" size={18} /> : null}
        </View>
        <View>
          <Text style={styles.cardTitle}>{place.title}</Text>
          <Text style={styles.cardMeta}>{new Date(place.capturedAt).toLocaleDateString()}</Text>
        </View>
      </View>
    </Pressable>
  </Link>
);

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    backgroundColor: colors.border,
    borderRadius: 20,
    height: 220,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardImage: {
    height: '100%',
    width: '100%',
  },
  cardMeta: {
    color: '#E8EEF4',
    fontSize: 13,
    marginTop: 2,
  },
  cardOverlay: {
    backgroundColor: 'rgba(16, 32, 43, 0.35)',
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
  cardTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 16,
    paddingVertical: spacing.xl,
    textAlign: 'center',
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  filterBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipIdle: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  filterTextIdle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
  },
  searchRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 34,
  },
});
