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
      "createdAt",
      "updatedAt",
    ]);
  }

  async getAllServers(): Promise<GameServer[]> {
    return this.findMany({});
  }
}

export const gameServerRepository = new GameServerRepository();
