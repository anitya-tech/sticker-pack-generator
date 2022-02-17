import type { Exporter } from "./types";

// https://creator.line.me/en/guideline/sticker/
const preset = {
  quantities: [8, 16, 24, 32, 40],
  maxSize: { width: 370, height: 320 },
  padding: 10,
  coverSize: 240,
  iconSize: { width: 96, height: 74 },
};

export const lineExplorter: Exporter = {
  platform: "line",
  init: async (h) => {
    h.checkQuantities(preset.quantities);
    await h
      .icon()
      .then((i) => i.containTransform({ size: preset.iconSize }))
      .then((s) => h.save("", "chat-thumbnail-icon.png", s.toFormat("png")));

    await h
      .cover()
      .then((i) => i.containTransform({ size: preset.coverSize }))
      .then((s) => h.save("", "main.png", s.toFormat("png")));
  },
  async export(h) {
    const sticker = await h.workbench.containTransform({
      size: preset.maxSize,
      padding: preset.padding,
    });

    await h.save("stickers", `${h.sticker.name}.png`, sticker.toFormat("png"));
  },
};
