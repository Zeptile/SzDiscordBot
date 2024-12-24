import type { InferSelectModel } from "drizzle-orm";
import { botConfig } from "../schema";
import { BaseRepository } from "./base/BaseRepository";

export class BotConfigRepository extends BaseRepository<
  InferSelectModel<typeof botConfig>,
  typeof botConfig
> {
  constructor() {
    super(botConfig, ["id", "key", "value", "createdAt", "updatedAt"]);
  }

  async getBaseUrl(): Promise<string> {
    const config = await this.findOne({ key: "baseUrl" });
    return config?.value ?? "https://snipezilla.com/steam";
  }

  async getPlayerThresholds(): Promise<number[]> {
    const config = await this.findOne({ key: "playerThresholds" });
    return config ? JSON.parse(config.value) : [3, 5, 10];
  }

  async setPlayerThresholds(thresholds: number[]): Promise<void> {
    await this.update(
      { key: "playerThresholds" },
      { value: JSON.stringify(thresholds) }
    );
  }

  async setBaseUrl(url: string): Promise<void> {
    await this.update({ key: "baseUrl" }, { value: url });
  }
}

export const botConfigRepository = new BotConfigRepository();
