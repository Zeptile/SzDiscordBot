import { InferModel } from "drizzle-orm";
import { reactionRoleMessages } from "../schema";
import { BaseRepository } from "./base/BaseRepository";

export type ReactionRoleMessage = InferModel<typeof reactionRoleMessages>;
export type NewReactionRoleMessage = InferModel<
  typeof reactionRoleMessages,
  "insert"
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
