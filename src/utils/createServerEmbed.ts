import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { ServerInfo } from "../types/ServerInfo";

export function createServerEmbed(
  info: ServerInfo,
  host: string,
  port: number
) {
  const embed = new EmbedBuilder()
    .setTitle(`Server Info: ${info.name}`)
    .setFields([
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
    ])
    .setColor(0xff0000)
    .setThumbnail("attachment://SZ_LOGO_256.png")
    .setTimestamp();

  const connectButton = new ButtonBuilder()
    .setLabel("Join")
    .setStyle(ButtonStyle.Success)
    .setCustomId(`connect_${host}_${port}`);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    connectButton
  );

  return {
    embeds: [embed],
    components: [row],
    files: [
      {
        attachment: "./src/assets/SZ_LOGO_256.png",
        name: "SZ_LOGO_256.png",
      },
    ],
  };
}
