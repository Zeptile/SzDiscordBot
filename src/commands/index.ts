import { Collection } from "discord.js";
import { Command } from "../types/Command";
import { command as queryCommand } from "./query";

const commands = new Collection<string, Command>();
commands.set(queryCommand.data.name, queryCommand);

export default commands;
