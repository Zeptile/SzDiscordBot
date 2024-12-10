import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import { config } from "dotenv";
import commands from "./interactions/commands";
import { initializeTasks } from "./tasks";
import { handleButtonInteraction } from "./interactions/buttons";
import { handleCommandInteraction } from "./interactions/commands";

config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

client.once("ready", async () => {
  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
      body: [...commands.values()].map((command) => command.data.toJSON()),
    });
    console.log("Bot is ready and commands are registered!");

    // Initialize tasks
    initializeTasks(client);
  } catch (error) {
    console.error(error);
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
