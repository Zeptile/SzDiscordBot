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
      // Get the latest server list
      const servers = await gameServerRepository.getAllServers();

      if (servers.length === 0) {
        await interaction.editReply({
          embeds: [
            {
              title: "Error",
              description:
                "No servers are configured. Please ask an administrator to add some servers.",
              color: 0xff0000,
            },
          ],
        });
        return;
      }

      // Get the selected server
      const serverString = interaction.options.getString("server", true);
      const selectedServer = servers.find((s) => s.name === serverString);

      if (!selectedServer) {
        const choices = servers.map((s) => `${s.name}: (${s.host}:${s.port})`);
        await interaction.editReply({
          embeds: [
            {
              title: "Available Servers",
              description: choices.join("\n"),
              color: 0x00ff00,
            },
          ],
        });
        return;
      }

      const query = new ServerQuery(selectedServer.host, selectedServer.port);
      const info = await query.getServerInfo();

      await interaction.editReply(
        createServerEmbed(info, selectedServer.host, selectedServer.port)
      );
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
