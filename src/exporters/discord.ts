import type { Exporter } from "./types";

// https://support.discord.com/hc/en-us/articles/360036479811-Custom-Emojis
const preset = {
  maxSize: 250,
  padding: 8,
};

export const discordExplorter: Exporter = {
  platform: "discord",
  async export(h) {
    const sticker = await h.workbench.containTransform({
      size: preset.maxSize,
      padding: preset.padding,
    });

    await h.save("stickers", `${h.sticker.name}.png`, sticker.toFormat("png"));
  },
};
