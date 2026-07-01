import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ReactElement, useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCategoryColor, getCategoryLabel } from '../../src/categories/categories';
import {
  addPlaceToCollection,
  deleteCollection,
  getCollection,
  listMemberPlaceIds,
  listPlacesInCollection,
  removePlaceFromCollection,
} from '../../src/collections/collectionRepository';
import { CollectionRecord } from '../../src/collections/collectionTypes';
import { listPlaces } from '../../src/places/placeRepository';
import { PlaceRecord } from '../../src/places/placeTypes';
import { colors, fonts, spacing } from '../../src/shared/theme';

type RouteParams = {
  readonly id?: string;
};

const GRID_COLUMNS = 3;

export default function CollectionDetailScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<RouteParams>();
  const [collection, setCollection] = useState<CollectionRecord | null>(null);
  const [places, setPlaces] = useState<PlaceRecord[]>([]);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = useState<boolean>(false);

  const collectionId = typeof params.id === 'string' ? params.id : null;

  const load = useCallback((): void => {
    if (collectionId === null) {
      return;
    }

    setCollection(getCollection(collectionId));
    setPlaces(listPlacesInCollection(collectionId));
    setMemberIds(new Set(listMemberPlaceIds(collectionId)));
  }, [collectionId]);

  useFocusEffect(load);

  const toggleMember = (placeId: string): void => {
    if (collectionId === null) {
      return;
    }

    setMemberIds((previous: Set<string>): Set<string> => {
      const next = new Set(previous);

      if (next.has(placeId)) {
        removePlaceFromCollection(collectionId, placeId);
        next.delete(placeId);
      } else {
        addPlaceToCollection(collectionId, placeId);
        next.add(placeId);
      }

      return next;
    });
  };

  const closePicker = (): void => {
    setPickerOpen(false);
    load();
  };

  const confirmDelete = (): void => {
    Alert.alert('Delete collection?', 'This removes the collection. Your places are not deleted.', [
      { style: 'cancel', text: 'Cancel' },
      {
        onPress: (): void => {
          if (collectionId !== null) {
            deleteCollection(collectionId);
          }
          router.back();
        },
        style: 'destructive',
        text: 'Delete',
      },
    ]);
  };

  const tileSize = Math.floor(
    (width - spacing.lg * 2 - spacing.sm * (GRID_COLUMNS - 1)) / GRID_COLUMNS,
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={(): void => router.back()}
          style={styles.iconButton}
        >
          <Ionicons color={colors.text} name="chevron-back" size={20} />
        </Pressable>
        <Pressable accessibilityLabel="Delete collection" accessibilityRole="button" onPress={confirmDelete}>
          <Ionicons color={colors.danger} name="trash-outline" size={20} />
        </Pressable>
      </View>

      <Text style={styles.title}>{collection?.name ?? 'Collection'}</Text>
      <Text style={styles.meta}>
        {places.length} {places.length === 1 ? 'place' : 'places'}
      </Text>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {places.length === 0 ? (
          <Text style={styles.empty}>No places yet. Add some to build this collection.</Text>
        ) : (
          <View style={styles.grid}>
            {places.map((place: PlaceRecord): ReactElement => (
              <Pressable
                key={place.id}
                onPress={(): void => router.push(`/place/${place.id}`)}
                style={[styles.tile, { height: tileSize, width: tileSize }]}
              >
                <Image source={{ uri: place.photoUri }} style={styles.tileImage} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={(): void => setPickerOpen(true)}
        style={[styles.addBar, { paddingBottom: insets.bottom + spacing.md }]}
      >
        <Ionicons color="#FFFFFF" name="add" size={18} />
        <Text style={styles.addBarText}>Add places</Text>
      </Pressable>

      <Modal animationType="slide" onRequestClose={closePicker} transparent visible={pickerOpen}>
        <View style={styles.pickerScreen}>
          <View style={[styles.pickerHeader, { paddingTop: insets.top + spacing.sm }]}>
            <Text style={styles.pickerTitle}>Add places</Text>
            <Pressable onPress={closePicker}>
              <Text style={styles.pickerDone}>Done</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.pickerContent} showsVerticalScrollIndicator={false}>
            {listPlaces('').map((place: PlaceRecord): ReactElement => {
              const isMember = memberIds.has(place.id);

              return (
                <Pressable
                  key={place.id}
                  onPress={(): void => toggleMember(place.id)}
                  style={styles.pickerRow}
                >
                  <Image source={{ uri: place.photoUri }} style={styles.pickerThumb} />
                  <View style={styles.pickerBody}>
                    <Text style={[styles.pickerCategory, { color: getCategoryColor(place.categoryId) }]}>
                      {getCategoryLabel(place.categoryId).toUpperCase()}
                    </Text>
                    <Text numberOfLines={1} style={styles.pickerName}>
                      {place.title}
                    </Text>
                  </View>
                  <Ionicons
                    color={isMember ? colors.accent : colors.border}
                    name={isMember ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  addBar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    paddingTop: spacing.md,
  },
  addBarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  content: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
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
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
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
  meta: {
    color: colors.muted,
    fontSize: 14,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  pickerBody: {
    flex: 1,
  },
  pickerCategory: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pickerContent: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  pickerDone: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '800',
  },
  pickerHeader: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  pickerName: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 17,
    marginTop: 2,
  },
  pickerRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  pickerScreen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  pickerThumb: {
    backgroundColor: colors.border,
    borderRadius: 10,
    height: 52,
    width: 52,
  },
  pickerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  tile: {
    backgroundColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tileImage: {
    height: '100%',
    width: '100%',
  },
  title: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 28,
    paddingHorizontal: spacing.lg,
  },
});
