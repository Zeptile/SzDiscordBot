import { Client } from "discord.js";

export interface Task {
  name: string;
  interval: number;
  initialize?: (client: Client) => Promise<void>;
  execute: (client: Client) => Promise<void>;
}
