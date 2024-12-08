import { Client } from "discord.js";
import { Task } from "../types/Task";
import { ServerQuery } from "../utils/ServerQuery";

const SERVERS = [
  { host: "server1.example.com", port: 27015 },
  { host: "server2.example.com", port: 27015 },
];

let currentServerIndex = 0;

export const task: Task = {
  name: "updateServerStatus",
  interval: 60000, // 60 seconds

  async execute(client: Client) {
    try {
      const server = SERVERS[currentServerIndex];
      const query = new ServerQuery(server.host, server.port);
      const info = await query.getServerInfo();

      await client.user?.setUsername(
        `${info.name} (${info.players}/${info.maxPlayers})`
      );

      currentServerIndex = (currentServerIndex + 1) % SERVERS.length;
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  },
};
