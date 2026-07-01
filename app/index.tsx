import { Ionicons } from '@expo/vector-icons';
import { Link, router, useFocusEffect } from 'expo-router';
import { ReactElement, useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCategoryColor, getCategoryLabel } from '../src/categories/categories';
import { isMapsSupported } from '../src/maps/mapsSupport';
import { useIsOnline } from '../src/network/useIsOnline';
import { listPlaces } from '../src/places/placeRepository';
import { groupPlacesByMonth, groupPlacesByYear, PlaceSection } from '../src/places/placeTimeline';
import { PlaceRecord } from '../src/places/placeTypes';
import { colors, fonts, spacing } from '../src/shared/theme';

type HomeMode = 'feed' | 'timeline';
type Granularity = 'month' | 'year';
type Snippet = { readonly label: string; readonly text: string };

const GRID_COLUMNS = 3;
const GRID_CAP = 6;

export default function HomeScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [places, setPlaces] = useState<PlaceRecord[]>([]);
  const [mode, setMode] = useState<HomeMode>('feed');
  const [granularity, setGranularity] = useState<Granularity>('month');
  const [query, setQuery] = useState<string>('');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const showMap = useIsOnline() && isMapsSupported();

  useFocusEffect(
    useCallback((): void => {
      setPlaces(listPlaces(''));
    }, []),
  );

  const bands = useMemo(
    (): PlaceSection[] =>
      granularity === 'month' ? groupPlacesByMonth(places) : groupPlacesByYear(places),
    [granularity, places],
  );

  const results = useMemo((): PlaceRecord[] => {
    const term = query.trim().toLowerCase();

    if (term.length === 0) {
      return [];
    }

    return places.filter((place: PlaceRecord): boolean => matchesQuery(place, term));
  }, [places, query]);

  const tileSize = Math.floor(
    (width - spacing.lg * 2 - spacing.sm * (GRID_COLUMNS - 1)) / GRID_COLUMNS,
  );

  const expandBand = useCallback((key: string): void => {
    setExpandedKeys((previous: Set<string>): Set<string> => {
      const next = new Set(previous);
      next.add(key);

      return next;
    });
  }, []);

  const isSearching = query.trim().length > 0;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Text style={styles.wordmark}>DuneStack</Text>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityLabel="More"
            accessibilityRole="button"
            onPress={(): void => setMenuOpen(true)}
            style={styles.menuButton}
          >
            <Ionicons color={colors.text} name="ellipsis-horizontal" size={20} />
          </Pressable>
          <Link asChild href="/capture">
            <Pressable accessibilityLabel="Add a place" accessibilityRole="button" style={styles.addButton}>
              <Ionicons color="#FFFFFF" name="add" size={24} />
            </Pressable>
          </Link>
        </View>
      </View>

      {places.length === 0 ? (
        <EmptyWelcome />
      ) : (
        <>
          <View style={styles.toggle}>
            {(['feed', 'timeline'] as HomeMode[]).map((value: HomeMode): ReactElement => {
              const isActive = mode === value;

              return (
                <Pressable
                  key={value}
                  onPress={(): void => setMode(value)}
                  style={[styles.toggleSegment, isActive ? styles.toggleSegmentActive : undefined]}
                >
                  <Text style={isActive ? styles.toggleTextActive : styles.toggleTextIdle}>
                    {value === 'feed' ? 'Feed' : 'Timeline'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {mode === 'feed' ? (
            <View style={styles.feed}>
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
          ) : (
            <View style={styles.timeline}>
              <View style={styles.periodToggle}>
                {(['month', 'year'] as Granularity[]).map((value: Granularity): ReactElement => {
                  const isActive = granularity === value;

                  return (
                    <Pressable
                      key={value}
                      onPress={(): void => setGranularity(value)}
                      style={[styles.periodSegment, isActive ? styles.periodSegmentActive : undefined]}
                    >
                      <Text style={isActive ? styles.periodTextActive : styles.periodTextIdle}>
                        {value === 'month' ? 'Month' : 'Year'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                {bands.map((band: PlaceSection): ReactElement => {
                  const expanded = expandedKeys.has(band.key);
                  const hasOverflow = !expanded && band.data.length > GRID_CAP;
                  const visible = hasOverflow ? band.data.slice(0, GRID_CAP - 1) : band.data;

                  return (
                    <View key={band.key} style={styles.band}>
                      <View style={styles.bandHeader}>
                        <Text style={styles.bandTitle}>{band.title}</Text>
                        <Text style={styles.bandCount}>
                          {band.data.length} {band.data.length === 1 ? 'PLACE' : 'PLACES'}
                        </Text>
                      </View>
                      <View style={styles.grid}>
                        {visible.map((place: PlaceRecord): ReactElement => (
                          <Link asChild href={`/place/${place.id}`} key={place.id}>
                            <Pressable>
                              <Image
                                source={{ uri: place.photoUri }}
                                style={[styles.tile, { height: tileSize, width: tileSize }]}
                              />
                            </Pressable>
                          </Link>
                        ))}
                        {hasOverflow ? (
                          <Pressable
                            onPress={(): void => expandBand(band.key)}
                            style={[styles.tile, styles.moreTile, { height: tileSize, width: tileSize }]}
                          >
                            <Text style={styles.moreText}>+{band.data.length - (GRID_CAP - 1)}</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </>
      )}

      <OverflowMenu
        onClose={(): void => setMenuOpen(false)}
        showMap={showMap}
        topOffset={insets.top + 64}
        visible={menuOpen}
      />
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

type OverflowMenuProps = {
  readonly onClose: () => void;
  readonly showMap: boolean;
  readonly topOffset: number;
  readonly visible: boolean;
};

const OverflowMenu = ({ onClose, showMap, topOffset, visible }: OverflowMenuProps): ReactElement => {
  const go = (href: string): void => {
    onClose();
    router.push(href);
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.menuBackdrop}>
        <View style={[styles.menuCard, { marginTop: topOffset }]}>
          {showMap ? <MenuItem icon="map-outline" label="Explore" onPress={(): void => go('/map')} /> : null}
          <MenuItem icon="images-outline" label="Gallery" onPress={(): void => go('/gallery')} />
          <MenuItem icon="settings-outline" label="Settings" onPress={(): void => go('/settings')} />
        </View>
      </Pressable>
    </Modal>
  );
};

type MenuItemProps = {
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly label: string;
  readonly onPress: () => void;
};

const MenuItem = ({ icon, label, onPress }: MenuItemProps): ReactElement => (
  <Pressable onPress={onPress} style={styles.menuItem}>
    <Ionicons color={colors.text} name={icon} size={20} />
    <Text style={styles.menuItemText}>{label}</Text>
  </Pressable>
);

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
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  band: {
    marginBottom: spacing.lg,
  },
  bandCount: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  bandHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  bandTitle: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '800',
  },
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  menuBackdrop: {
    backgroundColor: 'rgba(42, 37, 33, 0.18)',
    flex: 1,
  },
  menuButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  menuCard: {
    alignSelf: 'flex-end',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: spacing.lg,
    paddingVertical: spacing.xs,
    width: 200,
  },
  menuItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  menuItemText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  moreText: {
    color: colors.muted,
    fontSize: 18,
    fontWeight: '800',
  },
  moreTile: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    justifyContent: 'center',
  },
  periodSegment: {
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  periodSegmentActive: {
    backgroundColor: colors.primary,
  },
  periodTextActive: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  periodTextIdle: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  periodToggle: {
    alignSelf: 'flex-end',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    marginBottom: spacing.md,
    padding: 4,
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
  tile: {
    backgroundColor: colors.border,
    borderRadius: 12,
  },
  timeline: {
    flex: 1,
  },
  toggle: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.md,
    padding: 4,
  },
  toggleSegment: {
    alignItems: 'center',
    borderRadius: 10,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  toggleSegmentActive: {
    backgroundColor: colors.primary,
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  toggleTextIdle: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '700',
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
  },
});
