import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { lazy, ReactElement, Suspense, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCategoryColor, getCategoryLabel } from '../../src/categories/categories';
import { isMapsSupported } from '../../src/maps/mapsSupport';
import { useIsOnline } from '../../src/network/useIsOnline';
import { listPlaces } from '../../src/places/placeRepository';
import { hasCoordinates, LocatedPlace, PlaceRecord } from '../../src/places/placeTypes';
import { colors, fonts, spacing } from '../../src/shared/theme';

// Lazily loaded so the expo-maps native module is never required at app
// startup — only when this screen actually renders the map.
const PlacesMapCanvas = lazy(() => import('../../src/maps/PlacesMapCanvas'));

type MapView = 'split' | 'map';

export default function ExploreScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const [places, setPlaces] = useState<PlaceRecord[]>([]);
  const [view, setView] = useState<MapView>('split');
  const [viewAsList, setViewAsList] = useState<boolean>(false);
  const isOnline = useIsOnline();
  const mapsSupported = isMapsSupported();

  useFocusEffect(
    useCallback((): void => {
      setPlaces(listPlaces(''));
    }, []),
  );

  const openPlace = useCallback((id: string | undefined): void => {
    if (id === undefined) {
      return;
    }

    router.push(`/place/${id}`);
  }, []);

  const located = places.filter(hasCoordinates);
  const mapAvailable = mapsSupported && isOnline;

  if (!mapAvailable && !viewAsList) {
    return <OfflineState onViewList={(): void => setViewAsList(true)} supported={mapsSupported} />;
  }

  if (!mapAvailable) {
    return (
      <View style={styles.screen}>
        <PlaceList bottomInset={insets.bottom} onOpen={openPlace} places={located} />
      </View>
    );
  }

  if (view === 'map') {
    return (
      <View style={styles.screen}>
        <MapArea located={located} onMarkerPress={openPlace} />
        <Pressable
          onPress={(): void => setView('split')}
          style={[styles.floatingButton, { bottom: insets.bottom + spacing.lg }]}
        >
          <Ionicons color="#FFFFFF" name="list" size={16} />
          <Text style={styles.floatingButtonText}>Show list</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.mapArea}>
        <MapArea located={located} onMarkerPress={openPlace} />
      </View>
      <View style={styles.drawer}>
        <View style={styles.handle} />
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerTitle}>
            {located.length} {located.length === 1 ? 'place' : 'places'} in view
          </Text>
          <Pressable onPress={(): void => setView('map')} style={styles.mapButton}>
            <Text style={styles.mapButtonText}>Map</Text>
          </Pressable>
        </View>
        <PlaceList bottomInset={insets.bottom} onOpen={openPlace} places={located} />
      </View>
    </View>
  );
}

type MapAreaProps = {
  readonly located: LocatedPlace[];
  readonly onMarkerPress: (id: string | undefined) => void;
};

const MapArea = ({ located, onMarkerPress }: MapAreaProps): ReactElement => {
  if (located.length === 0) {
    return (
      <View style={styles.mapEmpty}>
        <Text style={styles.mapEmptyText}>No places with a location yet.</Text>
      </View>
    );
  }

  return (
    <Suspense
      fallback={
        <View style={styles.mapEmpty}>
          <ActivityIndicator color={colors.primary} />
        </View>
      }
    >
      <PlacesMapCanvas onMarkerPress={onMarkerPress} places={located} />
    </Suspense>
  );
};

type PlaceListProps = {
  readonly bottomInset: number;
  readonly onOpen: (id: string | undefined) => void;
  readonly places: LocatedPlace[];
};

const PlaceList = ({ bottomInset, onOpen, places }: PlaceListProps): ReactElement => (
  <ScrollView
    contentContainerStyle={[styles.listContent, { paddingBottom: bottomInset + spacing.lg }]}
    showsVerticalScrollIndicator={false}
  >
    {places.length === 0 ? (
      <Text style={styles.listEmpty}>No places with a location yet.</Text>
    ) : null}
    {places.map((place: LocatedPlace): ReactElement => (
      <Pressable key={place.id} onPress={(): void => onOpen(place.id)} style={styles.row}>
        <Image source={{ uri: place.photoUri }} style={styles.rowThumb} />
        <View style={styles.rowBody}>
          <Text style={[styles.rowCategory, { color: getCategoryColor(place.categoryId) }]}>
            {getCategoryLabel(place.categoryId).toUpperCase()}
          </Text>
          <Text numberOfLines={1} style={styles.rowTitle}>
            {place.title}
          </Text>
        </View>
      </Pressable>
    ))}
  </ScrollView>
);

type OfflineStateProps = {
  readonly onViewList: () => void;
  readonly supported: boolean;
};

const OfflineState = ({ onViewList, supported }: OfflineStateProps): ReactElement => (
  <View style={styles.offlineScreen}>
    <View style={styles.offlineIcon}>
      <Ionicons
        color={colors.muted}
        name={supported ? 'cloud-offline-outline' : 'map-outline'}
        size={30}
      />
    </View>
    <Text style={styles.offlineTitle}>
      {supported ? 'Map needs a connection' : "Map isn't available here"}
    </Text>
    <Text style={styles.offlineBody}>
      {supported
        ? "You're offline, so the map tiles can't load. Your places and their coordinates are saved on this device either way."
        : 'The map needs the full app build (not Expo Go). Your places are saved on this device either way.'}
    </Text>
    <Pressable onPress={onViewList} style={styles.offlineButton}>
      <Text style={styles.offlineButtonText}>View as list instead</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  drawer: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    flex: 1.3,
    marginTop: -20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  drawerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  drawerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  floatingButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    position: 'absolute',
  },
  floatingButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 4,
    marginBottom: spacing.sm,
    width: 44,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  listEmpty: {
    color: colors.muted,
    fontSize: 15,
    paddingVertical: spacing.xl,
    textAlign: 'center',
  },
  mapArea: {
    flex: 1,
  },
  mapButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  mapEmpty: {
    alignItems: 'center',
    backgroundColor: colors.border,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  mapEmptyText: {
    color: colors.muted,
    fontSize: 15,
    textAlign: 'center',
  },
  offlineBody: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  offlineButton: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  offlineButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  offlineIcon: {
    alignItems: 'center',
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 72,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 72,
  },
  offlineScreen: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  offlineTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowBody: {
    flex: 1,
  },
  rowCategory: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  rowThumb: {
    backgroundColor: colors.border,
    borderRadius: 12,
    height: 52,
    width: 52,
  },
  rowTitle: {
    color: colors.text,
    fontFamily: fonts.serif,
    fontSize: 17,
    marginTop: 2,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
});
