import { z } from 'zod';

export const BACKUP_APP_ID = 'dunestack-places';
export const BACKUP_SCHEMA_VERSION = 1;

export const backupImageSchema = z.object({
  base64: z.string().min(1),
  fileName: z.string().min(1),
});

export const backupPlaceSchema = z.object({
  addressLabel: z.string(),
  capturedAt: z.string(),
  categoryId: z.string(),
  createdAt: z.string(),
  image: backupImageSchema,
  isFavorite: z.boolean(),
  latitude: z.number(),
  locationAccuracyMeters: z.number().nullable(),
  longitude: z.number(),
  notes: z.string(),
  rating: z.number().nullable(),
  tags: z.string(),
  title: z.string(),
  updatedAt: z.string(),
  visitDate: z.string(),
});

export const backupFileSchema = z.object({
  app: z.literal(BACKUP_APP_ID),
  exportedAt: z.string(),
  places: z.array(backupPlaceSchema),
  schemaVersion: z.literal(BACKUP_SCHEMA_VERSION),
});

export type BackupPlace = z.infer<typeof backupPlaceSchema>;
export type BackupFile = z.infer<typeof backupFileSchema>;
