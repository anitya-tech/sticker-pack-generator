import fs from "fs/promises";
import path from "path";

import { exportConfig } from "../config";
import { Size } from "../utils";

import type { Exporter, StickerPackConfigBase } from "./types";

// https://support.discord.com/hc/en-us/articles/360036479811-Custom-Emojis
const preset = {
  maxSize: 250,
  padding: 8,
};

export interface DiscordStickerPackConfig extends StickerPackConfigBase {
  type: "discord";
}

export interface ResolvedDiscordStickerPackConfig
  extends DiscordStickerPackConfig {
  name: string;
  description: string;

  destDir: string;
  dests: {
    stickers: string;
  };
}

const resolveConfig = (
  config: DiscordStickerPackConfig
): ResolvedDiscordStickerPackConfig => {
  if (!exportConfig.destDir) throw "outputDir undefined";
  const destDir = path.join(
    exportConfig.destDir,
    config.destDir || config.type
  );
  return {
    ...config,
    name: config.name || exportConfig.name,
    description: config.description || exportConfig.description,
    destDir,
    dests: {
      stickers: path.join(destDir, "stickers"),
    },
  };
};

export const discordExplorter: Exporter<DiscordStickerPackConfig> = {
  init: async (config, stickers) => {
    const ec = resolveConfig(config);

    await fs.mkdir(ec.destDir, { recursive: true });
    await fs.mkdir(ec.dests.stickers, { recursive: true });

    await fs.writeFile(
      path.join(ec.destDir, "README.txt"),
      `Discord Stickers

https://support.discord.com/hc/en-us/articles/360036479811-Custom-Emojis

Name：${ec.name}
Desctiption：${ec.description}

DebugInfo：${JSON.stringify(ec)}

StickerList：

${stickers.map((i) => `${i.index}. ${i.name}`).join("\n")}
`
    );
  },
  async export(config, sticker, workbench) {
    const ec = resolveConfig(config);
    const index = `${sticker.index}`.padStart(2, "0");

    const stickerSharp = await workbench.containTransform({
      size: new Size(preset.maxSize),
      padding: preset.padding,
    });

    await stickerSharp
      .toFormat("png")
      .toFile(path.join(ec.dests.stickers, `${index}.png`));
  },
};
