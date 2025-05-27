import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
  GuildMember,
} from "discord.js";
import { Command } from "../../types/Command";
import { gameServerRepository } from "../../db/repositories/GameServerRepository";
import logger from "../../utils/logger";

const adminRoleId = process.env.ADMIN_ROLE_ID;

const commandBuilder = new SlashCommandBuilder()
  .setName("server-admin")
  .setDescription("Manage game servers")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("add")
      .setDescription("Add a new game server")
      .addStringOption((option) =>
        option.setName("host").setDescription("Server host").setRequired(true)
      )
      .addIntegerOption((option) =>
        option.setName("port").setDescription("Server port").setRequired(true)
      )
      .addStringOption((option) =>
        option.setName("name").setDescription("Server name").setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("friendly-name")
          .setDescription("Server friendly name")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("list").setDescription("List all game servers")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("remove")
      .setDescription("Remove a game server")
      .addIntegerOption((option) =>
        option.setName("id").setDescription("Server ID").setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("update")
      .setDescription("Update a game server")
      .addIntegerOption((option) =>
        option.setName("id").setDescription("Server ID").setRequired(true)
      )
      .addStringOption((option) =>
        option.setName("host").setDescription("Server host")
      )
      .addIntegerOption((option) =>
        option.setName("port").setDescription("Server port")
      )
      .addStringOption((option) =>
        option.setName("name").setDescription("Server name")
      )
      .addStringOption((option) =>
        option.setName("friendly-name").setDescription("Server friendly name")
      )
  ) as SlashCommandBuilder;

export const command: Command = {
  data: commandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      if (!adminRoleId) {
        throw new Error(
          "ADMIN_ROLE_ID is not configured in environment variables"
        );
      }

      const member = interaction.member as GuildMember;
      if (
        !member ||
        !("roles" in member) ||
        !member.roles.cache.has(adminRoleId)
      ) {
        await interaction.editReply({
          content: "You don't have permission to use this command.",
        });
        return;
      }

      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case "add": {
          const host = interaction.options.getString("host", true);
          const port = interaction.options.getInteger("port", true);
          const name = interaction.options.getString("name", true);
          const friendlyName = interaction.options.getString(
            "friendly-name",
            true
          );

          await gameServerRepository.create({
            host,
            port,
            name,
            friendlyName,
          });

          await interaction.editReply({
            content: "Server added successfully!",
          });
          break;
        }

        case "list": {
          const servers = await gameServerRepository.getAllServers();
          const serverList = servers
            .map(
              (server) =>
                `ID: ${server.id} | ${server.friendlyName} (${server.host}:${server.port})`
            )
            .join("\n");

          await interaction.editReply({
            content: servers.length
              ? `**Game Servers:**\n${serverList}`
              : "No servers configured.",
          });
          break;
        }

        case "remove": {
          const id = interaction.options.getInteger("id", true);
          await gameServerRepository.delete({ id });
          await interaction.editReply({
            content: "Server removed successfully!",
          });
          break;
        }

        case "update": {
          const id = interaction.options.getInteger("id", true);
          const host = interaction.options.getString("host");
          const port = interaction.options.getInteger("port");
          const name = interaction.options.getString("name");
          const friendlyName = interaction.options.getString("friendly-name");

          const updates: Record<string, any> = {};
          if (host) updates.host = host;
          if (port) updates.port = port;
          if (name) updates.name = name;
          if (friendlyName) updates.friendlyName = friendlyName;

          if (Object.keys(updates).length === 0) {
            await interaction.editReply({
              content: "No updates provided.",
            });
            return;
          }

          await gameServerRepository.update({ id }, updates);
          await interaction.editReply({
            content: "Server updated successfully!",
          });
          break;
        }
      }
    } catch (error) {
      logger.error("Error in server-admin command:", error);
      await interaction.editReply({
        content: `Error: ${(error as Error).message}`,
      });
    }
  },
};
