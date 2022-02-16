import fs from "fs/promises";
import path from "path";

import { workdir } from "./config";
import { StickerWorkbench } from "./sticker-workbench";

export interface MetaImageContext {
  banner: StickerWorkbench;
  cover: StickerWorkbench;
  icon: StickerWorkbench;
}

export const getMetaImageContext = async () => {
  const load = async (f: string) =>
    new StickerWorkbench(await fs.readFile(path.join(workdir, f)));

  return {
    banner: await load("banner.png"),
    cover: await load("cover.png"),
    icon: await load("icon.png"),
  };
};
