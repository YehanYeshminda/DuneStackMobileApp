import { Ionicons } from '@expo/vector-icons';
import { Link, useFocusEffect } from 'expo-router';
import { ReactElement, useCallback, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCategoryColor, getCategoryLabel } from '../../src/categories/categories';
import { findNearbyPlace, NearbyMatch } from '../../src/location/nearbyPlaces';
import { findOnThisDay, OnThisDayMatch } from '../../src/places/onThisDay';
import { listPlaces } from '../../src/places/placeRepository';
import { PlaceRecord } from '../../src/places/placeTypes';
import { colors, fonts, spacing } from '../../src/shared/theme';

type Snippet = { readonly label: string; readonly text: string };

export default function FeedScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const [places, setPlaces] = useState<PlaceRecord[]>([]);
  const [query, setQuery] = useState<string>('');
  const [onThisDay, setOnThisDay] = useState<OnThisDayMatch | null>(null);
  const [nearby, setNearby] = useState<NearbyMatch | null>(null);

  useFocusEffect(
    useCallback((): (() => void) => {
      let cancelled = false;
      const loaded = listPlaces('');

      setPlaces(loaded);
      setOnThisDay(findOnThisDay(loaded));
      void findNearbyPlace(loaded).then((match: NearbyMatch | null): void => {
        if (!cancelled) {
          setNearby(match);
        }
      });

      return (): void => {
        cancelled = true;
      };
    }, []),
  );

  const results = useMemo((): PlaceRecord[] => {
    const term = query.trim().toLowerCase();

    if (term.length === 0) {
      return [];
    }

    return places.filter((place: PlaceRecord): boolean => matchesQuery(place, term));
  }, [places, query]);

  const isSearching = query.trim().length > 0;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}>
      <Text style={styles.wordmark}>DuneStack</Text>

      {places.length === 0 ? (
        <EmptyWelcome />
      ) : (
        <View style={styles.feed}>
          {!isSearching && nearby !== null ? <NearbyBanner match={nearby} /> : null}
          {!isSearching && onThisDay !== null ? <OnThisDayCard match={onThisDay} /> : null}

          <View style={styles.searchRow}>
            <Ionicons color={colors.muted} name="search" size={18} />
            <TextInput
              onChangeText={setQuery}
              placeholder="Search places"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              value={query}
            />
            {query.length > 0 ? (
              <Pressable accessibilityLabel="Clear search" onPress={(): void => setQuery('')}>
                <Ionicons color={colors.muted} name="close" size={18} />
              </Pressable>
            ) : null}
          </View>

          {isSearching ? (
            <Text style={styles.resultCount}>
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </Text>
          ) : null}

          <FlatList
            contentContainerStyle={styles.listContent}
            data={isSearching ? results : places}
            keyExtractor={(item: PlaceRecord): string => item.id}
            ListEmptyComponent={
              <Text style={styles.empty}>{isSearching ? 'No matches.' : 'No places saved yet.'}</Text>
            }
            renderItem={({ item }: { item: PlaceRecord }): ReactElement =>
              isSearching ? <SearchResultRow place={item} query={query} /> : <JournalRow place={item} />
            }
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
}

const EmptyWelcome = (): ReactElement => (
  <View style={styles.welcome}>
    <Text style={styles.welcomeTitle}>Start your stack</Text>
    <Text style={styles.welcomeBody}>
      Capture a place — a café, a trail, a parking spot, a memory — and it&apos;ll live here, just
      for you.
    </Text>
    <Link asChild href="/capture">
      <Pressable style={styles.welcomeButton}>
        <Text style={styles.welcomeButtonText}>+ Capture your first place</Text>
      </Pressable>
    </Link>
  </View>
);

const NearbyBanner = ({ match }: { readonly match: NearbyMatch }): ReactElement => (
  <Link asChild href={`/place/${match.place.id}`}>
    <Pressable style={styles.nearbyBanner}>
      <View style={styles.nearbyPin}>
        <Ionicons color={colors.accent} name="location" size={16} />
      </View>
      <View style={styles.nearbyBody}>
        <Text style={styles.nearbyEyebrow}>YOU&apos;RE NEARBY · {Math.round(match.distanceMeters)} M</Text>
        <Text numberOfLines={1} style={styles.nearbyTitle}>
          {match.place.title}
        </Text>
        {match.place.notes.length > 0 ? (
          <Text numberOfLines={1} style={styles.nearbyNotes}>
            {match.place.notes}
          </Text>
        ) : null}
      </View>
      <Ionicons color="#FFFFFF" name="chevron-forward" size={18} />
    </Pressable>
  </Link>
);

const OnThisDayCard = ({ match }: { readonly match: OnThisDayMatch }): ReactElement => (
  <Link asChild href={`/place/${match.place.id}`}>
    <Pressable style={styles.onThisDayCard}>
      <Image source={{ uri: match.place.photoUri }} style={styles.onThisDayThumb} />
      <View style={styles.onThisDayBody}>
        <Text style={styles.onThisDayEyebrow}>
          ON THIS DAY · {match.yearsAgo} {match.yearsAgo === 1 ? 'YEAR' : 'YEARS'} AGO
        </Text>
        <Text numberOfLines={1} style={styles.onThisDayTitle}>
          {match.place.title}
        </Text>
        <Text style={styles.onThisDayMeta}>
          {formatFullDate(match.place.capturedAt)} · {getCategoryLabel(match.place.categoryId)}
        </Text>
      </View>
    </Pressable>
  </Link>
);

const JournalRow = ({ place }: { readonly place: PlaceRecord }): ReactElement => (
  <Link asChild href={`/place/${place.id}`}>
    <Pressable style={styles.row}>
      <Image source={{ uri: place.photoUri }} style={styles.thumb} />
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text numberOfLines={1} style={[styles.category, { color: getCategoryColor(place.categoryId) }]}>
            {getCategoryLabel(place.categoryId).toUpperCase()}
          </Text>
          {place.isFavorite ? <Ionicons color={colors.accent} name="heart" size={16} /> : null}
        </View>
        <Text numberOfLines={1} style={styles.rowTitle}>
          {place.title}
        </Text>
        <View style={styles.rowBottom}>
          <Stars rating={place.rating} />
          <Text style={styles.rowDate}>{formatRelativeDate(place.capturedAt)}</Text>
        </View>
      </View>
    </Pressable>
  </Link>
);

const SearchResultRow = ({
  place,
  query,
}: {
  readonly place: PlaceRecord;
  readonly query: string;
}): ReactElement => {
  const snippet = buildSnippet(place, query);

  return (
    <Link asChild href={`/place/${place.id}`}>
      <Pressable style={styles.row}>
        <Image source={{ uri: place.photoUri }} style={styles.thumb} />
        <View style={styles.rowContent}>
          <Text numberOfLines={1} style={[styles.category, { color: getCategoryColor(place.categoryId) }]}>
            {getCategoryLabel(place.categoryId).toUpperCase()}
          </Text>
          <Text numberOfLines={1} style={styles.rowTitle}>
            {place.title}
          </Text>
          {snippet !== null ? (
            <Text numberOfLines={1} style={styles.snippet}>
              <Text style={styles.snippetLabel}>{snippet.label}: </Text>
              {snippet.text}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
};

const Stars = ({ rating }: { readonly rating: number | null }): ReactElement => {
  const filled = rating ?? 0;

  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((value: number): ReactElement => (
        <Ionicons
          color={value <= filled ? colors.accent : colors.border}
          key={value}
          name={value <= filled ? 'star' : 'star-outline'}
          size={13}
        />
      ))}
    </View>
  );
};

const matchesQuery = (place: PlaceRecord, term: string): boolean =>
  place.title.toLowerCase().includes(term) ||
  place.notes.toLowerCase().includes(term) ||
  place.tags.toLowerCase().includes(term) ||
  place.addressLabel.toLowerCase().includes(term);

const buildSnippet = (place: PlaceRecord, query: string): Snippet | null => {
  const term = query.trim().toLowerCase();

  if (term.length === 0 || place.title.toLowerCase().includes(term)) {
    return null;
  }

  if (place.notes.toLowerCase().includes(term)) {
    return { label: 'Notes', text: excerpt(place.notes, term) };
  }

  if (place.tags.toLowerCase().includes(term)) {
    return { label: 'Tag', text: tagSnippet(place.tags, term) };
  }

  if (place.addressLabel.toLowerCase().includes(term)) {
    return { label: 'Address', text: place.addressLabel };
  }

  return null;
};

const excerpt = (text: string, term: string): string => {
  const index = text.toLowerCase().indexOf(term);
  const start = Math.max(0, index - 18);
  const end = Math.min(text.length, index + term.length + 18);

  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
};

const tagSnippet = (tags: string, term: string): string => {
  const match = tags.split(/[\s,]+/).find((tag: string): boolean => tag.toLowerCase().includes(term));

  return match === undefined ? tags : `#${match.replace(/^#/, '')}`;
};

const formatFullDate = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

const formatRelativeDate = (iso: string): string => {
  const date = new Date(iso);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);

  if (diffDays <= 0) {
    return 'Today';
  }

  if (diffDays === 1) {
    return 'Yesterday';
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  const sameYear = date.getFullYear() === new Date().getFullYear();

  return date.toLocaleDateString(
    undefined,
    sameYear
      ? { day: 'numeric', month: 'short' }
      : { day: 'numeric', month: 'short', year: 'numeric' },
  );
};

const styles = StyleSheet.create({
  category: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  empty: {
    color: colors.muted,
    fontSize: 16,
    paddingVertical: spacing.xl,
    textAlign: 'center',
  },
  feed: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  nearbyBanner: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  nearbyBody: {
    flex: 1,
  },
  nearbyEyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  nearbyNotes: {
    color: '#E8EEF4',
    fontSize: 13,
    marginTop: 2,
  },
  nearbyPin: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  nearbyTitle: {
    color: '#FFFFFF',
    fontFamily: fonts.serif,
    fontSize: 18,
    marginTop: 2,
  },
  onThisDayBody: {
    flex: 1,
  },
  onThisDayCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.sm,
  },
  onThisDayEyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  onThisDayMeta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  onThisDayThumb: {
    backgroundColor: colors.border,
    borderRadius: 10,
    height: 56,
    width: 56,
  },
  onThisDayTitle: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 18,
    marginTop: 2,
  },
  resultCount: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  row: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowBottom: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  rowContent: {
    flex: 1,
  },
  rowDate: {
    color: colors.muted,
    fontSize: 12,
  },
  rowTitle: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 19,
    marginTop: 2,
  },
  rowTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
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
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  snippet: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  snippetLabel: {
    color: colors.muted,
    fontWeight: '800',
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  thumb: {
    backgroundColor: colors.border,
    borderRadius: 10,
    height: 64,
    width: 64,
  },
  welcome: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  welcomeBody: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  welcomeButton: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  welcomeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  welcomeTitle: {
    color: colors.accent,
    fontFamily: fonts.serif,
    fontSize: 30,
    fontStyle: 'italic',
    fontWeight: '700',
  },
  wordmark: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 26,
    fontStyle: 'italic',
    fontWeight: '700',
    marginBottom: spacing.md,
  },
});
