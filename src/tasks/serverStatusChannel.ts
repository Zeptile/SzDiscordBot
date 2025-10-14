import { Client, TextChannel } from "discord.js";
import { Task } from "../types/Task";
import { gameServerRepository, GameServer } from "../db/repositories/GameServerRepository";
import { serverStatusMessageRepository } from "../db/repositories/ServerStatusMessageRepository";
import { ServerQuery } from "../utils/ServerQuery";
import { createServerEmbed } from "../utils/createServerEmbed";
import logger from "../utils/logger";

const UPDATE_INTERVAL = 30000; // 30 seconds

let cachedClient: Client | null = null;

async function initializeServerStatusChannel(client: Client) {
  cachedClient = client;
  
  const channelId = process.env.SERVER_STATUS_CHANNEL_ID;
  
  if (!channelId) {
    logger.warn("SERVER_STATUS_CHANNEL_ID not set, skipping server status channel initialization");
    return;
  }

  const channel = client.channels.cache.get(channelId) as TextChannel;
  
  if (!channel) {
    logger.error(`Server status channel ${channelId} not found`);
    return;
  }

  logger.info("Initializing server status channel...");

  const servers = await gameServerRepository.getAllServers();
  const existingMessages = await serverStatusMessageRepository.getMessagesByChannelId(channelId);

  // Delete old messages that don't correspond to current servers
  const serverIds = new Set(servers.map(s => s.id));
  for (const msg of existingMessages) {
    if (!serverIds.has(msg.serverId)) {
      await deleteServerStatusMessage(msg.serverId);
    }
  }

  // Create embeds for servers that don't have messages yet
  const existingServerIds = new Set(existingMessages.map(m => m.serverId));
  
  for (const server of servers) {
    if (!existingServerIds.has(server.id)) {
      await createServerStatusMessage(server);
    }
  }

  logger.info("Server status channel initialization complete");
}

async function updateServerStatusChannel(client: Client) {
  const channelId = process.env.SERVER_STATUS_CHANNEL_ID;
  
  if (!channelId) {
    return;
  }

  const channel = client.channels.cache.get(channelId) as TextChannel;
  
  if (!channel) {
    logger.error(`Server status channel ${channelId} not found`);
    return;
  }

  const servers = await gameServerRepository.getAllServers();
  const statusMessages = await serverStatusMessageRepository.getMessagesByChannelId(channelId);
  
  const messageMap = new Map(statusMessages.map(m => [m.serverId, m.messageId]));
  const serverIds = new Set(servers.map(s => s.id));

  // Check for servers that need status messages created (added at runtime)
  for (const server of servers) {
    if (!messageMap.has(server.id)) {
      logger.info(`Detected new server ${server.friendlyName}, creating status message`);
      await createServerStatusMessage(server);
    }
  }

  // Check for orphaned messages (servers deleted at runtime)
  for (const msg of statusMessages) {
    if (!serverIds.has(msg.serverId)) {
      logger.info(`Detected deleted server ID ${msg.serverId}, removing status message`);
      await deleteServerStatusMessage(msg.serverId);
    }
  }

  // Update all existing messages
  const updatedStatusMessages = await serverStatusMessageRepository.getMessagesByChannelId(channelId);
  const updatedMessageMap = new Map(updatedStatusMessages.map(m => [m.serverId, m.messageId]));

  for (const server of servers) {
    const messageId = updatedMessageMap.get(server.id);
    
    if (!messageId) {
      continue;
    }

    try {
      const query = new ServerQuery(server.host, server.port);
      const info = await query.getServerInfo();
      const embed = await createServerEmbed(info, server.host, server.port);
      
      const message = await channel.messages.fetch(messageId);
      await message.edit(embed);
      
      logger.debug(`Updated status for server: ${server.friendlyName}`);
    } catch (error) {
      logger.error(`Failed to update status for server ${server.friendlyName}:`, error);
    }
  }
}

/**
 * Creates a status message for a newly added server
 */
export async function createServerStatusMessage(server: GameServer): Promise<void> {
  const channelId = process.env.SERVER_STATUS_CHANNEL_ID;
  
  if (!channelId || !cachedClient) {
    logger.warn("Cannot create status message: channel not configured or client not initialized");
    return;
  }

  const channel = cachedClient.channels.cache.get(channelId) as TextChannel;
  
  if (!channel) {
    logger.error(`Server status channel ${channelId} not found`);
    return;
  }

  try {
    // Check if message already exists
    const existing = await serverStatusMessageRepository.getMessageByServerId(server.id);
    if (existing) {
      logger.debug(`Status message already exists for server ${server.friendlyName}`);
      return;
    }

    const query = new ServerQuery(server.host, server.port);
    const info = await query.getServerInfo();
    const embed = await createServerEmbed(info, server.host, server.port);
    
    const message = await channel.send(embed);
    
    await serverStatusMessageRepository.create({
      serverId: server.id,
      channelId: channel.id,
      messageId: message.id,
    });
    
    logger.info(`Created status message for server: ${server.friendlyName}`);
  } catch (error) {
    logger.error(`Failed to create status message for server ${server.friendlyName}:`, error);
  }
}

/**
 * Deletes a status message for a removed server
 */
export async function deleteServerStatusMessage(serverId: number): Promise<void> {
  const channelId = process.env.SERVER_STATUS_CHANNEL_ID;
  
  if (!channelId || !cachedClient) {
    logger.warn("Cannot delete status message: channel not configured or client not initialized");
    return;
  }

  const channel = cachedClient.channels.cache.get(channelId) as TextChannel;
  
  if (!channel) {
    logger.error(`Server status channel ${channelId} not found`);
    return;
  }

  try {
    const statusMessage = await serverStatusMessageRepository.getMessageByServerId(serverId);
    
    if (!statusMessage) {
      logger.debug(`No status message found for server ID ${serverId}`);
      return;
    }

    try {
      const message = await channel.messages.fetch(statusMessage.messageId);
      await message.delete();
      logger.info(`Deleted Discord message for server ID ${serverId}`);
    } catch (error) {
      logger.warn(`Failed to delete Discord message ${statusMessage.messageId}, may already be deleted:`, error);
    }

    await serverStatusMessageRepository.deleteByServerId(serverId);
    logger.info(`Removed status message record for server ID ${serverId}`);
  } catch (error) {
    logger.error(`Failed to delete status message for server ID ${serverId}:`, error);
  }
}

export const task: Task = {
  name: "serverStatusChannel",
  interval: UPDATE_INTERVAL,
  initialize: initializeServerStatusChannel,
  execute: updateServerStatusChannel,
};
