import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config';

// Create persistent SQLite database file
const dbFilePath = path.isAbsolute(config.DB_PATH)
  ? config.DB_PATH
  : path.join(__dirname, '..', '..', config.DB_PATH);

export const rawDb = new DatabaseSync(dbFilePath);

// Enable foreign keys and WAL mode for performance
rawDb.exec('PRAGMA foreign_keys = ON;');
rawDb.exec('PRAGMA journal_mode = WAL;');

let transactionDepth = 0;

export const db = {
  exec(sql: string) {
    return rawDb.exec(sql);
  },

  query<T = any>(sql: string, params: any[] = []): T[] {
    const stmt = rawDb.prepare(sql);
    return stmt.all(...params) as T[];
  },

  get<T = any>(sql: string, params: any[] = []): T | undefined {
    const stmt = rawDb.prepare(sql);
    return (stmt.get(...params) as T) || undefined;
  },

  run(sql: string, params: any[] = []) {
    const stmt = rawDb.prepare(sql);
    return stmt.run(...params);
  },

  transaction<T>(fn: () => T): T {
    const isRoot = transactionDepth === 0;
    const savepointName = `sp_${transactionDepth}`;
    if (isRoot) {
      rawDb.exec('BEGIN TRANSACTION;');
    } else {
      rawDb.exec(`SAVEPOINT ${savepointName};`);
    }
    transactionDepth++;

    try {
      const result = fn();
      transactionDepth--;
      if (isRoot) {
        rawDb.exec('COMMIT;');
      } else {
        rawDb.exec(`RELEASE SAVEPOINT ${savepointName};`);
      }
      return result;
    } catch (error) {
      transactionDepth--;
      if (isRoot) {
        rawDb.exec('ROLLBACK;');
      } else {
        rawDb.exec(`ROLLBACK TO SAVEPOINT ${savepointName};`);
      }
      throw error;
    }
  }
};

export function initDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  rawDb.exec(schemaSql);
  console.log('[DB] Schema initialized successfully.');
}
