import type { StickerPackConfigBase } from "./exporters/types";

export interface ExportConfig {
  destDir?: string;
  name: string;
  description: string;
  animated: boolean;
  exports: (string | StickerPackConfigBase)[];
}

export interface OriginStickerMeta {
  index: number;
  file: string;
  name: string;
  ext: string;
}
