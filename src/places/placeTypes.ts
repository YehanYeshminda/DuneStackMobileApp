export type PlaceRecord = {
  readonly addressLabel: string;
  readonly capturedAt: string;
  readonly categoryId: string;
  readonly createdAt: string;
  readonly id: string;
  readonly isFavorite: boolean;
  readonly latitude: number;
  readonly locationAccuracyMeters: number | null;
  readonly longitude: number;
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
  readonly latitude: number;
  readonly locationAccuracyMeters: number | null;
  readonly longitude: number;
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
  readonly latitude: number;
  readonly locationAccuracyMeters: number | null;
  readonly longitude: number;
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
  readonly latitude: number;
  readonly location_accuracy_meters: number | null;
  readonly longitude: number;
  readonly notes: string;
  readonly photo_uri: string;
  readonly rating: number | null;
  readonly tags: string;
  readonly title: string;
  readonly updated_at: string;
  readonly visit_date: string;
};
