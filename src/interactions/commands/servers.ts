import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { ServerQuery } from "../../utils/ServerQuery";
import { Command } from "../../types/Command";
import { createServerEmbed } from "../../utils/createServerEmbed";
import config from "../../config/servers.json";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("servers")
    .setDescription("Query a predefined Source engine game server")
    .addStringOption((option) =>
      option
        .setName("server")
        .setDescription("Select a server to query")
        .setRequired(true)
        .addChoices(
          ...config.servers.map((server) => ({
            name: server.name,
            value: `${server.host}:${server.port}`,
          }))
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const serverString = interaction.options.getString("server", true);
      const [host, portStr] = serverString.split(":");
      const port = parseInt(portStr, 10);

      const query = new ServerQuery(host, port);
      const info = await query.getServerInfo();

      await interaction.editReply(createServerEmbed(info, host, port));
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
