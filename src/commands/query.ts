import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { ServerQuery } from "../utils/ServerQuery";
import { Command } from "../types/Command";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("query")
    .setDescription("Query a Source engine game server")
    .addStringOption((option) =>
      option
        .setName("host")
        .setDescription("Server hostname or IP")
        .setRequired(true)
    )
    .addNumberOption((option) =>
      option.setName("port").setDescription("Server port").setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const host = interaction.options.getString("host", true);
      const port = interaction.options.getNumber("port", true);

      const query = new ServerQuery(host, port);
      const info = await query.getServerInfo();

      await interaction.editReply({
        embeds: [
          {
            title: `Server Info: ${info.name}`,
            fields: [
              { name: "Map", value: info.map, inline: true },
              { name: "Game", value: info.game, inline: true },
              {
                name: "Players",
                value: `${info.players}/${info.maxPlayers} (${info.bots} bots)`,
                inline: true,
              },
              { name: "Version", value: info.version, inline: true },
              {
                name: "VAC",
                value: info.vac ? "Enabled" : "Disabled",
                inline: true,
              },
              { name: "Type", value: info.serverType, inline: true },
            ],
            color: 0x00ff00,
          },
        ],
      });
    } catch (error) {
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
