interface PositionLike {
  x: number;
  y: number;
}
interface SizeLike {
  width: number;
  height: number;
}
interface RectLike {
  top: number;
  bottom: number;
  left: number;
  right: number;
}
export type Sizeable = SizeLike | RectLike | number;
export type ScaleMode = "contain" | "cover";

const scale = (source: Sizeable, target: Sizeable, mode: ScaleMode) => {
  const { width: sw, height: sh } = new Size(source);
  const { width: tw, height: th } = new Size(target);

  let ratio = 1;
  if (mode === "contain") {
    ratio = Math.min(tw / sw, th / sh);
  } else if (mode === "cover") {
    ratio = Math.max(tw / sw, th / sh);
  }

  const size = new Size(source).scale(ratio);

  const sourceOffset = {
    x: Math.ceil((tw / ratio - sw) / 2),
    y: Math.ceil((th / ratio - sh) / 2),
  };

  const targetOffset = {
    x: Math.ceil((tw - sw * ratio) / 2),
    y: Math.ceil((th - sh * ratio) / 2),
  };

  return { size, ratio, sourceOffset, targetOffset };
};

export class Position {
  x: number;
  y: number;
  constructor(s: PositionLike | number) {
    if (typeof s === "number") {
      this.x = s;
      this.y = s;
      return;
    }
    this.x = s.x;
    this.y = s.y;
  }
}

export class Size {
  width: number;
  height: number;
  constructor(s: Sizeable) {
    if (typeof s === "number") {
      this.width = s;
      this.height = s;
      return;
    }
    if ("top" in s) {
      this.width = s.right - s.left + 1;
      this.height = s.bottom - s.top + 1;
      return;
    }
    this.width = s.width;
    this.height = s.height;
  }
  scale(ratio: number) {
    this.width *= ratio;
    this.height *= ratio;
    return this;
  }
  round() {
    this.width = Math.round(this.width);
    this.height = Math.round(this.height);
    return this;
  }
  scaleTo(target: Sizeable, mode: ScaleMode) {
    return scale(this, target, mode);
  }
}

export class Rect {
  top: number;
  bottom: number;
  left: number;
  right: number;
  constructor(o: Sizeable) {
    this.top = 0;
    this.left = 0;

    if (typeof o === "number") {
      this.right = o;
      this.bottom = o;
      return;
    }

    if ("width" in o) {
      this.right = o.width - 1;
      this.bottom = o.height - 1;
      return;
    }

    this.top = o.top;
    this.bottom = o.bottom;
    this.left = o.left;
    this.right = o.right;
  }
  move(p: Position) {
    this.left += p.x;
    this.right += p.x;
    this.top += p.y;
    this.bottom += p.y;
    return this;
  }
  scaleTo(target: Sizeable, mode: ScaleMode) {
    return scale(this, target, mode);
  }
}
