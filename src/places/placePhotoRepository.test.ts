import { initializeDatabase, resetDatabaseForTests } from '../database/database';
import { addPlacePhotos, listPlacePhotos, replacePlacePhotos } from './placePhotoRepository';
import { createPlace } from './placeRepository';
import { CreatePlaceInput } from './placeTypes';

const buildPlace = (): CreatePlaceInput => ({
  addressLabel: '',
  capturedAt: '2026-01-01T10:00:00.000Z',
  categoryId: 'travel',
  isFavorite: false,
  latitude: 40,
  locationAccuracyMeters: 5,
  longitude: -8,
  notes: '',
  photoUri: 'file:///cover.jpg',
  rating: null,
  tags: '',
  title: 'Place',
  visitDate: '',
});

beforeEach(() => {
  resetDatabaseForTests();
  initializeDatabase();
});

afterAll(() => {
  resetDatabaseForTests();
});

describe('place photos', () => {
  it('adds photos in order and lists them', () => {
    const place = createPlace(buildPlace());

    addPlacePhotos(place.id, ['file:///a.jpg', 'file:///b.jpg']);

    const photos = listPlacePhotos(place.id);
    expect(photos.map((photo) => photo.uri)).toEqual(['file:///a.jpg', 'file:///b.jpg']);
    expect(photos.map((photo) => photo.position)).toEqual([0, 1]);
  });

  it('replaces the whole set', () => {
    const place = createPlace(buildPlace());

    addPlacePhotos(place.id, ['file:///a.jpg', 'file:///b.jpg']);
    replacePlacePhotos(place.id, ['file:///c.jpg']);

    expect(listPlacePhotos(place.id).map((photo) => photo.uri)).toEqual(['file:///c.jpg']);
  });
});
