import * as Crypto from 'expo-crypto';

import { getDatabase } from '../database/database';
import { PlacePhotoRecord, PlacePhotoRow } from './placeTypes';

export const listPlacePhotos = (placeId: string): PlacePhotoRecord[] => {
  const database = getDatabase();
  const rows = database.getAllSync<PlacePhotoRow>(
    `SELECT * FROM place_photos WHERE place_id = ? ORDER BY position ASC;`,
    placeId,
  );

  return rows.map(mapPhotoRow);
};

export const addPlacePhotos = (placeId: string, uris: string[], startPosition = 0): void => {
  const database = getDatabase();
  const timestamp = new Date().toISOString();

  uris.forEach((uri: string, index: number): void => {
    database.runSync(
      `INSERT INTO place_photos (id, place_id, uri, position, created_at) VALUES (?, ?, ?, ?, ?);`,
      `photo_${Crypto.randomUUID()}`,
      placeId,
      uri,
      startPosition + index,
      timestamp,
    );
  });
};

export const replacePlacePhotos = (placeId: string, uris: string[]): void => {
  const database = getDatabase();
  database.runSync(`DELETE FROM place_photos WHERE place_id = ?;`, placeId);
  addPlacePhotos(placeId, uris, 0);
};

const mapPhotoRow = (row: PlacePhotoRow): PlacePhotoRecord => ({
  id: row.id,
  placeId: row.place_id,
  position: row.position,
  uri: row.uri,
});
