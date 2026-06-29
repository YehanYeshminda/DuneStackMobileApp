import * as SQLite from 'expo-sqlite';

import { categories, Category } from '../categories/categories';

export const databaseName = 'dunestack_places.db';

export const getDatabase = (): SQLite.SQLiteDatabase => SQLite.openDatabaseSync(databaseName);

export const initializeDatabase = (): void => {
  const database = getDatabase();

  database.execSync(`
    PRAGMA journal_mode = WAL;

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

  seedCategories(database, new Date().toISOString());
};

const seedCategories = (database: SQLite.SQLiteDatabase, timestamp: string): void => {
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
