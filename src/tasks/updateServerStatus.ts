import { Client, ActivityType } from "discord.js";
import { Task } from "../types/Task";
import { ServerQuery } from "../utils/ServerQuery";
import config from "../config/servers.json";

let currentServerIndex = 0;

export const task: Task = {
  name: "updateServerStatus",
  interval: 600000, // 10 minutes

  async execute(client: Client) {
    try {
      const server = config.servers[currentServerIndex];
      const query = new ServerQuery(server.host, server.port);
      const info = await query.getServerInfo();

      // Get all guilds and update nickname in each one
      client.guilds.cache.forEach(async (guild) => {
        await guild.members.me?.setNickname(server.name);
      });

      client.user?.setActivity({
        name: `${info.players}/${info.maxPlayers} on ${info.map}`,
        type: ActivityType.Playing,
      });

      currentServerIndex = (currentServerIndex + 1) % config.servers.length;
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  },
};
