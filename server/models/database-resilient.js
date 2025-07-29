import sqlite3 from 'sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure the database directory exists
const dbDir = join(__dirname, '..');
const dbPath = join(dbDir, 'database.sqlite');

// Create directory if it doesn't exist
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Open database with better error handling
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    // Try to create a new database file
    fs.writeFileSync(dbPath, '');
  } else {
    console.log('Connected to SQLite database');
  }
});

// Enable WAL mode for better concurrency
db.run('PRAGMA journal_mode=WAL', (err) => {
  if (err) {
    console.error('Error setting WAL mode:', err);
  }
});

// Set busy timeout to handle concurrent access
db.run('PRAGMA busy_timeout=5000', (err) => {
  if (err) {
    console.error('Error setting busy timeout:', err);
  }
});

export const initDatabase = () => {
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
          tags TEXT, -- JSON string
          action_steps TEXT, -- JSON string
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
          FOREIGN KEY (user_id) REFERENCES goals (id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_thoughts_user_id ON thoughts(user_id);
        CREATE INDEX IF NOT EXISTS idx_thoughts_status ON thoughts(status);
        CREATE INDEX IF NOT EXISTS idx_thoughts_category ON thoughts(category);
        CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
        CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
      `, (err) => {
        if (err) {
          console.error('Database initialization error:', err);
          // Try to handle common errors
          if (err.message.includes('SQLITE_READONLY')) {
            console.error('Database is read-only. Check file permissions.');
          } else if (err.message.includes('SQLITE_CANTOPEN')) {
            console.error('Cannot open database file. Check path and permissions.');
          }
          reject(err);
        } else {
          console.log('✅ Database initialized successfully');
          resolve();
        }
      });
    });
  });
};

// Helper function to run queries with promises and error handling
export const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Query error:', err, 'SQL:', sql);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Helper function to run single row queries
export const runQuerySingle = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('Query error:', err, 'SQL:', sql);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Helper function to run insert/update/delete queries
export const runQueryExec = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error('Exec error:', err, 'SQL:', sql);
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing database connection...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

export default db;