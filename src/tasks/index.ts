import { Client } from "discord.js";
import { Task } from "../types/Task";
import { task as updateServerStatus } from "./updateServerStatus";
import { task as playerCountNotifier } from "./playerCountNotifier";
import logger from "../utils/logger";

const tasks: Task[] = [updateServerStatus, playerCountNotifier];

export async function initializeTasks(client: Client) {
  for (const task of tasks) {
    logger.info(`Initializing task: ${task.name}`);

    try {
      if (task.initialize) {
        logger.info(`Running initialization for task: ${task.name}`);
        await task.initialize(client);
      }

      await task.execute(client);
    } catch (error) {
      logger.error(`Error executing task ${task.name}:`, error);
    }

    setInterval(async () => {
      try {
        await task.execute(client);
      } catch (error) {
        logger.error(`Error executing task ${task.name}:`, error);
      }
    }, task.interval);
  }
}
