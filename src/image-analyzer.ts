import { OutputInfo } from "sharp";

import { Rect } from "./utils";

interface SharpInfoBuffer {
  info: OutputInfo;
  data: Buffer;
}

export class ImageAnalyzer {
  info: OutputInfo;

  private _boundary?: Uint16Array;
  readonly data: Uint8ClampedArray;
  constructor({ info, data }: SharpInfoBuffer) {
    this.info = info;
    this.data = new Uint8ClampedArray(data);
  }
  readIndexedAlpha(index: number) {
    return this.data[index * 4 + 3];
  }
  readPositionedAlpha(x: number, y: number) {
    return this.data[(y * this.info.width + x) * 4 + 3];
  }
  isCompleteFilled() {
    const {
      info: { width, height },
    } = this;

    for (let x = 0; x < width; x++) {
      if (this.readPositionedAlpha(x, 0) === 0) return false;
      if (this.readPositionedAlpha(x, height - 1) === 0) return false;
    }

    for (let y = 0; y < width; y++) {
      if (this.readPositionedAlpha(0, y) === 0) return false;
      if (this.readPositionedAlpha(width - 1, y) === 0) return false;
    }

    return true;
  }
  getRectBoundary(): Rect {
    const { info } = this;

    let top = 0;
    let bottom = info.height - 1;
    let left = 0;
    let right = info.width - 1;

    dTop: for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        if (this.readPositionedAlpha(x, y) > 0) {
          top = y;
          break dTop;
        }
      }
    }

    dBottom: for (let y = bottom; y >= top; y--) {
      for (let x = left; x <= right; x++) {
        if (this.readPositionedAlpha(x, y) > 0) {
          bottom = y;
          break dBottom;
        }
      }
    }

    dLeft: for (let x = left; x <= right; x++) {
      for (let y = top; y <= bottom; y++) {
        if (this.readPositionedAlpha(x, y) > 0) {
          left = x;
          break dLeft;
        }
      }
    }

    dRight: for (let x = right; x >= left; x--) {
      for (let y = top; y <= bottom; y++) {
        if (this.readPositionedAlpha(x, y) > 0) {
          right = x;
          break dRight;
        }
      }
    }

    return new Rect({ top, bottom, left, right });
  }
  getBoundary() {
    if (this._boundary) return this._boundary;
    if (this.info.channels < 4) throw "rgba only";

    const {
      info: { width, height },
    } = this;
    const boundary = [];

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        if (this.readPositionedAlpha(x, y) < 50) continue;
        const neighbourhoods = [
          this.readPositionedAlpha(x - 1, y) ?? 0,
          this.readPositionedAlpha(x + 1, y) ?? 0,
          this.readPositionedAlpha(x, y - 1) ?? 0,
          this.readPositionedAlpha(x, y + 1) ?? 0,
        ];
        if (neighbourhoods.find((n) => n < 50) !== undefined) {
          boundary.push(x, y);
        }
      }
    }
    return (this._boundary = new Uint16Array(boundary));
  }
}
