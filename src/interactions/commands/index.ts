import { ChatInputCommandInteraction } from "discord.js";
import logger from "../../utils/logger";
import { Command } from "../../types/Command";
import { command as query } from "./query";
import { command as config } from "./config";
import { command as serverAdmin } from "./server-admin";
import { command as servers } from "./servers";

const commands = [query, config, serverAdmin, servers];
const commandsCache = new Map<string, Command>();

for (const command of commands) {
  logger.info("Registering command: " + command.data.name);
  commandsCache.set(command.data.name, command);
}

export async function handleCommandInteraction(
  interaction: ChatInputCommandInteraction
) {
  const command = commandsCache.get(interaction.commandName);

  if (!command) {
    logger.warn(`No handler found for command: ${interaction.commandName}`);
    await interaction.reply({
      content: "This command is not supported.",
      ephemeral: true,
    });
    return;
  }

  try {
    await command.execute(interaction);
    logger.debug(`Successfully executed command: ${interaction.commandName}`);
  } catch (error) {
    logger.error(`Error handling command ${interaction.commandName}:`, error);
    await interaction.reply({
      content: "An error occurred while executing this command.",
      ephemeral: true,
    });
  }
}

export default commandsCache;
