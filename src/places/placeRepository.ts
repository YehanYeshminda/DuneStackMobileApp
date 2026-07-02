import * as Crypto from 'expo-crypto';

import { getDatabase } from '../database/database';
import { CreatePlaceInput, PlaceRecord, PlaceRow, UpdatePlaceInput } from './placeTypes';

export const createPlace = (input: CreatePlaceInput): PlaceRecord => {
  const database = getDatabase();
  const timestamp = new Date().toISOString();
  const id = createLocalId('place');

  database.runSync(
    `
      INSERT INTO places (
        id,
        title,
        category_id,
        photo_uri,
        latitude,
        longitude,
        location_accuracy_meters,
        captured_at,
        notes,
        tags,
        rating,
        is_favorite,
        address_label,
        visit_date,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    id,
    input.title.trim(),
    input.categoryId,
    input.photoUri,
    input.latitude,
    input.longitude,
    input.locationAccuracyMeters,
    input.capturedAt,
    input.notes.trim(),
    input.tags.trim(),
    input.rating,
    input.isFavorite ? 1 : 0,
    input.addressLabel.trim(),
    input.visitDate.trim(),
    timestamp,
    timestamp,
  );

  return getPlaceById(id);
};

export const listPlaces = (query: string): PlaceRecord[] => {
  const database = getDatabase();
  const normalizedQuery = `%${query.trim().toLowerCase()}%`;
  const rows = database.getAllSync<PlaceRow>(
    `
      SELECT *
      FROM places
      WHERE
        lower(title) LIKE ?
        OR lower(notes) LIKE ?
        OR lower(tags) LIKE ?
      ORDER BY datetime(created_at) DESC;
    `,
    normalizedQuery,
    normalizedQuery,
    normalizedQuery,
  );

  return rows.map(mapPlaceRow);
};

export const getPlaceById = (id: string): PlaceRecord => {
  const database = getDatabase();
  const row = database.getFirstSync<PlaceRow>(
    `
      SELECT *
      FROM places
      WHERE id = ?;
    `,
    id,
  );

  if (row === null) {
    throw new Error(`Place not found for id: ${id}`);
  }

  return mapPlaceRow(row);
};

export const deletePlace = (id: string): void => {
  const database = getDatabase();
  database.runSync(`DELETE FROM place_collections WHERE place_id = ?;`, id);
  database.runSync(`DELETE FROM place_photos WHERE place_id = ?;`, id);
  database.runSync(
    `
      DELETE FROM places
      WHERE id = ?;
    `,
    id,
  );
};

export const deleteAllPlaces = (): void => {
  const database = getDatabase();
  database.runSync(`DELETE FROM place_collections;`);
  database.runSync(`DELETE FROM place_photos;`);
  database.runSync(`DELETE FROM places;`);
};

export const updatePlace = (id: string, input: UpdatePlaceInput): PlaceRecord => {
  const database = getDatabase();
  database.runSync(
    `
      UPDATE places
      SET
        title = ?,
        category_id = ?,
        photo_uri = ?,
        latitude = ?,
        longitude = ?,
        location_accuracy_meters = ?,
        captured_at = ?,
        notes = ?,
        tags = ?,
        rating = ?,
        address_label = ?,
        visit_date = ?,
        updated_at = ?
      WHERE id = ?;
    `,
    input.title.trim(),
    input.categoryId,
    input.photoUri,
    input.latitude,
    input.longitude,
    input.locationAccuracyMeters,
    input.capturedAt,
    input.notes.trim(),
    input.tags.trim(),
    input.rating,
    input.addressLabel.trim(),
    input.visitDate.trim(),
    new Date().toISOString(),
    id,
  );

  return getPlaceById(id);
};

export const setPlaceFavorite = (id: string, isFavorite: boolean): PlaceRecord => {
  const database = getDatabase();
  database.runSync(
    `
      UPDATE places
      SET is_favorite = ?, updated_at = ?
      WHERE id = ?;
    `,
    isFavorite ? 1 : 0,
    new Date().toISOString(),
    id,
  );

  return getPlaceById(id);
};

export const mapPlaceRow = (row: PlaceRow): PlaceRecord => ({
  addressLabel: row.address_label,
  capturedAt: row.captured_at,
  categoryId: row.category_id,
  createdAt: row.created_at,
  id: row.id,
  isFavorite: row.is_favorite === 1,
  latitude: row.latitude,
  locationAccuracyMeters: row.location_accuracy_meters,
  longitude: row.longitude,
  notes: row.notes,
  photoUri: row.photo_uri,
  rating: row.rating,
  tags: row.tags,
  title: row.title,
  updatedAt: row.updated_at,
  visitDate: row.visit_date,
});

const createLocalId = (prefix: string): string => `${prefix}_${Crypto.randomUUID()}`;
