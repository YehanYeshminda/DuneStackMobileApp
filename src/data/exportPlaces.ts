import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { getCategoryLabel } from '../categories/categories';
import { listPlaces } from '../places/placeRepository';
import { PlaceRecord } from '../places/placeTypes';

export type ExportResult = {
  readonly count: number;
  readonly shared: boolean;
};

/**
 * Exports every place to a human-readable JSON file the user controls.
 *
 * Only user-facing fields are included — internal ids, photo file paths,
 * category ids, and bookkeeping timestamps are intentionally left out.
 */
export const exportPlacesToFile = async (): Promise<ExportResult> => {
  const places = listPlaces('');

  if (places.length === 0) {
    return { count: 0, shared: false };
  }

  const payload = {
    app: 'DuneStack Places',
    exportedAt: new Date().toISOString(),
    places: places.map(toExportedPlace),
  };

  const file = new File(Paths.cache, `dunestack-places-${Date.now()}.json`);
  file.create({ overwrite: true });
  file.write(JSON.stringify(payload, null, 2));

  const shared = await Sharing.isAvailableAsync();

  if (shared) {
    await Sharing.shareAsync(file.uri, {
      UTI: 'public.json',
      dialogTitle: 'Export your places',
      mimeType: 'application/json',
    });
  }

  return { count: places.length, shared };
};

const toExportedPlace = (
  place: PlaceRecord,
): {
  readonly address: string;
  readonly capturedAt: string;
  readonly category: string;
  readonly favorite: boolean;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly notes: string;
  readonly rating: number | null;
  readonly tags: string;
  readonly title: string;
} => ({
  address: place.addressLabel,
  capturedAt: place.capturedAt,
  category: getCategoryLabel(place.categoryId),
  favorite: place.isFavorite,
  latitude: place.latitude,
  longitude: place.longitude,
  notes: place.notes,
  rating: place.rating,
  tags: place.tags,
  title: place.title,
});
