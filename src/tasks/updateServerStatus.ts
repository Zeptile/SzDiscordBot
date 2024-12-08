import { Client } from "discord.js";
import { Task } from "../types/Task";
import { ServerQuery } from "../utils/ServerQuery";
import config from "../config/servers.json";

let currentServerIndex = 0;

export const task: Task = {
  name: "updateServerStatus",
  interval: 60000, // 60 seconds

  async execute(client: Client) {
    try {
      const server = config.servers[currentServerIndex];
      const query = new ServerQuery(server.host, server.port);
      const info = await query.getServerInfo();

      await client.user?.setUsername(
        `${server.name} (${info.players}/${info.maxPlayers})`
      );

      currentServerIndex = (currentServerIndex + 1) % config.servers.length;
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  },
};
