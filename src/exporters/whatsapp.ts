import fs from "fs/promises";
import path from "path";

import { exportConfig } from "../config";
import { Size } from "../utils";

import type { Exporter, StickerPackConfigBase } from "./types";

// https://faq.whatsapp.com/general/how-to-create-stickers-for-whatsapp/?lang=en
const preset = {
  quantities: [16, 24],
  border: 8,
  maxSize: 512,
  heroSize: 512 - 16 * 2,
  iconSize: 96,
};

export interface WhatsappStickerPackConfig extends StickerPackConfigBase {
  type: "whatsapp";
  border?: number;
}

export interface ResolvedWhatsappStickerPackConfig
  extends WhatsappStickerPackConfig {
  name: string;
  description: string;

  border: number;

  destDir: string;
  dests: {
    stickers: string;
    icon: string;
  };
}

const resolveConfig = (
  config: WhatsappStickerPackConfig
): ResolvedWhatsappStickerPackConfig => {
  if (!exportConfig.destDir) throw "outputDir undefined";
  const destDir = path.join(
    exportConfig.destDir,
    config.destDir || config.type
  );
  return {
    ...config,
    name: config.name || exportConfig.name,
    description: config.description || exportConfig.description,
    border: config.border || preset.border,
    destDir,
    dests: {
      stickers: path.join(destDir, "stickers"),
      icon: path.join(destDir, "icon.png"),
    },
  };
};

export const whatsappExplorter: Exporter<WhatsappStickerPackConfig> = {
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

    await fs.writeFile(
      path.join(ec.destDir, "README.txt"),
      `Whatsapp Stickers

https://faq.whatsapp.com/general/how-to-create-stickers-for-whatsapp

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

    const maxSize = new Size(preset.maxSize);
    const heroSize = new Size(preset.heroSize);

    const stickerSharp = await workbench.transform({
      border: ec.border,
      maxSize,
      heroSize,
    });
    await stickerSharp
      .resize({ ...maxSize, background: "transparent" })
      .toFormat("png")
      .toFile(path.join(ec.dests.stickers, `${index}.png`));
  },
};
