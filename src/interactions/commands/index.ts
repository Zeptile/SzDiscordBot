import { ChatInputCommandInteraction, Collection } from "discord.js";
import { Command } from "../../types/Command";
import { command as queryCommand } from "./query";
import { command as serversCommand } from "./servers";

const commands = new Collection<string, Command>();
commands.set(queryCommand.data.name, queryCommand);
commands.set(serversCommand.data.name, serversCommand);

export async function handleCommandInteraction(
  interaction: ChatInputCommandInteraction
) {
  const command = commands.get(interaction.commandName);

  if (!command) {
    console.error(`No handler found for command: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error handling command ${interaction.commandName}:`, error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "There was an error executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.editReply({
        content: "There was an error executing this command!",
      });
    }
  }
}

export default commands;
