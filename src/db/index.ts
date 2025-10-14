import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

const dbPath = process.env.SQLITE_DB_PATH || "sz-discord-bot.db";
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

export async function initializeDatabase() {
  sqlite.pragma("journal_mode = WAL");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS reaction_role_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT NOT NULL,
      message_id TEXT UNIQUE NOT NULL,
      role_id TEXT NOT NULL,
      emoji TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS game_servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      host TEXT NOT NULL,
      port INTEGER NOT NULL,
      name TEXT NOT NULL,
      friendly_name TEXT NOT NULL,
      thumbnail_url TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bot_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS server_status_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER NOT NULL,
      channel_id TEXT NOT NULL,
      message_id TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS game_servers_host_port_idx ON game_servers (host, port);
    CREATE INDEX IF NOT EXISTS bot_config_key_idx ON bot_config (key);
    CREATE INDEX IF NOT EXISTS server_status_messages_server_id_idx ON server_status_messages (server_id);
    CREATE INDEX IF NOT EXISTS server_status_messages_channel_id_idx ON server_status_messages (channel_id);
  `);

  const baseUrl = db
    .select()
    .from(schema.botConfig)
    .where(eq(schema.botConfig.key, "baseUrl"))
    .get();

  if (!baseUrl) {
    db.insert(schema.botConfig)
      .values({ key: "baseUrl", value: "https://snipezilla.com/steam" })
      .run();
  }

  const thresholds = db
    .select()
    .from(schema.botConfig)
    .where(eq(schema.botConfig.key, "playerThresholds"))
    .get();

  if (!thresholds) {
    db.insert(schema.botConfig)
      .values({ key: "playerThresholds", value: JSON.stringify([3, 5, 10]) })
      .run();
  }
}
