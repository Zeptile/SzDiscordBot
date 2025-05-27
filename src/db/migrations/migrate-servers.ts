import { initializeDatabase } from "..";
import serversConfig from "../../config/servers.json";
import { botConfigRepository } from "../repositories/BotConfigRepository";
import { gameServerRepository } from "../repositories/GameServerRepository";

async function migrateServers() {
  await initializeDatabase();

  try {
    const servers = await gameServerRepository.findMany({});
    const botConfig = await botConfigRepository.findMany({});

    if (servers.length === 0) {
      for (const server of serversConfig.servers) {
        await gameServerRepository.create({
          host: server.host,
          port: server.port,
          name: server.name,
          friendlyName: server.friendlyName,
        });
      }
    }

    if (botConfig.length === 0) {
      await botConfigRepository.setBaseUrl(serversConfig.baseUrl);
      await botConfigRepository.setPlayerThresholds(
        serversConfig.playerThresholds
      );
    }
  } catch (error) {
    console.error("Error migrating servers:", error);
  }

  console.log("Server data migration completed successfully!");
}

migrateServers().catch(console.error);
