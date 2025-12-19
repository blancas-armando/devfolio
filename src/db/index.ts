import Database from 'better-sqlite3';
import { homedir } from 'os';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { initializeSchema } from './schema.js';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  // Store in ~/.devfolio/data.db
  const dataDir = join(homedir(), '.devfolio');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = join(dataDir, 'data.db');
  db = new Database(dbPath);

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');

  // Initialize schema
  initializeSchema(db);

  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

// For demo mode - use in-memory database
export function getInMemoryDb(): Database.Database {
  const memDb = new Database(':memory:');
  initializeSchema(memDb);
  return memDb;
}
