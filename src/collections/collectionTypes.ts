export type CollectionRecord = {
  readonly createdAt: string;
  readonly id: string;
  readonly name: string;
  readonly updatedAt: string;
};

export type CollectionSummary = {
  readonly coverPhotoUri: string | null;
  readonly dateSpan: string | null;
  readonly id: string;
  readonly name: string;
  readonly placeCount: number;
};

export type CollectionRow = {
  readonly created_at: string;
  readonly id: string;
  readonly name: string;
  readonly updated_at: string;
};
