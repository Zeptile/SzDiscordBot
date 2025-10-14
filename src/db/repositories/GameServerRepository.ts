import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { gameServers } from "../schema";
import { BaseRepository } from "./base/BaseRepository";

export type GameServer = InferSelectModel<typeof gameServers>;
export type NewGameServer = InferInsertModel<typeof gameServers>;

export class GameServerRepository extends BaseRepository<
  GameServer,
  typeof gameServers
> {
  constructor() {
    super(gameServers, [
      "id",
      "host",
      "port",
      "name",
      "friendlyName",
      "thumbnailUrl",
      "createdAt",
      "updatedAt",
    ]);
  }

  async getAllServers(): Promise<GameServer[]> {
    return this.findMany({});
  }

  async getServerByName(name: string): Promise<GameServer | null> {
    return this.findOne({ name });
  }

  async getServerByFriendlyName(friendlyName: string): Promise<GameServer | null> {
    return this.findOne({ friendlyName });
  }

  async setThumbnailUrl(serverId: number, thumbnailUrl: string | null): Promise<void> {
    await this.update({ id: serverId }, { thumbnailUrl });
  }
}

export const gameServerRepository = new GameServerRepository();
