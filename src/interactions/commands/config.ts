import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { Command } from "../../types/Command";
import { botConfigRepository } from "../../db/repositories/BotConfigRepository";
import logger from "../../utils/logger";

const commandBuilder = new SlashCommandBuilder()
  .setName("config")
  .setDescription("Manage bot configuration")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand((subcommand) =>
    subcommand
      .setName("set-base-url")
      .setDescription("Set the base URL for Steam server links")
      .addStringOption((option) =>
        option.setName("url").setDescription("The base URL").setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("set-thresholds")
      .setDescription("Set player count thresholds")
      .addStringOption((option) =>
        option
          .setName("thresholds")
          .setDescription("Comma-separated list of thresholds (e.g., '3,5,10')")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("view").setDescription("View current configuration")
  ) as SlashCommandBuilder;

export const command: Command = {
  data: commandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    try {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case "set-base-url": {
          const url = interaction.options.getString("url", true);
          await botConfigRepository.setBaseUrl(url);
          await interaction.editReply({
            content: "Base URL updated successfully!",
          });
          break;
        }

        case "set-thresholds": {
          const thresholdsStr = interaction.options.getString(
            "thresholds",
            true
          );
          const thresholds = thresholdsStr
            .split(",")
            .map((t) => parseInt(t.trim(), 10))
            .filter((t) => !isNaN(t));

          if (thresholds.length === 0) {
            await interaction.editReply({
              content:
                "Invalid thresholds format. Please use comma-separated numbers (e.g., '3,5,10')",
            });
            return;
          }

          await botConfigRepository.setPlayerThresholds(thresholds);
          await interaction.editReply({
            content: "Player thresholds updated successfully!",
          });
          break;
        }

        case "view": {
          const baseUrl = await botConfigRepository.getBaseUrl();
          const thresholds = await botConfigRepository.getPlayerThresholds();

          await interaction.editReply({
            content: [
              "**Current Configuration:**",
              `Base URL: ${baseUrl}`,
              `Player Thresholds: ${thresholds.join(", ")}`,
            ].join("\n"),
          });
          break;
        }
      }
    } catch (error) {
      logger.error("Error in config command:", error);
      await interaction.editReply({
        content: `Error: ${(error as Error).message}`,
      });
    }
  },
};
