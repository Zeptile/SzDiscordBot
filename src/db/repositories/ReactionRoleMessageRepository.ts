import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { reactionRoleMessages } from "../schema";
import { BaseRepository } from "./base/BaseRepository";

export type ReactionRoleMessage = InferSelectModel<typeof reactionRoleMessages>;
export type NewReactionRoleMessage = InferInsertModel<
  typeof reactionRoleMessages
>;

export class ReactionRoleMessageRepository extends BaseRepository<
  ReactionRoleMessage,
  typeof reactionRoleMessages
> {
  constructor() {
    super(reactionRoleMessages, [
      "id",
      "channelId",
      "messageId",
      "roleId",
      "emoji",
      "createdAt",
      "updatedAt",
    ]);
  }
}

export const reactionRoleMessageRepository =
  new ReactionRoleMessageRepository();
