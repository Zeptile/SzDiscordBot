import { Client } from "discord.js";
import { Task } from "../types/Task";
import { task as updateServerStatus } from "./updateServerStatus";
import { task as playerCountNotifier } from "./playerCountNotifier";

const tasks: Task[] = [updateServerStatus, playerCountNotifier];

export async function initializeTasks(client: Client) {
  for (const task of tasks) {
    console.log(`Initializing task: ${task.name}`);

    try {
      await task.execute(client);
    } catch (error) {
      console.error(`Error executing task ${task.name}:`, error);
    }

    setInterval(async () => {
      try {
        await task.execute(client);
      } catch (error) {
        console.error(`Error executing task ${task.name}:`, error);
      }
    }, task.interval);
  }
}
