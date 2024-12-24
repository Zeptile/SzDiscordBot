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
