import { Client } from "discord.js";

export interface Task {
  name: string;
  interval: number;
  execute: (client: Client) => Promise<void>;
}
