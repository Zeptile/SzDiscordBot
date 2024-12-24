import { Client, TextChannel, EmbedBuilder } from "discord.js";
import { db } from "../db";
import { reactionRoleMessages } from "../db/schema";
import { eq } from "drizzle-orm";
import { getAssetPath } from "../utils/getAssetPath";

const REACTION_EMOJI = "🔔";
const ROLE_MESSAGE_TITLE = "Get Notified";

export async function createRoleMessage(channel: TextChannel) {
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
    files: [
      {
        attachment: assetPath,
        name: "SZ_LOGO_256.png",
      },
    ],
  });

  await message.react(REACTION_EMOJI);

  await db.insert(reactionRoleMessages).values({
    channelId: channel.id,
    messageId: message.id,
    roleId: process.env.PINGABLE_ROLE_ID!,
    emoji: REACTION_EMOJI,
  });

  return message.id;
}

async function getOrCreateRoleMessage(channel: TextChannel) {
  const results = await db
    .select()
    .from(reactionRoleMessages)
    .where(eq(reactionRoleMessages.channelId, channel.id));

  if (results.length <= 0) throw new Error("No reaction role message found");

  const existingMessage = results[0];

  try {
    await channel.messages.fetch(existingMessage.messageId);
    return existingMessage.messageId;
  } catch (error) {
    await db
      .delete(reactionRoleMessages)
      .where(eq(reactionRoleMessages.messageId, existingMessage.messageId));
  }

  return await createRoleMessage(channel);
}

export async function setupReactionRole(client: Client) {
  const channel = client.channels.cache.get(
    process.env.ROLE_CHANNEL_ID!
  ) as TextChannel;

  if (!channel) {
    console.error("Role channel not found!");
    return;
  }

  const messageId = await getOrCreateRoleMessage(channel);

  client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;
    if (reaction.message.id !== messageId) return;
    if (reaction.emoji.name !== REACTION_EMOJI) return;

    const guild = reaction.message.guild;
    if (!guild) return;

    const member = await guild.members.fetch(user.id);
    const role = guild.roles.cache.get(process.env.PINGABLE_ROLE_ID!);

    if (!role) {
      console.error("Pingable role not found!");
      return;
    }

    await member.roles.add(role);
  });

  client.on("messageReactionRemove", async (reaction, user) => {
    if (user.bot) return;
    if (reaction.message.id !== messageId) return;
    if (reaction.emoji.name !== REACTION_EMOJI) return;

    const guild = reaction.message.guild;
    if (!guild) return;

    const member = await guild.members.fetch(user.id);
    const role = guild.roles.cache.get(process.env.PINGABLE_ROLE_ID!);

    if (!role) {
      console.error("Pingable role not found!");
      return;
    }

    await member.roles.remove(role);
  });
}
