import { ChatInputCommandInteraction } from "discord.js";
import logger from "../../utils/logger";
import { Command } from "../../types/Command";
import { command as query } from "./query";
import { command as config } from "./config";
import { command as serverAdmin } from "./server-admin";
import { command as servers } from "./servers";

const commands = new Map<string, Command>();

// Register all commands
logger.info("Registering command: " + query.data.name);
commands.set(query.data.name, query);

logger.info("Registering command: " + config.data.name);
commands.set(config.data.name, config);

logger.info("Registering command: " + serverAdmin.data.name);
commands.set(serverAdmin.data.name, serverAdmin);

logger.info("Registering command: " + servers.data.name);
commands.set(servers.data.name, servers);

export async function handleCommandInteraction(
  interaction: ChatInputCommandInteraction
) {
  const command = commands.get(interaction.commandName);

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

export default commands;
