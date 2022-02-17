import { Sharp } from "sharp";

import { ImageWorkbench } from "../image-work/workbench";
import { OriginStickerInfo, ResourceProvider } from "../types";

import { StickerPackOptionsBase } from "./types";

export abstract class BaseWork<T> {
  abstract provider: ResourceProvider;
  abstract packOpts: T & StickerPackOptionsBase;
  async loadImageWorkbench(resId: string) {
    return new ImageWorkbench(await this.provider.loadResource(resId));
  }
  async save(category: string, name: string, data: Buffer | Sharp) {
    data = data instanceof Buffer ? data : await data.toBuffer();
    await this.provider.saveResource(
      this.packOpts.packId,
      category,
      name,
      data
    );
  }
}

export class InitHelper<T> extends BaseWork<T> {
  constructor(
    public provider: ResourceProvider,
    public packOpts: T & StickerPackOptionsBase,
    public stickers: OriginStickerInfo[]
  ) {
    super();
  }
  async icon() {
    const { iconId } = await this.provider.getProfileImages();
    return await this.loadImageWorkbench(iconId);
  }
  async cover() {
    const { coverId } = await this.provider.getProfileImages();
    return await this.loadImageWorkbench(coverId);
  }
  async banner() {
    const { bannerId } = await this.provider.getProfileImages();
    return await this.loadImageWorkbench(bannerId);
  }
  checkQuantities(quantities: number[]) {
    if (!quantities.includes(this.stickers.length))
      throw `${this.packOpts.platform}(${
        this.packOpts.packId
      }) stickers number must be ${quantities.join(", ")}, got ${
        this.stickers.length
      }`;
  }
}

export class ExportHelper<T> extends BaseWork<T> {
  constructor(
    public provider: ResourceProvider,
    public packOpts: T & StickerPackOptionsBase,
    public sticker: OriginStickerInfo,
    public workbench: ImageWorkbench
  ) {
    super();
  }
}
