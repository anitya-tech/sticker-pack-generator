import { ImageWorkbench } from "../image-work/workbench";

import type { Exporter } from "./types";

// https://core.telegram.org/stickers#static-stickers
// https://telegram.org/img/StickerExample.psd
const radian = (120 / 360) * 2 * Math.PI;
const preset = {
  maxSize: 500,
  padding: 15,
  iconSize: 100,
  border: 5,
  shadow: {
    shadowOffsetX: -5 * Math.cos(radian),
    shadowOffsetY: 5 * Math.sin(radian),
    shadowColor: "rgba(0,0,0,0.25)",
    shadowBlur: 10,
  },
};

export const telegramExplorter: Exporter = {
  platform: "telegram",
  init: async (h) => {
    await h
      .icon()
      .then((i) => i.containTransform({ size: preset.iconSize }))
      .then((s) => h.save("", "icon.png", s.toFormat("png")));
  },
  async export(h) {
    const bordered = await h.workbench.transform({
      border: preset.border,
      maxSize: preset.maxSize + preset.border * 2,
      heroSize: preset.maxSize,
      beforeDrawBorder: (ctx) => Object.assign(ctx, preset.shadow),
    });

    const borderedWB = new ImageWorkbench(
      await bordered.toFormat("png").toBuffer()
    );

    const sticker = await borderedWB.containTransform({
      size: preset.maxSize,
      padding: preset.padding,
    });

    await h.save("stickers", `${h.sticker.name}.png`, sticker.toFormat("png"));
  },
};
