import fs from "fs/promises";
import path from "path";

import { exportConfig } from "../config";
import { Size } from "../utils";

import type { Exporter, StickerPackConfigBase } from "./types";

// https://creator.line.me/en/guideline/sticker/
const preset = {
  quantities: [8, 16, 24, 32, 40],
  maxSize: { width: 370, height: 320 },
  padding: 10,
  coverSize: 240,
  iconSize: { width: 96, height: 74 },
};

export interface LineStickerPackConfig extends StickerPackConfigBase {
  type: "line";
}

export interface ResolvedLineStickerPackConfig extends LineStickerPackConfig {
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
  config: LineStickerPackConfig
): ResolvedLineStickerPackConfig => {
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
      cover: path.join(destDir, "main.png"),
      icon: path.join(destDir, "chat-thumbnail-icon.png"),
    },
  };
};

export const lineExplorter: Exporter<LineStickerPackConfig> = {
  init: async (config, stickers, context) => {
    if (!preset.quantities.includes(stickers.length))
      throw `${config.type} stickers number must be ${preset.quantities.join(
        ", "
      )}, got ${stickers.length}`;

    const ec = resolveConfig(config);

    await fs.mkdir(ec.destDir, { recursive: true });
    await fs.mkdir(ec.dests.stickers, { recursive: true });

    (await context.icon.containTransform({ size: new Size(preset.iconSize) }))
      .toFormat("png")
      .toFile(ec.dests.icon);

    (await context.cover.containTransform({ size: new Size(preset.coverSize) }))
      .toFormat("png")
      .toFile(ec.dests.cover);

    await fs.writeFile(
      path.join(ec.destDir, "README.txt"),
      `Line Stickers

https://creator.line.me/

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
