import { StickerPackOptionsBase } from "./exporters/types";

export interface OriginStickerInfo {
  resId: string;
  index: number;
  name: string;
  extension: "png";
}

export interface ProfileImageIds {
  coverId: string;
  bannerId: string;
  iconId: string;
}

export interface StickerSetInfo {
  name: string;
  description: string;
}

export interface ResourceProvider {
  info(): Promise<StickerSetInfo>;
  listStickers(): Promise<OriginStickerInfo[]>;
  getProfileImages(): Promise<ProfileImageIds>;
  loadResource(redId: string): Promise<Buffer>;
  saveResource(
    packId: string,
    category: string | undefined,
    name: string,
    data: Buffer
  ): Promise<string>;
  getExportSet(): Promise<StickerPackOptionsBase[]>;
}
