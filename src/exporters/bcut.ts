import type { Exporter } from "./types";

// https://member.bilibili.com/platform/upload/sticker
const preset = {
  maxSize: 750,
  border: 0,
};

export const bcutExplorter: Exporter<{ border?: number }> = {
  platform: "bcut",
  async export(h) {
    const sticker = await h.workbench.transform({
      border: h.packOpts.border ?? preset.border,
      maxSize: preset.maxSize,
      heroSize: preset.maxSize,
    });

    const result = sticker
      .resize({
        width: preset.maxSize,
        height: preset.maxSize,
        background: "transparent",
      })
      .toFormat("png");

    h.save("stickers", `${h.sticker.name}.png`, result);
  },
};
