import { initializeDatabase, resetDatabaseForTests } from '../database/database';
import {
  createPlace,
  deletePlace,
  getPlaceById,
  listPlaces,
  setPlaceFavorite,
  updatePlace,
} from './placeRepository';
import { CreatePlaceInput, UpdatePlaceInput } from './placeTypes';

const buildCreateInput = (overrides: Partial<CreatePlaceInput> = {}): CreatePlaceInput => ({
  addressLabel: 'Downtown',
  capturedAt: '2026-01-01T10:00:00.000Z',
  categoryId: 'food',
  latitude: 25.2048,
  locationAccuracyMeters: 5,
  longitude: 55.2708,
  notes: 'Great espresso',
  photoUri: 'file:///photos/cafe.jpg',
  rating: 4,
  tags: 'coffee, morning',
  title: 'Sunset Cafe',
  visitDate: '2026-01-01',
  ...overrides,
});

beforeEach(() => {
  resetDatabaseForTests();
  initializeDatabase();
});

afterAll(() => {
  resetDatabaseForTests();
});

describe('createPlace', () => {
  it('persists a place and returns it with a uuid-shaped id', () => {
    const place = createPlace(buildCreateInput());

    expect(place.id).toMatch(/^place_[0-9a-f-]{36}$/);
    expect(place.title).toBe('Sunset Cafe');
    expect(place.isFavorite).toBe(false);
    expect(place.createdAt).toBe(place.updatedAt);
  });

  it('trims free-text fields before saving', () => {
    const place = createPlace(
      buildCreateInput({
        title: '  Padded Title  ',
        notes: '  spaced notes  ',
        tags: '  a, b  ',
        addressLabel: '  Some Place  ',
      }),
    );

    expect(place.title).toBe('Padded Title');
    expect(place.notes).toBe('spaced notes');
    expect(place.tags).toBe('a, b');
    expect(place.addressLabel).toBe('Some Place');
  });
});

describe('getPlaceById', () => {
  it('returns the matching record', () => {
    const created = createPlace(buildCreateInput());
    const fetched = getPlaceById(created.id);

    expect(fetched).toEqual(created);
  });

  it('throws when no record exists for the id', () => {
    expect(() => getPlaceById('place_missing')).toThrow('Place not found for id: place_missing');
  });
});

describe('listPlaces', () => {
  beforeEach(() => {
    createPlace(buildCreateInput({ title: 'Mountain View', notes: 'hike', tags: 'nature' }));
    createPlace(buildCreateInput({ title: 'City Diner', notes: 'lunch', tags: 'food, urban' }));
  });

  it('returns every place for an empty query', () => {
    expect(listPlaces('')).toHaveLength(2);
  });

  it('matches on title', () => {
    const results = listPlaces('mountain');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Mountain View');
  });

  it('matches on notes and tags', () => {
    expect(listPlaces('lunch')).toHaveLength(1);
    expect(listPlaces('urban')).toHaveLength(1);
  });
});

describe('updatePlace', () => {
  it('persists changed fields', () => {
    const created = createPlace(buildCreateInput());

    const update: UpdatePlaceInput = {
      ...buildCreateInput(),
      title: 'Renamed Cafe',
      rating: 5,
      notes: 'Updated notes',
    };
    const updated = updatePlace(created.id, update);

    expect(updated.id).toBe(created.id);
    expect(updated.title).toBe('Renamed Cafe');
    expect(updated.rating).toBe(5);
    expect(updated.notes).toBe('Updated notes');
  });
});

describe('setPlaceFavorite', () => {
  it('toggles the favorite flag', () => {
    const created = createPlace(buildCreateInput());

    expect(setPlaceFavorite(created.id, true).isFavorite).toBe(true);
    expect(setPlaceFavorite(created.id, false).isFavorite).toBe(false);
  });
});

describe('deletePlace', () => {
  it('removes the record', () => {
    const created = createPlace(buildCreateInput());

    deletePlace(created.id);

    expect(() => getPlaceById(created.id)).toThrow(`Place not found for id: ${created.id}`);
  });
});
