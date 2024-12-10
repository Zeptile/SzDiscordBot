import { ButtonInteraction } from "discord.js";

type ButtonHandler = (interaction: ButtonInteraction) => Promise<void>;

const buttonHandlers = new Map<string, ButtonHandler>();

buttonHandlers.set("connect", async (interaction: ButtonInteraction) => {
  const [_, host, port] = interaction.customId.split("_");
  await interaction.reply({
    content: `Paste this into your browser: \n \`steam://connect/${host}:${port}\` *(Discord doesn't support opening Steam links)*`,
    ephemeral: true,
  });
});

export async function handleButtonInteraction(interaction: ButtonInteraction) {
  const [handlerId] = interaction.customId.split("_");
  const handler = buttonHandlers.get(handlerId);

  if (!handler) {
    console.error(`No handler found for button: ${handlerId}`);
    return;
  }

  try {
    await handler(interaction);
  } catch (error) {
    console.error(`Error handling button ${handlerId}:`, error);
    await interaction.reply({
      content: "There was an error processing this button!",
      ephemeral: true,
    });
  }
}
