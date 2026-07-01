import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { ReactElement, useCallback, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listPlaces } from '../src/places/placeRepository';
import { groupPlacesByMonth, PlaceSection } from '../src/places/placeTimeline';
import { PlaceRecord } from '../src/places/placeTypes';
import { colors, fonts, spacing } from '../src/shared/theme';

export default function GalleryScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const [places, setPlaces] = useState<PlaceRecord[]>([]);

  useFocusEffect(
    useCallback((): void => {
      setPlaces(listPlaces(''));
    }, []),
  );

  const sections = useMemo((): PlaceSection[] => groupPlacesByMonth(places), [places]);

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={(): void => router.back()}
          style={styles.backButton}
        >
          <Ionicons color={colors.text} name="chevron-back" size={20} />
        </Pressable>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Gallery</Text>
          <Text style={styles.count}>
            {places.length} {places.length === 1 ? 'PHOTO' : 'PHOTOS'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {places.length === 0 ? (
          <Text style={styles.empty}>No photos saved yet. Capture a place to build your gallery.</Text>
        ) : null}
        {sections.map((section: PlaceSection): ReactElement => (
          <View key={section.key}>
            <Text style={styles.divider}>{section.title.toUpperCase()}</Text>
            <View style={styles.grid}>
              {section.data.map((place: PlaceRecord): ReactElement => (
                <Pressable
                  key={place.id}
                  onPress={(): void => router.push(`/place/${place.id}`)}
                  style={styles.tile}
                >
                  <Image source={{ uri: place.photoUri }} style={styles.tileImage} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 36,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  count: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  divider: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  empty: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    padding: spacing.lg,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  header: {
    paddingHorizontal: spacing.lg,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  tile: {
    aspectRatio: 1,
    width: '33.333%',
  },
  tileImage: {
    backgroundColor: colors.border,
    borderColor: colors.background,
    borderWidth: 1,
    height: '100%',
    width: '100%',
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 30,
    fontWeight: '800',
  },
  titleRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
});
