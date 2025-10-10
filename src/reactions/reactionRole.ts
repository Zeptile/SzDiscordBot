import { Client, TextChannel, EmbedBuilder } from "discord.js";
import { getAssetPath } from "../utils/getAssetPath";
import logger from "../utils/logger";
import { reactionRoleMessageRepository } from "../db/repositories/ReactionRoleMessageRepository";

const REACTION_EMOJI = "🔔";
const ROLE_MESSAGE_TITLE = "Get Notified";

/**
 * Searches for an existing role message in the channel by matching its content.
 * This is a fallback method when the database reference is lost.
 */
async function findRoleMessageByContent(
  channel: TextChannel
): Promise<string | null> {
  try {
    // Fetch recent messages (limit 100, should be enough for most cases)
    const messages = await channel.messages.fetch({ limit: 100 });

    for (const [messageId, message] of messages) {
      // Check if message has embeds and matches our role message pattern
      if (
        message.embeds.length > 0 &&
        message.embeds[0].title === ROLE_MESSAGE_TITLE &&
        message.embeds[0].description?.includes(REACTION_EMOJI) &&
        message.embeds[0].description?.includes(
          "get notified when players join the server"
        )
      ) {
        logger.info(
          `Found existing role message by content search: ${messageId}`
        );
        return messageId;
      }
    }

    return null;
  } catch (error) {
    logger.error("Failed to search for role message by content:", error);
    return null;
  }
}

export async function createRoleMessage(channel: TextChannel) {
  try {
    const assetPath = getAssetPath("SZ_LOGO_256.png");

    const embed = new EmbedBuilder()
      .setTitle(ROLE_MESSAGE_TITLE)
      .setDescription(
        `React with ${REACTION_EMOJI} to get notified when players join the server!\n\nRemove your reaction to stop receiving notifications.`
      )
      .setColor(0x00ff00)
      .setThumbnail("attachment://SZ_LOGO_256.png");

    const message = await channel.send({
      embeds: [embed],
      files: [{ attachment: assetPath, name: "SZ_LOGO_256.png" }],
    });

    await message.react(REACTION_EMOJI);

    const roleMessage = await reactionRoleMessageRepository.create({
      channelId: channel.id,
      messageId: message.id,
      roleId: process.env.PINGABLE_ROLE_ID!,
      emoji: REACTION_EMOJI,
    });

    return roleMessage.messageId;
  } catch (error) {
    logger.error("Failed to create role message:", error);
    throw error;
  }
}

async function getOrCreateRoleMessage(channel: TextChannel) {
  try {
    const existingMessage = await reactionRoleMessageRepository.findOne({
      channelId: channel.id,
    });

    if (!existingMessage) {
      logger.info("No existing role message found, creating new one");
      return await createRoleMessage(channel);
    }

    try {
      await channel.messages.fetch(existingMessage.messageId);
      return existingMessage.messageId;
    } catch (error) {
      logger.warn(
        `Existing message ${existingMessage.messageId} not found, attempting content-based search`
      );

      // Try to find the message by content before creating a new one
      const foundMessageId = await findRoleMessageByContent(channel);

      if (foundMessageId) {
        // Update the database with the found message
        await reactionRoleMessageRepository.delete({
          messageId: existingMessage.messageId,
        });
        await reactionRoleMessageRepository.create({
          channelId: channel.id,
          messageId: foundMessageId,
          roleId: process.env.PINGABLE_ROLE_ID!,
          emoji: REACTION_EMOJI,
        });
        logger.info(
          `Updated database with found message ${foundMessageId}, avoiding duplicate`
        );
        return foundMessageId;
      }

      // Only create a new message if we couldn't find it by content
      logger.info("Message not found by content search, creating new one");
      await reactionRoleMessageRepository.delete({
        messageId: existingMessage.messageId,
      });
      return await createRoleMessage(channel);
    }
  } catch (error) {
    logger.error("Failed to get or create role message:", error);
    throw error;
  }
}

export async function setupReactionRole(client: Client) {
  if (!process.env.ROLE_CHANNEL_ID) {
    logger.error("ROLE_CHANNEL_ID not set in environment variables!");
    return;
  }

  if (!process.env.PINGABLE_ROLE_ID) {
    logger.error("PINGABLE_ROLE_ID not set in environment variables!");
    return;
  }

  const channel = client.channels.cache.get(
    process.env.ROLE_CHANNEL_ID
  ) as TextChannel;

  if (!channel) {
    logger.error(`Role channel ${process.env.ROLE_CHANNEL_ID} not found!`);
    return;
  }

  let messageId: string;
  try {
    messageId = await getOrCreateRoleMessage(channel);
  } catch (error) {
    logger.error("Failed to setup reaction role system:", error);
    return;
  }

  client.on("messageReactionAdd", async (reaction, user) => {
    try {
      if (user.bot) return;
      if (reaction.message.id !== messageId) return;
      if (reaction.emoji.name !== REACTION_EMOJI) return;

      const guild = reaction.message.guild;
      if (!guild) {
        logger.error("Guild not found for reaction!");
        return;
      }

      const member = await guild.members.fetch(user.id);
      const role = guild.roles.cache.get(process.env.PINGABLE_ROLE_ID!);

      if (!role) {
        logger.error(
          `Pingable role ${process.env.PINGABLE_ROLE_ID} not found!`
        );
        return;
      }

      await member.roles.add(role);
      logger.info(`Added role ${role.name} to user ${user.tag}`);
    } catch (error) {
      logger.error(`Failed to add role to user ${user.tag}:`, error);
    }
  });

  client.on("messageReactionRemove", async (reaction, user) => {
    try {
      if (user.bot) return;
      if (reaction.message.id !== messageId) return;
      if (reaction.emoji.name !== REACTION_EMOJI) return;

      const guild = reaction.message.guild;
      if (!guild) {
        logger.error("Guild not found for reaction!");
        return;
      }

      const member = await guild.members.fetch(user.id);
      const role = guild.roles.cache.get(process.env.PINGABLE_ROLE_ID!);

      if (!role) {
        logger.error(
          `Pingable role ${process.env.PINGABLE_ROLE_ID} not found!`
        );
        return;
      }

      await member.roles.remove(role);
      logger.info(`Removed role ${role.name} from user ${user.tag}`);
    } catch (error) {
      logger.error(`Failed to remove role from user ${user.tag}:`, error);
    }
  });
}
