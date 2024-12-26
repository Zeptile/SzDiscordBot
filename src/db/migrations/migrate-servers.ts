import { initializeDatabase } from "..";
import serversConfig from "../../config/servers.json";
import { botConfigRepository } from "../repositories/BotConfigRepository";
import { gameServerRepository } from "../repositories/GameServerRepository";

async function migrateServers() {
  await initializeDatabase();

  for (const server of serversConfig.servers) {
    await gameServerRepository.create({
      host: server.host,
      port: server.port,
      name: server.name,
      friendlyName: server.friendlyName,
    });
  }

  await botConfigRepository.setBaseUrl(serversConfig.baseUrl);
  await botConfigRepository.setPlayerThresholds(serversConfig.playerThresholds);

  console.log("Server data migration completed successfully!");
}

migrateServers().catch(console.error);
