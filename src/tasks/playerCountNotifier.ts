import { Client, TextChannel } from "discord.js";
import { Task } from "../types/Task";
import { ServerQuery } from "../utils/ServerQuery";
import { createServerEmbed } from "../utils/createServerEmbed";
import logger from "../utils/logger";
import { reactionRoleMessageRepository } from "../db/repositories/ReactionRoleMessageRepository";
import { gameServerRepository } from "../db/repositories/GameServerRepository";
import { botConfigRepository } from "../db/repositories/BotConfigRepository";
import type { GameServer } from "../db/repositories/GameServerRepository";

interface ServerState {
  currentPlayers: number;
  notifiedThresholds: Set<number>;
}

const serverStates = new Map<string, ServerState>();

async function initializeServerStates() {
  try {
    const servers = await gameServerRepository.getAllServers();
    serverStates.clear();

    servers.forEach((server) => {
      serverStates.set(`${server.host}:${server.port}`, {
        currentPlayers: 0,
        notifiedThresholds: new Set(),
      });
    });
  } catch (error) {
    logger.error("Failed to initialize server states:", error);
  }
}

async function ensureServerState(server: GameServer) {
  const serverKey = `${server.host}:${server.port}`;
  if (!serverStates.has(serverKey)) {
    serverStates.set(serverKey, {
      currentPlayers: 0,
      notifiedThresholds: new Set(),
    });
  }
}

async function checkServer(client: Client, server: GameServer) {
  const query = new ServerQuery(server.host, server.port);
  const serverKey = `${server.host}:${server.port}`;

  await ensureServerState(server);
  const state = serverStates.get(serverKey);

  if (!state) {
    logger.error(`No state found for server ${serverKey}`);
    return;
  }

  try {
    const info = await query.getServerInfo();
    const playerCount = info.players;
    const botCount = info.bots;

    const actualPlayerCount = playerCount - botCount;

    const thresholds = await botConfigRepository.getPlayerThresholds();

    if (actualPlayerCount > state.currentPlayers) {
      const sortedThresholds = thresholds.sort((a, b) => a - b);
      const nextThreshold = sortedThresholds.find(
        (threshold) =>
          actualPlayerCount >= threshold &&
          !state.notifiedThresholds.has(threshold)
      );

      if (nextThreshold) {
        const channel = client.channels.cache.get(
          process.env.NOTIFICATION_CHANNEL_ID!
        ) as TextChannel;

        if (!channel) {
          logger.error("Notification channel not found");
          return;
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

        const embed = await createServerEmbed(info, server.host, server.port);

        await channel.send({
          content: `${roleMention}🎮 **${server.friendlyName}** has reached ${actualPlayerCount} players!`,
          ...embed,
        });

        state.notifiedThresholds.add(nextThreshold);
      }
    } else if (actualPlayerCount < state.currentPlayers) {
      // If player count decreased, only reset thresholds that are now below the current count
      for (const threshold of state.notifiedThresholds) {
        if (actualPlayerCount < threshold) {
          state.notifiedThresholds.delete(threshold);
        }
      }
    }

    state.currentPlayers = actualPlayerCount;
  } catch (error) {
    logger.error(`Failed to query ${server.name}:`, error);
  }
}

export const task: Task = {
  name: "playerCountNotifier",
  interval: 30000,

  async initialize(client: Client) {
    await initializeServerStates();
  },

  async execute(client: Client) {
    try {
      const servers = await gameServerRepository.getAllServers();
      for (const server of servers) {
        await checkServer(client, server);
      }
    } catch (error) {
      logger.error("Error in playerCountNotifier task:", error);
    }
  },
};
