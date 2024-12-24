import { Client, ActivityType } from "discord.js";
import { Task } from "../types/Task";
import { ServerQuery } from "../utils/ServerQuery";
import logger from "../utils/logger";
import { gameServerRepository } from "../db/repositories/GameServerRepository";

let currentServerIndex = 0;
let cachedServers: Awaited<
  ReturnType<typeof gameServerRepository.getAllServers>
> = [];

async function refreshServerCache() {
  try {
    cachedServers = await gameServerRepository.getAllServers();
    // Reset index if it's out of bounds after refresh
    if (currentServerIndex >= cachedServers.length) {
      currentServerIndex = 0;
    }
  } catch (error) {
    logger.error("Failed to refresh server cache:", error);
  }
}

export const task: Task = {
  name: "updateServerStatus",
  interval: 30000, // 30 seconds

  async execute(client: Client) {
    try {
      await refreshServerCache();

      if (cachedServers.length === 0) {
        client.user?.setActivity({
          name: "No servers configured",
          type: ActivityType.Playing,
        });
        return;
      }

      const server = cachedServers[currentServerIndex];
      const query = new ServerQuery(server.host, server.port);
      const info = await query.getServerInfo();

      client.guilds.cache.forEach(async (guild) => {
        await guild.members.me?.setNickname(`${server.friendlyName}`);
      });

      client.user?.setActivity({
        name: `${info.players}/${info.maxPlayers} ${info.map}`,
        type: ActivityType.Playing,
      });

      currentServerIndex = (currentServerIndex + 1) % cachedServers.length;
    } catch (error) {
      logger.error("Failed to update status:", error);

      // Set a fallback status on error
      client.user?.setActivity({
        name: "Server query failed",
        type: ActivityType.Playing,
      });
    }
  },
};
