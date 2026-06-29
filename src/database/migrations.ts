import * as SQLite from 'expo-sqlite';

import { categories, Category } from '../categories/categories';

export type Migration = {
  readonly version: number;
  readonly up: (database: SQLite.SQLiteDatabase) => void;
};

/**
 * Ordered list of schema migrations. Each migration runs exactly once, inside a
 * transaction, and bumps `PRAGMA user_version` to its `version` on success.
 *
 * Rules for adding a migration:
 *   - Never edit or reorder an existing migration once it has shipped.
 *   - Add a new entry with the next integer version instead.
 *   - Keep each `up` idempotent where practical (use IF NOT EXISTS / OR IGNORE).
 */
export const migrations: readonly Migration[] = [
  {
    version: 1,
    up: (database: SQLite.SQLiteDatabase): void => {
      database.execSync(`
        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS places (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          category_id TEXT NOT NULL,
          photo_uri TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          location_accuracy_meters REAL,
          captured_at TEXT NOT NULL,
          notes TEXT NOT NULL,
          tags TEXT NOT NULL,
          rating INTEGER,
          is_favorite INTEGER NOT NULL,
          address_label TEXT NOT NULL,
          visit_date TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (category_id) REFERENCES categories (id)
        );

        CREATE INDEX IF NOT EXISTS idx_places_category_id ON places (category_id);
        CREATE INDEX IF NOT EXISTS idx_places_created_at ON places (created_at);
        CREATE INDEX IF NOT EXISTS idx_places_is_favorite ON places (is_favorite);
      `);

      seedDefaultCategories(database);
    },
  },
  {
    version: 2,
    up: (database: SQLite.SQLiteDatabase): void => {
      // Soft-delete: a tombstone column so deletes can survive a future sync.
      database.execSync(`
        ALTER TABLE places ADD COLUMN deleted_at TEXT;

        CREATE INDEX IF NOT EXISTS idx_places_deleted_at ON places (deleted_at);
      `);
    },
  },
];

const seedDefaultCategories = (database: SQLite.SQLiteDatabase): void => {
  const timestamp = new Date().toISOString();

  categories.forEach((category: Category): void => {
    database.runSync(
      `
        INSERT OR IGNORE INTO categories (id, name, color, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?);
      `,
      category.id,
      category.label,
      category.color,
      timestamp,
      timestamp,
    );
  });
};
