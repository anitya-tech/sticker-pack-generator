import type { Exporter } from "./types";

// https://faq.whatsapp.com/general/how-to-create-stickers-for-whatsapp/?lang=en
const preset = {
  quantities: [16, 24],
  border: 8,
  maxSize: 512,
  heroSize: 512 - 16 * 2,
  iconSize: 96,
};

export const whatsappExplorter: Exporter<{ border?: number }> = {
  platform: "whatsapp",
  init: async (h) => {
    h.checkQuantities(preset.quantities);

    await h
      .icon()
      .then((i) => i.containTransform({ size: preset.iconSize }))
      .then((s) => h.save("", "icon.png", s.toFormat("png")));
  },
  async export(h) {
    const sticker = await h.workbench.transform({
      border: h.packOpts.border ?? preset.border,
      maxSize: preset.maxSize,
      heroSize: preset.heroSize,
    });

    await h.save(
      "stickers",
      `${h.sticker.name}.png`,
      sticker
        .resize({
          width: preset.maxSize,
          height: preset.maxSize,
          background: "transparent",
        })
        .toFormat("png")
    );
  },
};
