import fs from "fs/promises";
import path from "path";

import sharp from "sharp";

import { exportConfig } from "../config";
import { Size } from "../utils";

import type { Exporter, StickerPackConfigBase } from "./types";

// https://member.bilibili.com/platform/upload/sticker
const preset = {
  maxSize: 750,
};

export interface BCutStickerPackConfig extends StickerPackConfigBase {
  type: "bcut";
  border?: number;
}

export interface ResolvedBCutStickerPackConfig extends BCutStickerPackConfig {
  name: string;
  description: string;

  border: number;

  destDir: string;
  dests: {
    stickers: string;
  };
}

const resolveConfig = (
  config: BCutStickerPackConfig
): ResolvedBCutStickerPackConfig => {
  if (!exportConfig.destDir) throw "outputDir undefined";
  const destDir = path.join(
    exportConfig.destDir,
    config.destDir || config.type
  );
  return {
    ...config,
    name: config.name || exportConfig.name,
    description: config.description || exportConfig.description,
    border: config.border || 0,
    destDir,
    dests: {
      stickers: path.join(destDir, "stickers"),
    },
  };
};

export const bcutExplorter: Exporter<BCutStickerPackConfig> = {
  init: async (config, stickers, context) => {
    const ec = resolveConfig(config);

    await fs.mkdir(ec.destDir, { recursive: true });
    await fs.mkdir(ec.dests.stickers, { recursive: true });

    await fs.writeFile(
      path.join(ec.destDir, "README.txt"),
      `B站贴纸

https://member.bilibili.com/platform/upload/sticker

名称：${ec.name}
描述：${ec.description}

调试信息：${JSON.stringify(ec)}

表情列表：

${stickers.map((i) => `${i.index}. ${i.name}`).join("\n")}
`
    );
  },
  async export(config, sticker, workbench) {
    const ec = resolveConfig(config);

    const maxSize = new Size(preset.maxSize);

    const stickerSharp = await workbench.transform({
      border: ec.border,
      maxSize,
      heroSize: maxSize,
    });

    await stickerSharp
      .resize({ ...maxSize, background: "transparent" })
      .toFormat("gif")
      .toFile(path.join(ec.dests.stickers, `${sticker.name}.png`));
  },
};
