import { Link, useFocusEffect } from 'expo-router';
import { ReactElement, useCallback, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listPlaces } from '../../src/places/placeRepository';
import {
  groupPlacesByMonth,
  groupPlacesByYear,
  PlaceSection,
} from '../../src/places/placeTimeline';
import { PlaceRecord } from '../../src/places/placeTypes';
import { colors, fonts, spacing } from '../../src/shared/theme';

type Granularity = 'month' | 'year';

const GRID_COLUMNS = 3;
const GRID_CAP = 6;

export default function TimelineScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [places, setPlaces] = useState<PlaceRecord[]>([]);
  const [granularity, setGranularity] = useState<Granularity>('month');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

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

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Timeline</Text>
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
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {bands.length === 0 ? <Text style={styles.empty}>No places saved yet.</Text> : null}
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
  );
}

const styles = StyleSheet.create({
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
  empty: {
    color: colors.muted,
    fontSize: 16,
    paddingVertical: spacing.xl,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl,
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  tile: {
    backgroundColor: colors.border,
    borderRadius: 12,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 26,
    fontStyle: 'italic',
    fontWeight: '700',
  },
});
