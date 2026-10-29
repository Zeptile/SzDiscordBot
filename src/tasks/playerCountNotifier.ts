import { Client, Message, TextChannel } from "discord.js";
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
  // The single "live" notification message for this server.
  // Created on the first threshold crossing, then edited in place.
  liveMessage?: Message;
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

    const thresholds = (await botConfigRepository.getPlayerThresholds()).sort(
      (a, b) => a - b
    );
    const lowestThreshold = thresholds[0] ?? Infinity;

    // Did we just reach a threshold we hadn't already announced?
    // (A threshold is re-armed once the count drops back below it.)
    let reachedNewThreshold = false;
    for (const t of thresholds) {
      if (actualPlayerCount >= t) {
        if (!state.notifiedThresholds.has(t)) reachedNewThreshold = true;
        state.notifiedThresholds.add(t);
      } else {
        state.notifiedThresholds.delete(t);
      }
    }

    const countChanged = actualPlayerCount !== state.currentPlayers;
    state.currentPlayers = actualPlayerCount;

    // --- Server dropped below the lowest threshold: close out the live message
    if (actualPlayerCount < lowestThreshold) {
      if (state.liveMessage && countChanged) {
        try {
          await state.liveMessage.edit({
            content: `💤 **${server.friendlyName}** has quieted down (${actualPlayerCount} players).`,
            embeds: [],
            components: [],
          });
        } catch (error) {
          logger.error("Failed to finalize live notification:", error);
        }
        // Keep the reference: when the server fills up again, the new post
        // replaces (deletes) this "quieted down" message too.
      }
      return;
    }

    // --- At or above the lowest threshold
    if (!countChanged && state.liveMessage) return; // nothing new to show

    const embed = await createServerEmbed(info, server.host, server.port);
    const text = `🎮 **${server.friendlyName}** is live with **${actualPlayerCount}** players!`;

    if (state.liveMessage && !reachedNewThreshold) {
      // Count changed between thresholds: update silently in place
      try {
        await state.liveMessage.edit({ content: text, ...embed });
        return;
      } catch (error) {
        // Message was deleted or can't be edited — fall through and post a new one
        logger.warn("Live notification edit failed, posting new one:", error);
        state.liveMessage = undefined;
      }
    }

    // New threshold reached: post a fresh message (pings the role),
    // then delete the previous one so only one notification stays in the channel.
    const previousMessage = state.liveMessage;
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

    state.liveMessage = await channel.send({
      content: `${roleMention}${text}`,
      ...embed,
    });

    if (previousMessage) {
      await previousMessage.delete().catch((error) => {
        logger.warn("Could not delete previous notification:", error);
      });
    }
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
