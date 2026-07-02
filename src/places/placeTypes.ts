export type PlaceRecord = {
  readonly addressLabel: string;
  readonly capturedAt: string;
  readonly categoryId: string;
  readonly createdAt: string;
  readonly id: string;
  readonly isFavorite: boolean;
  readonly latitude: number | null;
  readonly locationAccuracyMeters: number | null;
  readonly longitude: number | null;
  readonly notes: string;
  readonly photoUri: string;
  readonly rating: number | null;
  readonly tags: string;
  readonly title: string;
  readonly updatedAt: string;
  readonly visitDate: string;
};

export type CreatePlaceInput = {
  readonly addressLabel: string;
  readonly categoryId: string;
  readonly capturedAt: string;
  readonly isFavorite: boolean;
  readonly latitude: number | null;
  readonly locationAccuracyMeters: number | null;
  readonly longitude: number | null;
  readonly notes: string;
  readonly photoUri: string;
  readonly rating: number | null;
  readonly tags: string;
  readonly title: string;
  readonly visitDate: string;
};

export type UpdatePlaceInput = {
  readonly addressLabel: string;
  readonly capturedAt: string;
  readonly categoryId: string;
  readonly latitude: number | null;
  readonly locationAccuracyMeters: number | null;
  readonly longitude: number | null;
  readonly notes: string;
  readonly photoUri: string;
  readonly rating: number | null;
  readonly tags: string;
  readonly title: string;
  readonly visitDate: string;
};

export type PlaceRow = {
  readonly address_label: string;
  readonly captured_at: string;
  readonly category_id: string;
  readonly created_at: string;
  readonly id: string;
  readonly is_favorite: number;
  readonly latitude: number | null;
  readonly location_accuracy_meters: number | null;
  readonly longitude: number | null;
  readonly notes: string;
  readonly photo_uri: string;
  readonly rating: number | null;
  readonly tags: string;
  readonly title: string;
  readonly updated_at: string;
  readonly visit_date: string;
};

export type PlacePhotoRecord = {
  readonly id: string;
  readonly placeId: string;
  readonly position: number;
  readonly uri: string;
};

export type PlacePhotoRow = {
  readonly created_at: string;
  readonly id: string;
  readonly place_id: string;
  readonly position: number;
  readonly uri: string;
};

/** A place that has a saved GPS coordinate (e.g. for the map). */
export type LocatedPlace = PlaceRecord & {
  readonly latitude: number;
  readonly longitude: number;
};

export const hasCoordinates = (place: PlaceRecord): place is LocatedPlace =>
  place.latitude !== null && place.longitude !== null;
