import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import { config } from "dotenv";
import commands from "./commands";
import { initializeTasks } from "./tasks";

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
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error executing this command!",
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
