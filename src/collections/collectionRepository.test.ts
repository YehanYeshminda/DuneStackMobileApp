import { initializeDatabase, resetDatabaseForTests } from '../database/database';
import { createPlace } from '../places/placeRepository';
import { CreatePlaceInput } from '../places/placeTypes';
import {
  addPlaceToCollection,
  createCollection,
  deleteCollection,
  listCollectionSummaries,
  listMemberPlaceIds,
  listPlacesInCollection,
  removePlaceFromCollection,
} from './collectionRepository';

const buildPlace = (overrides: Partial<CreatePlaceInput> = {}): CreatePlaceInput => ({
  addressLabel: '',
  capturedAt: '2025-09-10T10:00:00.000Z',
  categoryId: 'travel',
  isFavorite: false,
  latitude: 40,
  locationAccuracyMeters: 5,
  longitude: -8,
  notes: '',
  photoUri: 'file:///photos/x.jpg',
  rating: null,
  tags: '',
  title: 'Lisbon',
  visitDate: '',
  ...overrides,
});

beforeEach(() => {
  resetDatabaseForTests();
  initializeDatabase();
});

afterAll(() => {
  resetDatabaseForTests();
});

describe('collections', () => {
  it('creates a collection and adds a place to it', () => {
    const place = createPlace(buildPlace());
    const collection = createCollection('Portugal, 2025');

    addPlaceToCollection(collection.id, place.id);

    expect(listMemberPlaceIds(collection.id)).toEqual([place.id]);
    expect(listPlacesInCollection(collection.id).map((p) => p.id)).toEqual([place.id]);
  });

  it('summarizes a collection with cover, count, and date span', () => {
    const collection = createCollection('Trip');
    const older = createPlace(buildPlace({ capturedAt: '2025-09-01T10:00:00.000Z', photoUri: 'file:///a.jpg' }));
    const newer = createPlace(buildPlace({ capturedAt: '2025-11-20T10:00:00.000Z', photoUri: 'file:///b.jpg' }));

    addPlaceToCollection(collection.id, older.id);
    addPlaceToCollection(collection.id, newer.id);

    const summary = listCollectionSummaries().find((s) => s.id === collection.id);

    expect(summary?.placeCount).toBe(2);
    expect(summary?.coverPhotoUri).toBe('file:///b.jpg');
    expect(summary?.dateSpan).toContain('–');
  });

  it('removes a place and deletes a collection', () => {
    const place = createPlace(buildPlace());
    const collection = createCollection('Temp');

    addPlaceToCollection(collection.id, place.id);
    removePlaceFromCollection(collection.id, place.id);
    expect(listMemberPlaceIds(collection.id)).toEqual([]);

    deleteCollection(collection.id);
    expect(listCollectionSummaries()).toEqual([]);
  });
});
