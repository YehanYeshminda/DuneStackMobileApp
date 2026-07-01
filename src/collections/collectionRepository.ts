import * as Crypto from 'expo-crypto';

import { getDatabase } from '../database/database';
import { mapPlaceRow } from '../places/placeRepository';
import { PlaceRecord, PlaceRow } from '../places/placeTypes';
import { CollectionRecord, CollectionRow, CollectionSummary } from './collectionTypes';

export const createCollection = (name: string): CollectionRecord => {
  const database = getDatabase();
  const timestamp = new Date().toISOString();
  const id = `collection_${Crypto.randomUUID()}`;

  database.runSync(
    `INSERT INTO collections (id, name, created_at, updated_at) VALUES (?, ?, ?, ?);`,
    id,
    name.trim(),
    timestamp,
    timestamp,
  );

  return getCollection(id);
};

export const getCollection = (id: string): CollectionRecord => {
  const database = getDatabase();
  const row = database.getFirstSync<CollectionRow>(`SELECT * FROM collections WHERE id = ?;`, id);

  if (row === null) {
    throw new Error(`Collection not found for id: ${id}`);
  }

  return mapCollectionRow(row);
};

export const listCollections = (): CollectionRecord[] => {
  const database = getDatabase();
  const rows = database.getAllSync<CollectionRow>(
    `SELECT * FROM collections ORDER BY datetime(created_at) DESC;`,
  );

  return rows.map(mapCollectionRow);
};

export const listCollectionSummaries = (): CollectionSummary[] =>
  listCollections().map(summarizeCollection);

export const deleteCollection = (id: string): void => {
  const database = getDatabase();
  database.runSync(`DELETE FROM place_collections WHERE collection_id = ?;`, id);
  database.runSync(`DELETE FROM collections WHERE id = ?;`, id);
};

export const addPlaceToCollection = (collectionId: string, placeId: string): void => {
  const database = getDatabase();
  database.runSync(
    `INSERT OR IGNORE INTO place_collections (collection_id, place_id, created_at) VALUES (?, ?, ?);`,
    collectionId,
    placeId,
    new Date().toISOString(),
  );
};

export const removePlaceFromCollection = (collectionId: string, placeId: string): void => {
  const database = getDatabase();
  database.runSync(
    `DELETE FROM place_collections WHERE collection_id = ? AND place_id = ?;`,
    collectionId,
    placeId,
  );
};

export const listPlacesInCollection = (collectionId: string): PlaceRecord[] => {
  const database = getDatabase();
  const rows = database.getAllSync<PlaceRow>(
    `SELECT places.* FROM places
       JOIN place_collections ON place_collections.place_id = places.id
       WHERE place_collections.collection_id = ?
       ORDER BY datetime(places.captured_at) DESC;`,
    collectionId,
  );

  return rows.map(mapPlaceRow);
};

export const listMemberPlaceIds = (collectionId: string): string[] => {
  const database = getDatabase();
  const rows = database.getAllSync<{ readonly place_id: string }>(
    `SELECT place_id FROM place_collections WHERE collection_id = ?;`,
    collectionId,
  );

  return rows.map((row: { readonly place_id: string }): string => row.place_id);
};

const summarizeCollection = (collection: CollectionRecord): CollectionSummary => {
  const places = listPlacesInCollection(collection.id);

  return {
    coverPhotoUri: places[0]?.photoUri ?? null,
    dateSpan: computeDateSpan(places),
    id: collection.id,
    name: collection.name,
    placeCount: places.length,
  };
};

const computeDateSpan = (places: PlaceRecord[]): string | null => {
  if (places.length === 0) {
    return null;
  }

  const times = places.map((place: PlaceRecord): number => new Date(place.capturedAt).getTime());
  const earliest = formatMonth(new Date(Math.min(...times)));
  const latest = formatMonth(new Date(Math.max(...times)));

  return earliest === latest ? latest : `${earliest} – ${latest}`;
};

const formatMonth = (date: Date): string =>
  date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });

const mapCollectionRow = (row: CollectionRow): CollectionRecord => ({
  createdAt: row.created_at,
  id: row.id,
  name: row.name,
  updatedAt: row.updated_at,
});
