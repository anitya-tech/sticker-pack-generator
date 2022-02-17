import fs from "fs/promises";
import path from "path";

import { StickerPackOptionsBase } from "../exporters/types";
import {
  OriginStickerInfo,
  ProfileImageIds,
  ResourceProvider,
  StickerSetInfo,
} from "../types";

export interface FileSystemResourceProviderOptions {
  sourceDir: string;
  destDir: string;
  name: string;
  description: string;
  exports: (string | StickerPackOptionsBase)[];
}

const fileCache: Record<string, Promise<Buffer>> = {};

export class FileSystemResourceProvider implements ResourceProvider {
  static moduleName = __filename;
  private _stickers?: OriginStickerInfo[];
  constructor(public opts: FileSystemResourceProviderOptions) {}
  info(): Promise<StickerSetInfo> {
    return Promise.resolve({
      name: this.opts.name,
      description: this.opts.description,
    });
  }
  async listStickers() {
    if (!this._stickers) {
      const stickersDir = path.resolve(this.opts.sourceDir, "stickers");
      const files = await fs.readdir(stickersDir);
      this._stickers = files.map((filename) => {
        const file = path.resolve(stickersDir, filename);
        const match = filename.match(/^(\d+)\.(.+)\.(.+)$/);
        if (!match) throw `filename format error: ${file}`;
        const [, index, name, extension] = match;
        if (extension !== "png") throw `source file must be png: ${file}`;
        return {
          index: Number(index),
          name,
          extension: extension as "png",
          resId: file,
        };
      });
    }
    return this._stickers;
  }
  getProfileImages(): Promise<ProfileImageIds> {
    return Promise.resolve({
      coverId: path.resolve(this.opts.sourceDir, "cover.png"),
      bannerId: path.resolve(this.opts.sourceDir, "banner.png"),
      iconId: path.resolve(this.opts.sourceDir, "icon.png"),
    });
  }
  loadResource(resId: string): Promise<Buffer> {
    return (fileCache[resId] = fileCache[resId] || fs.readFile(resId));
  }
  async saveResource(
    pckerId: string,
    category: string | undefined,
    name: string,
    data: Buffer
  ): Promise<string> {
    const dir = path.resolve(this.opts.destDir, pckerId, category || "");
    await fs.mkdir(dir, { recursive: true });
    const file = path.resolve(dir, name);
    await fs.writeFile(file, data);
    return file;
  }
  getExportSet(): Promise<StickerPackOptionsBase[]> {
    return Promise.resolve(
      this.opts.exports.map((i) => {
        const opts =
          typeof i === "string"
            ? ({ platform: i } as StickerPackOptionsBase)
            : i;
        return {
          ...opts,
          platform: opts.platform,
          packId: opts.packId || opts.platform,
          name: opts.name || this.opts.name,
          description: opts.description || this.opts.description,
        };
      })
    );
  }
}

export const Provider = FileSystemResourceProvider;
