import { Task } from "../types/Task";
import logger from "../utils/logger";
import { gameServerRepository } from "../db/repositories/GameServerRepository";
import { botConfigRepository } from "../db/repositories/BotConfigRepository";
import { deleteServerStatusMessage } from "./serverStatusChannel";

/**
 * Keeps the bot's server list in sync with a servers.json hosted on a web server.
 *
 * .env:
 *   SERVERS_JSON_URL=https://snipezilla.com/discord/servers.json
 *   SERVERS_JSON_INTERVAL=120          (optional, seconds, default 120)
 *
 * When SERVERS_JSON_URL is set, the file is the source of truth:
 *   - servers in the file but not in the bot are added
 *   - name / friendlyName / thumbnailUrl changes are applied
 *   - servers no longer in the file are removed
 *   - baseUrl and playerThresholds are applied if present
 * If the file can't be downloaded or is invalid, nothing is changed.
 */

interface RemoteServer {
  host: string;
  port: number;
  name: string;
  friendlyName: string;
  thumbnailUrl?: string | null;
}

interface RemoteConfig {
  baseUrl?: string;
  servers: RemoteServer[];
  playerThresholds?: number[];
}

let lastFileText = "";

function validate(data: any): RemoteConfig {
  if (!data || !Array.isArray(data.servers)) {
    throw new Error('missing "servers" list');
  }
  const seen = new Set<string>();
  for (const [i, s] of data.servers.entries()) {
    if (typeof s.host !== "string" || !s.host.trim())
      throw new Error(`servers[${i}]: "host" is missing`);
    if (!Number.isInteger(s.port) || s.port < 1 || s.port > 65535)
      throw new Error(`servers[${i}]: "port" must be a number like 27015`);
    if (typeof s.name !== "string" || typeof s.friendlyName !== "string")
      throw new Error(`servers[${i}]: "name" and "friendlyName" are required`);
    const key = `${s.host}:${s.port}`;
    if (seen.has(key)) throw new Error(`servers[${i}]: ${key} is listed twice`);
    seen.add(key);
  }
  if (
    data.playerThresholds !== undefined &&
    (!Array.isArray(data.playerThresholds) ||
      !data.playerThresholds.every((n: any) => Number.isInteger(n) && n > 0))
  ) {
    throw new Error('"playerThresholds" must be a list of numbers like [3, 5, 10]');
  }
  return data as RemoteConfig;
}

async function sync() {
  const url = process.env.SERVERS_JSON_URL;
  if (!url) return;

  let text: string;
  try {
    const res = await fetch(url, {
      headers: { "Cache-Control": "no-cache" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    text = await res.text();
  } catch (error) {
    logger.warn(`servers.json: could not download ${url}, keeping current list:`, error);
    return;
  }

  if (text === lastFileText) return; // unchanged since last check

  let config: RemoteConfig;
  try {
    config = validate(JSON.parse(text.replace(/^﻿/, ""))); // tolerate BOM from Notepad
  } catch (error) {
    logger.error(`servers.json is invalid, keeping current list: ${(error as Error).message}`);
    return;
  }

  const existing = await gameServerRepository.getAllServers();
  const byKey = new Map(existing.map((s) => [`${s.host}:${s.port}`, s]));
  const wanted = new Set<string>();

  for (const s of config.servers) {
    const key = `${s.host}:${s.port}`;
    wanted.add(key);
    const current = byKey.get(key);

    if (!current) {
      await gameServerRepository.create({
        host: s.host,
        port: s.port,
        name: s.name,
        friendlyName: s.friendlyName,
        thumbnailUrl: s.thumbnailUrl ?? null,
      });
      logger.info(`servers.json: added ${s.friendlyName} (${key})`);
      continue;
    }

    const changes: Record<string, any> = {};
    if (current.name !== s.name) changes.name = s.name;
    if (current.friendlyName !== s.friendlyName) changes.friendlyName = s.friendlyName;
    // Only touch the thumbnail when the file sets it, so /server-admin set-thumbnail still works
    if (s.thumbnailUrl !== undefined && current.thumbnailUrl !== s.thumbnailUrl)
      changes.thumbnailUrl = s.thumbnailUrl;

    if (Object.keys(changes).length) {
      await gameServerRepository.update({ id: current.id }, changes);
      logger.info(`servers.json: updated ${s.friendlyName} (${key})`);
    }
  }

  for (const [key, server] of byKey) {
    if (!wanted.has(key)) {
      await deleteServerStatusMessage(server.id); // same as /server-admin remove
      await gameServerRepository.delete({ id: server.id });
      logger.info(`servers.json: removed ${server.friendlyName} (${key})`);
    }
  }

  if (config.baseUrl && config.baseUrl !== (await botConfigRepository.getBaseUrl())) {
    await botConfigRepository.setBaseUrl(config.baseUrl);
    logger.info(`servers.json: baseUrl set to ${config.baseUrl}`);
  }

  if (config.playerThresholds) {
    const current = await botConfigRepository.getPlayerThresholds();
    if (JSON.stringify(current) !== JSON.stringify(config.playerThresholds)) {
      await botConfigRepository.setPlayerThresholds(config.playerThresholds);
      logger.info(`servers.json: thresholds set to ${config.playerThresholds.join(", ")}`);
    }
  }

  lastFileText = text;
}

export const task: Task = {
  name: "syncServersFromUrl",
  interval: (Number(process.env.SERVERS_JSON_INTERVAL) || 120) * 1000,
  execute: sync,
};
