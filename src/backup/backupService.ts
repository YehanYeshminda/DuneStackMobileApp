import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { readImageBase64, saveBase64Image } from '../files/localImages';
import { importPlace, listPlaces } from '../places/placeRepository';
import { PlaceRecord } from '../places/placeTypes';
import {
  BACKUP_APP_ID,
  BACKUP_SCHEMA_VERSION,
  BackupFile,
  BackupPlace,
  backupFileSchema,
} from './backupTypes';

export type ExportResult = {
  readonly placeCount: number;
  readonly shared: boolean;
};

export type ImportResult = {
  readonly canceled: boolean;
  readonly importedCount: number;
};

/**
 * Writes every non-deleted place (with its photo embedded as base64) into a
 * single JSON file and opens the system share sheet so the user can save it.
 */
export const exportBackup = async (): Promise<ExportResult> => {
  const places = listPlaces('');

  if (places.length === 0) {
    return { placeCount: 0, shared: false };
  }

  const backupPlaces = await Promise.all(places.map(toBackupPlace));

  const backup: BackupFile = {
    app: BACKUP_APP_ID,
    exportedAt: new Date().toISOString(),
    places: backupPlaces,
    schemaVersion: BACKUP_SCHEMA_VERSION,
  };

  const file = new File(Paths.cache, `dunestack-backup-${Date.now()}.json`);
  file.create({ overwrite: true });
  file.write(JSON.stringify(backup));

  const canShare = await Sharing.isAvailableAsync();

  if (canShare) {
    await Sharing.shareAsync(file.uri, {
      UTI: 'public.json',
      dialogTitle: 'Export DuneStack backup',
      mimeType: 'application/json',
    });
  }

  return { placeCount: places.length, shared: canShare };
};

/**
 * Lets the user pick a backup file, validates it, and restores every place as
 * a new record (fresh id, original field values). Importing is additive.
 */
export const importBackup = async (): Promise<ImportResult> => {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    type: 'application/json',
  });

  if (result.canceled) {
    return { canceled: true, importedCount: 0 };
  }

  const asset = result.assets[0];

  if (asset === undefined) {
    throw new Error('No file was selected.');
  }

  const file = new File(asset.uri);
  const backup = backupFileSchema.parse(parseJson(await file.text()));

  for (const place of backup.places) {
    const photoUri = saveBase64Image(place.image.base64, place.image.fileName);

    importPlace({
      addressLabel: place.addressLabel,
      capturedAt: place.capturedAt,
      categoryId: place.categoryId,
      createdAt: place.createdAt,
      isFavorite: place.isFavorite,
      latitude: place.latitude,
      locationAccuracyMeters: place.locationAccuracyMeters,
      longitude: place.longitude,
      notes: place.notes,
      photoUri,
      rating: place.rating,
      tags: place.tags,
      title: place.title,
      updatedAt: place.updatedAt,
      visitDate: place.visitDate,
    });
  }

  return { canceled: false, importedCount: backup.places.length };
};

const toBackupPlace = async (place: PlaceRecord): Promise<BackupPlace> => ({
  addressLabel: place.addressLabel,
  capturedAt: place.capturedAt,
  categoryId: place.categoryId,
  createdAt: place.createdAt,
  image: {
    base64: await readImageBase64(place.photoUri),
    fileName: getFileName(place.photoUri),
  },
  isFavorite: place.isFavorite,
  latitude: place.latitude,
  locationAccuracyMeters: place.locationAccuracyMeters,
  longitude: place.longitude,
  notes: place.notes,
  rating: place.rating,
  tags: place.tags,
  title: place.title,
  updatedAt: place.updatedAt,
  visitDate: place.visitDate,
});

const getFileName = (uri: string): string => {
  const lastSegment = uri.split('/').at(-1) ?? '';

  return lastSegment.length > 0 ? lastSegment : 'place.jpg';
};

const parseJson = (contents: string): unknown => {
  try {
    return JSON.parse(contents);
  } catch {
    throw new Error('This file is not a valid DuneStack backup.');
  }
};
