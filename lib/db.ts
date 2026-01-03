import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export const initDb = async () => {
    if (db) return db;

    const dbPath = path.join(process.cwd(), 'server', 'data', 'venty.db');
    
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            name TEXT,
            picture TEXT,
            password_hash TEXT,
            is_verified INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS providers (
            provider TEXT,
            provider_user_id TEXT,
            user_id TEXT,
            PRIMARY KEY (provider, provider_user_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            order_id TEXT UNIQUE,
            user_id TEXT,
            amount REAL,
            currency TEXT,
            status TEXT,
            payer_email TEXT,
            payer_name TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );
    `);

    try {
        await db.exec('ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0');
    } catch {}

    return db;
};

export const getDb = async () => {
    if (!db) await initDb();
    return db!;
};
