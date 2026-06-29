import * as SQLite from 'expo-sqlite';

import { migrations } from './migrations';

export const databaseName =
  process.env.JEST_WORKER_ID !== undefined ? ':memory:' : 'dunestack_places.db';

let cachedDatabase: SQLite.SQLiteDatabase | null = null;
let hasInitialized = false;

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (cachedDatabase === null) {
    cachedDatabase = SQLite.openDatabaseSync(databaseName);
  }

  return cachedDatabase;
};

/**
 * Prepares the database connection and applies any pending schema migrations.
 *
 * Safe to call multiple times: migrations run only once per version, and the
 * work is skipped entirely after the first successful run in this app session.
 * Call once at app start (see `app/_layout.tsx`).
 */
export const initializeDatabase = (): void => {
  if (hasInitialized) {
    return;
  }

  const database = getDatabase();

  // journal_mode cannot run inside a transaction, so set it before migrations.
  database.execSync('PRAGMA journal_mode = WAL;');
  runMigrations(database);

  hasInitialized = true;
};

/**
 * Closes and clears the cached connection so the next `initializeDatabase()`
 * starts from a fresh schema. Intended for use between tests only.
 */
export const resetDatabaseForTests = (): void => {
  if (cachedDatabase !== null) {
    try {
      cachedDatabase.closeSync();
    } catch {
      // Connection was already closed; nothing to do.
    }
  }

  cachedDatabase = null;
  hasInitialized = false;
};

const runMigrations = (database: SQLite.SQLiteDatabase): void => {
  const result = database.getFirstSync<{ readonly user_version: number }>('PRAGMA user_version;');
  const currentVersion = result?.user_version ?? 0;

  const pendingMigrations = migrations.filter(
    (migration): boolean => migration.version > currentVersion,
  );

  for (const migration of pendingMigrations) {
    database.withTransactionSync((): void => {
      migration.up(database);
      // Version is an integer from our own code, so it is safe to inline.
      database.execSync(`PRAGMA user_version = ${migration.version};`);
    });
  }
};
