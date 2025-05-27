import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { ServerInfo } from "../types/ServerInfo";
import { getAssetPath } from "./getAssetPath";
import serversConfig from "../config/servers.json";

export function createServerEmbed(
  info: ServerInfo,
  host: string,
  port: number
) {
  const assetPath = getAssetPath("SZ_LOGO_256.png");

  const server = serversConfig.servers.find(
    (s) => s.host === host && s.port === port
  );

  const actualPlayerCount = info.players - info.bots;

  const ipValue = server
    ? `Join: [${host}:${port}](${serversConfig.baseUrl}?${host}:${port})`
    : `${host}:${port}`;

  const embed = new EmbedBuilder()
    .setTitle(`Server Info: ${server?.friendlyName ?? info.name}`)
    .setFields([
      { name: "Map", value: info.map, inline: true },
      { name: "Game", value: info.game, inline: true },
      {
        name: "Players",
        value: `${actualPlayerCount}/${info.maxPlayers} (${info.bots} bots)`,
        inline: true,
      },
      { name: "Version", value: info.version, inline: true },
      {
        name: "VAC",
        value: info.vac ? "Enabled" : "Disabled",
        inline: true,
      },
      {
        name: "IP",
        value: ipValue,
        inline: true,
      },
    ])
    .setColor(0xff0000)
    .setThumbnail("attachment://SZ_LOGO_256.png")
    .setTimestamp();

  return {
    embeds: [embed],
    files: [
      {
        attachment: assetPath,
        name: "SZ_LOGO_256.png",
      },
    ],
  };
}
