import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import logger from "../../utils/logger";

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const commands = new Map<string, Command>();

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
