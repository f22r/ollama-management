import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = process.env.DATABASE_PATH
  ? path.dirname(process.env.DATABASE_PATH)
  : path.join(process.cwd(), 'data');

const DB_PATH = process.env.DATABASE_PATH || path.join(DATA_DIR, 'ollama-dashboard.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(database: Database.Database): void {
  database.exec(`
    -- Models metadata
    CREATE TABLE IF NOT EXISTS models (
      name TEXT PRIMARY KEY,
      is_default INTEGER DEFAULT 0,
      last_used DATETIME,
      keep_alive_duration TEXT DEFAULT '5m',
      always_warm INTEGER DEFAULT 0,
      ping_interval INTEGER DEFAULT 0
    );

    -- Presets (per model/season)
    CREATE TABLE IF NOT EXISTS presets (
      id TEXT PRIMARY KEY,
      model TEXT NOT NULL,
      season TEXT DEFAULT 'default',
      name TEXT NOT NULL,
      system_prompt TEXT DEFAULT '',
      temperature REAL DEFAULT 0.7,
      top_p REAL DEFAULT 0.9,
      top_k INTEGER DEFAULT 40,
      num_ctx INTEGER DEFAULT 4096,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(model, season, name)
    );

    -- RAG Seasons
    CREATE TABLE IF NOT EXISTS rag_seasons (
      id TEXT PRIMARY KEY,
      model TEXT NOT NULL,
      name TEXT NOT NULL,
      prompt_policy TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(model, name)
    );

    -- RAG Knowledge chunks
    CREATE TABLE IF NOT EXISTS rag_chunks (
      id TEXT PRIMARY KEY,
      season_id TEXT NOT NULL,
      content TEXT NOT NULL,
      source TEXT DEFAULT '',
      embedding BLOB,
      approved INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (season_id) REFERENCES rag_seasons(id) ON DELETE CASCADE
    );

    -- Approval queue
    CREATE TABLE IF NOT EXISTS approval_queue (
      id TEXT PRIMARY KEY,
      season_id TEXT NOT NULL,
      content TEXT NOT NULL,
      source TEXT DEFAULT 'chat',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (season_id) REFERENCES rag_seasons(id) ON DELETE CASCADE
    );

    -- Request logs
    CREATE TABLE IF NOT EXISTS request_logs (
      id TEXT PRIMARY KEY,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      model TEXT,
      endpoint TEXT,
      method TEXT,
      payload_size INTEGER DEFAULT 0,
      response_size INTEGER DEFAULT 0,
      latency_ms INTEGER DEFAULT 0,
      ttft_ms INTEGER,
      tokens_estimated INTEGER DEFAULT 0,
      error TEXT,
      parameters TEXT
    );

    -- Warmup config
    CREATE TABLE IF NOT EXISTS warmup_config (
      model TEXT PRIMARY KEY,
      ping_interval INTEGER DEFAULT 0,
      warmup_payload TEXT DEFAULT '{"prompt": "hello", "num_predict": 1}',
      fallback_strategy TEXT DEFAULT 'retry'
    );

    -- Alerts
    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      threshold REAL,
      current_value REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      acknowledged INTEGER DEFAULT 0
    );

    -- System metrics history
    CREATE TABLE IF NOT EXISTS system_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      cpu_usage REAL,
      memory_used INTEGER,
      memory_total INTEGER,
      disk_used INTEGER,
      disk_total INTEGER,
      network_rx INTEGER,
      network_tx INTEGER,
      gpu_memory_used INTEGER,
      gpu_memory_total INTEGER,
      gpu_utilization REAL,
      gpu_temperature REAL
    );

    -- Chat sessions
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      model TEXT NOT NULL,
      title TEXT DEFAULT 'New Chat',
      system_prompt TEXT DEFAULT '',
      temperature REAL DEFAULT 0.7,
      top_p REAL DEFAULT 0.9,
      top_k INTEGER DEFAULT 40,
      num_ctx INTEGER DEFAULT 4096,
      season_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Chat messages
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    );

    -- Create indexes for better query performance
    CREATE INDEX IF NOT EXISTS idx_request_logs_timestamp ON request_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_request_logs_model ON request_logs(model);
    CREATE INDEX IF NOT EXISTS idx_rag_chunks_season ON rag_chunks(season_id);
    CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON chat_sessions(updated_at);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
  `);

  // Migration: Add season_id column if it doesn't exist
  try {
    const tableInfo = database.pragma('table_info(chat_sessions)') as any[];
    const hasSeasonId = tableInfo.some(col => col.name === 'season_id');
    if (!hasSeasonId) {
      database.exec('ALTER TABLE chat_sessions ADD COLUMN season_id TEXT');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
