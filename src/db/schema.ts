import { sql } from "drizzle-orm";
import { text, integer, sqliteTable, index } from "drizzle-orm/sqlite-core";

export const reactionRoleMessages = sqliteTable(
  "reaction_role_messages",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    channelId: text("channel_id").notNull(),
    messageId: text("message_id").notNull().unique(),
    roleId: text("role_id").notNull(),
    emoji: text("emoji").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => []
);

export const gameServers = sqliteTable(
  "game_servers",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    host: text("host").notNull(),
    port: integer("port", { mode: "number" }).notNull(),
    name: text("name").notNull(),
    friendlyName: text("friendly_name").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("game_servers_host_port_idx").on(table.host, table.port)]
);

export const botConfig = sqliteTable(
  "bot_config",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    key: text("key").notNull().unique(),
    value: text("value").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("bot_config_key_idx").on(table.key)]
);
