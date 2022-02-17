import { OutputInfo } from "sharp";

import { Rect } from "./utils";

interface SharpInfoBuffer {
  info: OutputInfo;
  data: Buffer;
}

export class ImageAnalyzer {
  info: OutputInfo;

  private _boundary?: Uint16Array;
  private _boundaryLines?: Uint16Array[];
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
        if (
          this.readPositionedAlpha(x, y) >= 50 &&
          ((this.readPositionedAlpha(x - 1, y) ?? 0) < 50 ||
            (this.readPositionedAlpha(x + 1, y) ?? 0) < 50 ||
            (this.readPositionedAlpha(x, y - 1) ?? 0) < 50 ||
            (this.readPositionedAlpha(x, y + 1) ?? 0) < 50)
        )
          boundary.push(x, y);
      }
    }
    return (this._boundary = new Uint16Array(boundary));
  }
  getBoundaryLines() {
    if (this._boundaryLines) return this._boundaryLines;
    if (this.info.channels < 4) throw "rgba only";

    const {
      info: { width, height },
    } = this;

    enum Status {
      Good = 1,
      Walked = 2,
      Marked = 3,
    }
    type Pos = [x: number, y: number];
    const matrix = new Uint8Array(width * height);
    const matrixGet = (x: number, y: number): Status => matrix[y * width + x];
    const matrixSet = (x: number, y: number, v: Status) =>
      (matrix[y * width + x] = v);
    const matrixI2Pos = (i: number): Pos => [i % width, Math.ceil(i / width)];

    const isGoodPixel = (x: number, y: number) =>
      this.readPositionedAlpha(x, y) >= 50 &&
      ((this.readPositionedAlpha(x - 1, y) ?? 0) < 50 ||
        (this.readPositionedAlpha(x + 1, y) ?? 0) < 50 ||
        (this.readPositionedAlpha(x, y - 1) ?? 0) < 50 ||
        (this.readPositionedAlpha(x, y + 1) ?? 0) < 50);

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        isGoodPixel(x, y) && matrixSet(x, y, Status.Good);
      }
    }

    const pixelSearch = (x: number, y: number): Pos[] => {
      return <Pos[]>[
        [x - 1, y - 1],
        [x - 1, y],
        [x - 1, y + 1],
        [x, y - 1],
        [x, y + 1],
        [x + 1, y - 1],
        [x + 1, y],
        [x + 1, y + 1],
      ].filter(([x, y]) => {
        const status = matrixGet(x, y);
        return status === Status.Good || status === Status.Marked;
      });
    };

    const startPoints: Pos[] = [];
    const lines: number[][] = [];

    const resolveLine = () => {
      const startPoint = startPoints.pop();
      if (!startPoint) return;

      if (matrixGet(...startPoint) === Status.Walked) {
        resolveLine();
        return;
      }

      const line: number[] = [];

      let cx: number = startPoint[0];
      let cy: number = startPoint[1];
      // eslint-disable-next-line no-constant-condition
      while (true) {
        line.push(cx, cy);
        matrixSet(cx, cy, Status.Walked);

        const pixels = pixelSearch(cx, cy);
        if (!pixels.length) break;

        const [next, ...others] = pixels;

        cx = next[0];
        cy = next[1];

        others.forEach((pos) => {
          startPoints.push(pos);
          matrixSet(...pos, Status.Marked);
        });
      }
      lines.push(line);

      resolveLine();
    };

    for (let i = 0; i < matrix.length; i++) {
      if (matrix[i] != Status.Good) continue;

      const pos = matrixI2Pos(i);
      startPoints.push(pos);

      resolveLine();
    }

    return lines;
  }
}
