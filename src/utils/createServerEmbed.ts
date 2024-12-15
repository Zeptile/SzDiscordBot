import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { ServerInfo } from "../types/ServerInfo";
import path from "path";

export function createServerEmbed(
  info: ServerInfo,
  host: string,
  port: number
) {
  // Determine the correct asset path based on environment
  const assetPath =
    process.env.NODE_ENV === "production"
      ? path.join(process.cwd(), "dist", "assets", "SZ_LOGO_256.png")
      : path.join(process.cwd(), "src", "assets", "SZ_LOGO_256.png");

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
      { name: "IP", value: `${host}:${port}`, inline: true },
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
        attachment: assetPath,
        name: "SZ_LOGO_256.png",
      },
    ],
  };
}
