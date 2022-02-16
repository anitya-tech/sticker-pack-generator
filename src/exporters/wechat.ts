import fs from "fs/promises";
import path from "path";

import { exportConfig } from "../config";
import { Size } from "../utils";

import type { Exporter, StickerPackConfigBase } from "./types";

const preset = {
  quantities: [16, 24],
  border: 2,
  maxSize: 240,
  heroSize: 230,
  thumbnailSize: 120,
};

export interface WechatStickerPackConfig extends StickerPackConfigBase {
  type: "wechat";
  border?: number;
}

export interface ResolvedWechatStickerPackConfig
  extends WechatStickerPackConfig {
  name: string;
  description: string;

  border: number;

  destDir: string;
  dests: {
    stickers: string;
    thumbnail: string;
    banner: string;
    cover: string;
    icon: string;
  };
}

const resolveConfig = (
  config: WechatStickerPackConfig
): ResolvedWechatStickerPackConfig => {
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
      stickers: path.join(destDir, "表情主图"),
      thumbnail: path.join(destDir, "表情缩略图"),
      banner: path.join(destDir, "详情页横幅.png"),
      cover: path.join(destDir, "表情封面图.png"),
      icon: path.join(destDir, "聊天面板图标.png"),
    },
  };
};

export const wechatExplorter: Exporter<WechatStickerPackConfig> = {
  init: async (config, stickers) => {
    if (!preset.quantities.includes(stickers.length))
      throw `${config.type} stickers number must be ${preset.quantities.join(
        ", "
      )}, got ${stickers.length}`;
    const ec = resolveConfig(config);

    await fs.mkdir(ec.destDir, { recursive: true });
    await fs.mkdir(ec.dests.stickers, { recursive: true });
    await fs.mkdir(ec.dests.thumbnail, { recursive: true });

    await fs.writeFile(
      path.join(ec.destDir, "README.txt"),
      `微信表情包

https://sticker.weixin.qq.com/

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

    const index = `${sticker.index}`.padStart(2, "0");

    const maxSize = new Size(preset.maxSize);
    const heroSize = new Size(preset.heroSize);
    const thumbnailSize = new Size(preset.thumbnailSize);

    const stickerSharp = await workbench.transform({
      border: ec.border,
      maxSize,
      heroSize,
    });

    await Promise.all([
      stickerSharp
        .resize({ ...maxSize, background: "transparent" })
        .toFormat("gif")
        .toFile(path.join(ec.dests.stickers, `${index}.gif`)),

      stickerSharp
        .resize({ ...thumbnailSize, background: "transparent" })
        .toFormat("png")
        .toFile(path.join(ec.dests.thumbnail, `${index}.png`)),
    ]);
  },
};
