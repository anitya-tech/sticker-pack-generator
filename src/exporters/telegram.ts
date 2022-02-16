import fs from "fs/promises";
import path from "path";

import { exportConfig } from "../config";
import { Size } from "../utils";

import type { Exporter, StickerPackConfigBase } from "./types";

const preset = {
  maxSize: 500,
  padding: 15,
};

export interface TelegramStickerPackConfig extends StickerPackConfigBase {
  type: "telegram";
}

export interface ResolvedTelegramStickerPackConfig
  extends TelegramStickerPackConfig {
  name: string;
  description: string;

  destDir: string;
  dests: {
    stickers: string;
    cover: string;
    icon: string;
  };
}

const resolveConfig = (
  config: TelegramStickerPackConfig
): ResolvedTelegramStickerPackConfig => {
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
      stickers: path.join(destDir, "Stickers"),
      cover: path.join(destDir, "Main.png"),
      icon: path.join(destDir, "ChatThumbnailIcon.png"),
    },
  };
};

export const telegramExplorter: Exporter<TelegramStickerPackConfig> = {
  init: async (config, stickers) => {
    const ec = resolveConfig(config);

    await fs.mkdir(ec.destDir, { recursive: true });
    await fs.mkdir(ec.dests.stickers, { recursive: true });

    await fs.writeFile(
      path.join(ec.destDir, "README.txt"),
      `Telegram Stickers

https://telegram.me/stickers

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

    const stickerSharp = await workbench.maxSizeTransform({
      maxSize: new Size(preset.maxSize),
      padding: preset.padding,
    });

    await stickerSharp
      .toFormat("png")
      .toFile(path.join(ec.dests.stickers, `${index}.png`));
  },
};
