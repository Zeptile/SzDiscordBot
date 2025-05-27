import { Client, TextChannel, EmbedBuilder } from "discord.js";
import { getAssetPath } from "../utils/getAssetPath";
import logger from "../utils/logger";
import { reactionRoleMessageRepository } from "../db/repositories/ReactionRoleMessageRepository";

const REACTION_EMOJI = "🔔";
const ROLE_MESSAGE_TITLE = "Get Notified";

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
        `Existing message ${existingMessage.messageId} not found, creating new one`
      );
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
