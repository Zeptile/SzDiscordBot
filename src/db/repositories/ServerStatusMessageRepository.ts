import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { serverStatusMessages } from "../schema";
import { BaseRepository } from "./base/BaseRepository";

export type ServerStatusMessage = InferSelectModel<typeof serverStatusMessages>;
export type NewServerStatusMessage = InferInsertModel<typeof serverStatusMessages>;

export class ServerStatusMessageRepository extends BaseRepository<
  ServerStatusMessage,
  typeof serverStatusMessages
> {
  constructor() {
    super(serverStatusMessages, [
      "id",
      "serverId",
      "channelId",
      "messageId",
      "createdAt",
      "updatedAt",
    ]);
  }

  async getMessageByServerId(serverId: number): Promise<ServerStatusMessage | null> {
    return this.findOne({ serverId });
  }

  async getMessagesByChannelId(channelId: string): Promise<ServerStatusMessage[]> {
    return this.findMany({ channelId });
  }

  async deleteByServerId(serverId: number): Promise<void> {
    await this.delete({ serverId });
  }

  async deleteByChannelId(channelId: string): Promise<void> {
    await this.delete({ channelId });
  }
}

export const serverStatusMessageRepository = new ServerStatusMessageRepository();
