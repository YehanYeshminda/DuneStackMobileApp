/**
 * Jest manual mock for `expo-sqlite`.
 *
 * The real module relies on a native database that is unavailable under Jest
 * (`jest-expo` only stubs the module-level functions). This mock implements the
 * synchronous methods the app uses on top of `better-sqlite3`, a real in-memory
 * SQLite engine for Node, so repository tests exercise actual SQL.
 */
import Database from 'better-sqlite3';

type SqlParam = string | number | null;

const toParams = (params: SqlParam[]): SqlParam[] =>
  params.length === 1 && Array.isArray(params[0]) ? (params[0] as SqlParam[]) : params;

class MockSQLiteDatabase {
  private readonly db: Database.Database;

  constructor(databaseName: string) {
    this.db = new Database(databaseName === ':memory:' ? ':memory:' : `${databaseName}`);
  }

  execSync(sql: string): void {
    this.db.exec(sql);
  }

  runSync(sql: string, ...params: SqlParam[]): { changes: number; lastInsertRowId: number } {
    const result = this.db.prepare(sql).run(...toParams(params));
    return { changes: result.changes, lastInsertRowId: Number(result.lastInsertRowid) };
  }

  getAllSync<T>(sql: string, ...params: SqlParam[]): T[] {
    return this.db.prepare(sql).all(...toParams(params)) as T[];
  }

  getFirstSync<T>(sql: string, ...params: SqlParam[]): T | null {
    const row = this.db.prepare(sql).get(...toParams(params));
    return (row as T | undefined) ?? null;
  }

  withTransactionSync(task: () => void): void {
    this.db.transaction(task)();
  }

  closeSync(): void {
    this.db.close();
  }
}

export const openDatabaseSync = (databaseName: string): MockSQLiteDatabase =>
  new MockSQLiteDatabase(databaseName);
