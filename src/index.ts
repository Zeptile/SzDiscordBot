import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import { config } from "dotenv";
import commands from "./interactions/commands";
import { initializeTasks } from "./tasks";
import { handleButtonInteraction } from "./interactions/buttons";
import { handleCommandInteraction } from "./interactions/commands";
import { setupReactionRole } from "./reactions/reactionRole";
import { initializeDatabase } from "./db";
import logger from "./utils/logger";

config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessages,
  ],
});

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

client.once("ready", async () => {
  try {
    logger.info("Registering commands...");
    logger.info(
      `Found ${commands.size} commands to register: ${[...commands.keys()].join(", ")}`
    );

    const commandData = [...commands.values()].map((command) => {
      return command.data.toJSON();
    });

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
      body: commandData,
    });
    logger.info("Bot is ready and commands are registered!");

    await initializeDatabase();
    logger.info("Database initialized successfully");

    await setupReactionRole(client);
    logger.info("Reaction roles setup completed");

    initializeTasks(client);
    logger.info("Tasks initialization completed");
  } catch (error) {
    logger.error("Error during bot initialization:", error);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    await handleButtonInteraction(interaction);
    return;
  }

  if (interaction.isChatInputCommand()) {
    await handleCommandInteraction(interaction);
    return;
  }
});

client.login(process.env.DISCORD_TOKEN);
