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
      // Make latitude/longitude nullable so a place can be saved without a GPS
      // fix. SQLite can't drop NOT NULL in place, so rebuild the table.
      database.execSync(`
        CREATE TABLE places_new (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL,
          category_id TEXT NOT NULL,
          photo_uri TEXT NOT NULL,
          latitude REAL,
          longitude REAL,
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

        INSERT INTO places_new
          SELECT id, title, category_id, photo_uri, latitude, longitude,
                 location_accuracy_meters, captured_at, notes, tags, rating,
                 is_favorite, address_label, visit_date, created_at, updated_at
          FROM places;

        DROP TABLE places;
        ALTER TABLE places_new RENAME TO places;

        CREATE INDEX IF NOT EXISTS idx_places_category_id ON places (category_id);
        CREATE INDEX IF NOT EXISTS idx_places_created_at ON places (created_at);
        CREATE INDEX IF NOT EXISTS idx_places_is_favorite ON places (is_favorite);
      `);
    },
  },
  {
    version: 3,
    up: (database: SQLite.SQLiteDatabase): void => {
      // Collections: named sets that hand-group places (many-to-many).
      database.execSync(`
        CREATE TABLE IF NOT EXISTS collections (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS place_collections (
          collection_id TEXT NOT NULL,
          place_id TEXT NOT NULL,
          created_at TEXT NOT NULL,
          PRIMARY KEY (collection_id, place_id),
          FOREIGN KEY (collection_id) REFERENCES collections (id),
          FOREIGN KEY (place_id) REFERENCES places (id)
        );

        CREATE INDEX IF NOT EXISTS idx_place_collections_place ON place_collections (place_id);
      `);
    },
  },
  {
    version: 4,
    up: (database: SQLite.SQLiteDatabase): void => {
      // Multiple photos per place. Existing places are backfilled with their
      // single photo at position 0; places.photo_uri stays as the cover.
      database.execSync(`
        CREATE TABLE IF NOT EXISTS place_photos (
          id TEXT PRIMARY KEY NOT NULL,
          place_id TEXT NOT NULL,
          uri TEXT NOT NULL,
          position INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (place_id) REFERENCES places (id)
        );

        CREATE INDEX IF NOT EXISTS idx_place_photos_place ON place_photos (place_id);

        INSERT INTO place_photos (id, place_id, uri, position, created_at)
          SELECT 'photo_' || id, id, photo_uri, 0, created_at FROM places;
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
