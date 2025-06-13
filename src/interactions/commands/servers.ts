import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { ServerQuery } from "../../utils/ServerQuery";
import { Command } from "../../types/Command";
import { createServerEmbed } from "../../utils/createServerEmbed";
import { gameServerRepository } from "../../db/repositories/GameServerRepository";
import logger from "../../utils/logger";

const commandBuilder = new SlashCommandBuilder()
  .setName("servers")
  .setDescription("Query a predefined Source engine game server")
  .addStringOption((option) =>
    option
      .setName("server")
      .setDescription("Select a server to query")
      .setRequired(true)
  ) as SlashCommandBuilder;

export const command: Command = {
  data: commandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const serverString = interaction.options.getString("server", true);
      const selectedServer =
        await gameServerRepository.getServerByName(serverString);

      if (!selectedServer) {
        await interaction.editReply({
          embeds: [
            {
              title: "Error",
              description: `Server ${serverString} not found.`,
              color: 0xff0000,
            },
          ],
        });
        return;
      }

      const query = new ServerQuery(selectedServer.host, selectedServer.port);
      const info = await query.getServerInfo();
      const embed = await createServerEmbed(
        info,
        selectedServer.host,
        selectedServer.port
      );

      await interaction.editReply(embed);
    } catch (error) {
      logger.error("Error in servers command:", error);
      await interaction.editReply({
        embeds: [
          {
            title: "Error",
            description: `Failed to query server: ${(error as Error).message}`,
            color: 0xff0000,
          },
        ],
      });
    }
  },
};
