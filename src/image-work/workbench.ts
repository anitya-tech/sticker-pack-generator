import { CanvasRenderingContext2D, createCanvas, loadImage } from "canvas";
import sharp, { Sharp } from "sharp";

import { ImageAnalyzer } from "./analyzer";
import { Position, Rect, Size, Sizeable } from "./utils";

export interface ImgTransformOptions {
  border?: number;
  beforeDrawBorder?: (c: CanvasRenderingContext2D) => void;
  maxSize: Sizeable;
  heroSize: Sizeable;
}

export class ImageWorkbench {
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
    const ia = await this.imageAnalyzer;

    const offset = Math.floor(size * 2);

    const canvas = createCanvas(
      ia.info.width + offset * 2,
      ia.info.height + offset * 2
    );
    const ctx = canvas.getContext("2d");

    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = size * 2;
    ctx.fillStyle = color;

    const lines = ia.getBoundaryLines();
    for (const line of lines) {
      ctx.beginPath();
      ctx.moveTo(line[0] + offset, line[1] + offset);
      for (let i = 2; i < line.length; i += 2) {
        const x = line[i];
        const y = line[i + 1];
        ctx.lineTo(x + offset, y + offset);
      }
      ctx.stroke();
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
  async transform(config: ImgTransformOptions) {
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
    ctx.save();

    if (config.border) {
      if (config.beforeDrawBorder) config.beforeDrawBorder(ctx);
      const border = await this.makeBorder({ size: config.border / ratio });
      ctx.drawImage(
        border.canvas,
        offset.x + sourceOffset.x - border.heroArea.left,
        offset.y + sourceOffset.y - border.heroArea.top
      );
      ctx.restore();
    }

    ctx.drawImage(
      await loadImage(this.buffer),
      offset.x + sourceOffset.x - heroArea.left,
      offset.y + sourceOffset.y - heroArea.top
    );

    return sharp(canvas.toBuffer());
  }
  async containTransform(opts: { size: Sizeable; padding?: number }) {
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
