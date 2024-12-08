import { Client, TextChannel } from "discord.js";
import { Task } from "../types/Task";
import { ServerQuery } from "../utils/ServerQuery";
import config from "../config/servers.json";

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

    // If player count increased, check thresholds
    if (playerCount > state.currentPlayers) {
      for (const threshold of config.playerThresholds) {
        if (
          playerCount >= threshold &&
          !state.notifiedThresholds.has(threshold)
        ) {
          const channel = client.channels.cache.get(
            config.notificationChannelId
          ) as TextChannel;

          if (channel) {
            await channel.send(
              `🎮 **${server.name}** has reached ${playerCount} players! (Map: ${info.map})`
            );
            state.notifiedThresholds.add(threshold);
          }
        }
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
    console.error(`Failed to query ${server.name}:`, error);
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
