import { MetaImageContext } from "../meta-image-context";
import { StickerWorkbench } from "../sticker-workbench";
import { OriginStickerMeta } from "../types";

export interface StickerPackConfigBase {
  type: string;
  destDir?: string;
  name?: string;
  description?: string;
  forceOverride?: boolean;
}

export interface Exporter<T> {
  init(
    config: T,
    stickers: OriginStickerMeta[],
    context: MetaImageContext
  ): Promise<void>;
  export(
    config: T,
    sticker: OriginStickerMeta,
    workbench: StickerWorkbench
  ): Promise<void>;
}
