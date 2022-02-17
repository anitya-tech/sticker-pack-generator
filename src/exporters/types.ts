import { ExportHelper, InitHelper } from "./utils";

export interface StickerPackOptionsBase {
  packId: string;
  name: string;
  platform: string;
  description: string;
  [key: string]: unknown;
}

export interface Exporter<T = unknown> {
  platform: string;
  init?(helper: InitHelper<T>): Promise<void>;
  export(helper: ExportHelper<T>): Promise<void>;
}
