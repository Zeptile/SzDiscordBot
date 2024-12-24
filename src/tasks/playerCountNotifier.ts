import { Client, TextChannel } from "discord.js";
import { Task } from "../types/Task";
import { ServerQuery } from "../utils/ServerQuery";
import config from "../config/servers.json";
import { createServerEmbed } from "../utils/createServerEmbed";
import logger from "../utils/logger";
import { reactionRoleMessageRepository } from "../db/repositories/ReactionRoleMessageRepository";

interface ServerState {
  currentPlayers: number;
  notifiedThresholds: Set<number>;
}

const serverStates = new Map<string, ServerState>();

// Initialize server states
config.servers.forEach((server) => {
  serverStates.set(`${server.host}:${server.port}`, {
    currentPlayers: 0,
    notifiedThresholds: new Set(),
  });
});

async function checkServer(client: Client, server: (typeof config.servers)[0]) {
  const query = new ServerQuery(server.host, server.port);
  const serverKey = `${server.host}:${server.port}`;
  const state = serverStates.get(serverKey)!;

  try {
    const info = await query.getServerInfo();
    const playerCount = info.players;

    if (playerCount > state.currentPlayers) {
      for (const threshold of config.playerThresholds) {
        if (
          playerCount < threshold ||
          state.notifiedThresholds.has(threshold)
        ) {
          continue;
        }

        const channel = client.channels.cache.get(
          process.env.NOTIFICATION_CHANNEL_ID!
        ) as TextChannel;

        if (!channel) {
          logger.error("Notification channel not found");
          continue;
        }

        const roleMention = await reactionRoleMessageRepository
          .findMany({})
          .then((messages) =>
            messages[0]?.roleId ? `<@&${messages[0].roleId}> ` : ""
          )
          .catch((error) => {
            logger.error("Failed to get role ID from database:", error);
            return "";
          });

        await channel.send({
          content: `${roleMention}🎮 **${server.name}** has reached ${playerCount} players!`,
          ...createServerEmbed(info, server.host, server.port),
        });

        state.notifiedThresholds.add(threshold);
      }
    } else if (playerCount < state.currentPlayers) {
      // If player count decreased, only reset thresholds that are now below the current count
      for (const threshold of state.notifiedThresholds) {
        if (playerCount < threshold) {
          state.notifiedThresholds.delete(threshold);
        }
      }
    }

    state.currentPlayers = playerCount;
  } catch (error) {
    logger.error(`Failed to query ${server.name}:`, error);
  }
}

export const task: Task = {
  name: "playerCountNotifier",
  interval: 30000, // Check every 30 seconds

  async execute(client: Client) {
    for (const server of config.servers) {
      await checkServer(client, server);
    }
  },
};
