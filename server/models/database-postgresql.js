import pkg from 'pg';
const { Pool } = pkg;
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use PostgreSQL in production, SQLite in development
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

let db;
let pool;

if (isProduction && process.env.DATABASE_URL) {
  // PostgreSQL for production
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  // SQLite for local development
  const dbPath = join(__dirname, '../database.sqlite');
  db = new sqlite3.Database(dbPath);
}

export const initDatabase = async () => {
  if (isProduction && pool) {
    // PostgreSQL schema
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          name TEXT,
          password_hash TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS thoughts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          transcription TEXT,
          processed_text TEXT NOT NULL,
          category TEXT NOT NULL,
          sub_category TEXT,
          mood_score REAL,
          priority TEXT DEFAULT 'medium',
          tags TEXT,
          action_steps TEXT,
          status TEXT DEFAULT 'pending',
          task_status TEXT,
          requires_triage BOOLEAN DEFAULT FALSE,
          created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS goals (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'active',
          created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_thoughts_user_id ON thoughts(user_id);
        CREATE INDEX IF NOT EXISTS idx_thoughts_status ON thoughts(status);
        CREATE INDEX IF NOT EXISTS idx_thoughts_category ON thoughts(category);
        CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
        CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
      `);
      console.log('✅ PostgreSQL database initialized successfully');
    } catch (err) {
      console.error('PostgreSQL initialization error:', err);
      throw err;
    }
  } else {
    // SQLite initialization (existing code)
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.exec(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            password_hash TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS thoughts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            transcription TEXT,
            processed_text TEXT NOT NULL,
            category TEXT NOT NULL,
            sub_category TEXT,
            mood_score REAL,
            priority TEXT DEFAULT 'medium',
            tags TEXT,
            action_steps TEXT,
            status TEXT DEFAULT 'pending',
            task_status TEXT,
            requires_triage BOOLEAN DEFAULT FALSE,
            created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'active',
            created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
          );

          CREATE INDEX IF NOT EXISTS idx_thoughts_user_id ON thoughts(user_id);
          CREATE INDEX IF NOT EXISTS idx_thoughts_status ON thoughts(status);
          CREATE INDEX IF NOT EXISTS idx_thoughts_category ON thoughts(category);
          CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
          CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
        `, (err) => {
          if (err) {
            console.error('SQLite initialization error:', err);
            reject(err);
          } else {
            console.log('✅ SQLite database initialized successfully');
            resolve();
          }
        });
      });
    });
  }
};

// Helper functions that work with both databases
export const runQuery = async (sql, params = []) => {
  if (isProduction && pool) {
    const result = await pool.query(sql, params);
    return result.rows;
  } else {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

export const runQuerySingle = async (sql, params = []) => {
  if (isProduction && pool) {
    const result = await pool.query(sql, params);
    return result.rows[0];
  } else {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
};

export const runQueryExec = async (sql, params = []) => {
  if (isProduction && pool) {
    const result = await pool.query(sql + ' RETURNING id', params);
    return { 
      id: result.rows[0]?.id, 
      changes: result.rowCount 
    };
  } else {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
};

export default isProduction ? pool : db;