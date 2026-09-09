import * as SQLite from 'expo-sqlite';
import { trailKeys } from '../../modules/trail-keys/src/trail-keys';
import { randomHex, readSecret, writeSecret } from '../security/secure-values';

let databasePromise: Promise<SQLite.SQLiteDatabase> | undefined;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  databasePromise ??= openDatabase().catch(error => { databasePromise = undefined; throw error; });
  return databasePromise;
}

async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  let key = await readSecret('database-key-v1');
  if (!key) { key = await randomHex(); await writeSecret('database-key-v1', key); }
  if (!/^[a-f0-9]{64}$/.test(key)) throw new Error('The database key is invalid.');
  const database = await SQLite.openDatabaseAsync('location-log.db');
  try {
    // PRAGMA does not support bound parameters. Only a validated random hex key enters this statement.
    await database.execAsync(`PRAGMA key = "x'${key}'";`);
    const cipher = await database.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version');
    if (!cipher?.cipher_version) throw new Error('Encrypted storage requires a development build. Expo Go is unsupported.');
    await trailKeys.protectStorage();
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = FULL;
      CREATE TABLE IF NOT EXISTS records (
        sequence INTEGER PRIMARY KEY, body TEXT NOT NULL, hash TEXT NOT NULL UNIQUE,
        signature TEXT NOT NULL, kind TEXT NOT NULL, recorded_at REAL NOT NULL
      );
      CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TRIGGER IF NOT EXISTS records_no_update BEFORE UPDATE ON records
        BEGIN SELECT RAISE(ABORT, 'Records cannot be edited'); END;
      CREATE TRIGGER IF NOT EXISTS records_no_delete BEFORE DELETE ON records
        BEGIN SELECT RAISE(ABORT, 'Records cannot be deleted'); END;
    `);
    return database;
  } catch (error) { await database.closeAsync(); throw error; }
}

export async function readMetadata(key: string): Promise<string | null> {
  const database = await getDatabase();
  return (await database.getFirstAsync<{ value: string }>('SELECT value FROM metadata WHERE key = ?', key))?.value ?? null;
}

export async function writeMetadata(key: string, value: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)', key, value);
}
