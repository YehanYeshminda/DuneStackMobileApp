import { Link, useFocusEffect } from 'expo-router';
import { ReactElement, useCallback, useState } from 'react';
import { Image, Pressable, SectionList, SectionListData, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCategoryLabel } from '../../src/categories/categories';
import { listPlaces } from '../../src/places/placeRepository';
import { groupPlacesByMonth, PlaceSection } from '../../src/places/placeTimeline';
import { PlaceRecord } from '../../src/places/placeTypes';
import { colors, spacing } from '../../src/shared/theme';

export default function TimelineScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const [sections, setSections] = useState<PlaceSection[]>([]);

  useFocusEffect(
    useCallback((): void => {
      setSections(groupPlacesByMonth(listPlaces('')));
    }, []),
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}>
      <Text style={styles.eyebrow}>Your</Text>
      <Text style={styles.heading}>Timeline</Text>

      <SectionList
        contentContainerStyle={styles.listContent}
        keyExtractor={(item: PlaceRecord): string => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No places saved yet.</Text>}
        renderItem={({ item }: { item: PlaceRecord }): ReactElement => (
          <Link asChild href={`/place/${item.id}`}>
            <Pressable style={styles.row}>
              <Image source={{ uri: item.photoUri }} style={styles.thumb} />
              <View style={styles.rowBody}>
                <Text numberOfLines={1} style={styles.rowTitle}>
                  {item.title}
                </Text>
                <Text style={styles.rowMeta}>{getCategoryLabel(item.categoryId)}</Text>
              </View>
              <Text style={styles.rowDay}>{formatDay(item.capturedAt)}</Text>
            </Pressable>
          </Link>
        )}
        renderSectionHeader={({
          section,
        }: {
          readonly section: SectionListData<PlaceRecord, PlaceSection>;
        }): ReactElement => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>{section.data.length}</Text>
          </View>
        )}
        sections={sections}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const formatDay = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

const styles = StyleSheet.create({
  empty: {
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
  heading: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
  rowBody: {
    flex: 1,
  },
  rowDay: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  rowMeta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  sectionCount: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeader: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    paddingTop: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  thumb: {
    backgroundColor: colors.border,
    borderRadius: 12,
    height: 56,
    width: 56,
  },
});
