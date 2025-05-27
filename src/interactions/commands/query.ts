import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { ServerQuery } from "../../utils/ServerQuery";
import { Command } from "../../types/Command";
import { parseSteamUrl } from "../../utils/parseSteamUrl";
import { createServerEmbed } from "../../utils/createServerEmbed";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("query")
    .setDescription("Query a Source engine game server")
    .addStringOption((option) =>
      option
        .setName("input")
        .setDescription("Server hostname:port or steam://connect URL")
        .setRequired(true)
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const input = interaction.options.getString("input", true);
      const serverInfo = parseSteamUrl(input);

      const query = new ServerQuery(serverInfo.host, serverInfo.port);
      const info = await query.getServerInfo();

      await interaction.editReply(
        createServerEmbed(info, serverInfo.host, serverInfo.port)
      );
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
