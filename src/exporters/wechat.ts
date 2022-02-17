import type { Exporter } from "./types";

// https://sticker.weixin.qq.com/cgi-bin/mmemoticon-bin/readtemplate?t=guide/index.html#/makingSpecifications#specifications_stickers
const preset = {
  quantities: [16, 24],
  border: 2,
  maxSize: 240,
  heroSize: 230,
  thumbnailSize: 120,
  bannerSize: { width: 750, height: 400 },
  iconSize: 50,
  coverSize: 240,
};

export const wechatExplorter: Exporter<{ border?: number }> = {
  platform: "wechat",
  init: async (h) => {
    h.checkQuantities(preset.quantities);

    await h
      .icon()
      .then((i) => i.containTransform({ size: preset.iconSize }))
      .then((s) => h.save("", "聊天面板图标.png", s.toFormat("png")));

    await h
      .cover()
      .then((i) => i.containTransform({ size: preset.coverSize }))
      .then((s) => h.save("", "表情封面图.png", s.toFormat("png")));

    await h
      .banner()
      .then((i) =>
        h.save(
          "",
          "详情页横幅.png",
          i.origin
            .resize({ ...preset.bannerSize, fit: "cover" })
            .toFormat("png")
        )
      );
  },
  async export(h) {
    const index = `${h.sticker.index}`.padStart(2, "0");

    const sticker = await h.workbench.transform({
      border: h.packOpts.border ?? preset.border,
      maxSize: preset.maxSize,
      heroSize: preset.heroSize,
    });

    await h.save(
      "表情主图",
      `${index}.gif`,
      sticker
        .resize({
          width: preset.maxSize,
          height: preset.maxSize,
          background: "transparent",
        })
        .toFormat("gif")
    );

    await h.save(
      "表情缩略图",
      `${index}.png`,
      sticker
        .resize({
          width: preset.thumbnailSize,
          height: preset.thumbnailSize,
          background: "transparent",
        })
        .toFormat("png")
    );
  },
};
