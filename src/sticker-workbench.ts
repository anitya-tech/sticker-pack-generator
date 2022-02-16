import { createCanvas, loadImage } from "canvas";
import sharp, { Sharp } from "sharp";

import { ImageAnalyzer } from "./image-analyzer";
import { Position, Rect, Size } from "./utils";

export interface StickerItemConfig {
  border?: number;
  maxSize: Size;
  heroSize: Size;
}

export class StickerWorkbench {
  origin: Sharp;
  private _imageAnalyzer?: Promise<ImageAnalyzer>;
  constructor(public buffer: Buffer) {
    this.origin = sharp(buffer);
  }
  get imageAnalyzer() {
    return (this._imageAnalyzer =
      this._imageAnalyzer ||
      this.origin
        .raw()
        .toBuffer({ resolveWithObject: true })
        .then((o) => new ImageAnalyzer(o)));
  }
  async makeBorder(border: {
    size: number;
    color?: string;
    blurSize?: number;
  }) {
    const color = border.color || "white";
    const size = border.size;
    const blurSize = border.blurSize ?? size * 0.8;
    const ia = await this.imageAnalyzer;

    const offset = Math.floor(size + blurSize);

    const canvas = createCanvas(
      ia.info.width + offset * 2,
      ia.info.height + offset * 2
    );
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = blurSize;

    const boundary = ia.getBoundary();

    for (let i = 0; i < boundary.length; i += 2) {
      const x = boundary[i];
      const y = boundary[i + 1];

      ctx.beginPath();
      ctx.arc(x + offset, y + offset, size + 1, 0, 2 * Math.PI);
      ctx.fill();
    }

    const rectBoundary = ia.getRectBoundary();

    const originImageArea = new Rect(ia.info).move(new Position(offset));
    const heroArea = new Rect(rectBoundary).move(new Position(offset));

    return {
      canvas,
      originImageArea,
      heroArea,
    };
  }

  async transform(config: StickerItemConfig) {
    const ia = await this.imageAnalyzer;

    const heroArea = ia.getRectBoundary();

    const { ratio, sourceOffset } = heroArea.scaleTo(
      config.heroSize,
      "contain"
    );

    const canvasSize = new Size(config.maxSize).scale(1 / ratio);
    const heroSize = new Size(config.heroSize).scale(1 / ratio);
    const offset = {
      x: (canvasSize.width - heroSize.width) / 2,
      y: (canvasSize.height - heroSize.height) / 2,
    };

    const canvas = createCanvas(canvasSize.width, canvasSize.height);
    const ctx = canvas.getContext("2d");

    if (config.border) {
      const border = await this.makeBorder({ size: config.border / ratio });
      ctx.drawImage(
        border.canvas,
        offset.x + sourceOffset.x - border.heroArea.left,
        offset.y + sourceOffset.y - border.heroArea.top
      );
    }

    ctx.drawImage(
      await loadImage(this.buffer),
      offset.x + sourceOffset.x - heroArea.left,
      offset.y + sourceOffset.y - heroArea.top
    );

    return sharp(canvas.toBuffer());
  }
  async containTransform(opts: { size: Size; padding?: number }) {
    const padding = opts.padding ?? 0;
    const heroSize = new Size(opts.size);
    heroSize.width -= padding * 2;
    heroSize.height -= padding * 2;

    const ia = await this.imageAnalyzer;
    const boundary = new Size(ia.getRectBoundary());
    const { size: _targetSize } = boundary.scaleTo(heroSize, "contain");
    const maxSize = new Size(_targetSize).round();
    maxSize.width += padding * 2;
    maxSize.height += padding * 2;

    const sharp = await this.transform({
      border: 0,
      maxSize,
      heroSize,
    });

    return sharp.resize({ ...maxSize, background: "transparent" });
  }
}
