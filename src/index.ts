import childProcess from "child_process";
import os from "os";
import path from "path";

import { resolveExporter } from "./exporters";
import { InitHelper } from "./exporters/utils";
import { ProgressBar } from "./progress-bar";
import { OriginStickerInfo, ResourceProvider } from "./types";
import { WorkerOutput } from "./worker";

interface BuildOptions {
  resourceProviderModule: string;
  moduleOptions: unknown;
  showProgress?: boolean;
}

export const buildStickerPacks = async ({
  resourceProviderModule,
  moduleOptions,
  showProgress,
}: BuildOptions) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Provider = require(resourceProviderModule).Provider;
  const provider: ResourceProvider = new Provider(moduleOptions);

  const info = await provider.info();
  const exportOptions = await provider.getExportSet();
  const stickers = await provider.listStickers();

  const log = (msg: string) => console.log(`[${info.name}] ${msg}`);

  const multibar = new ProgressBar(
    "[{bar}] {percentage}% | {work} | {value}/{total}",
    showProgress
  );

  log("StickerPack Profile Images Exporting...");
  await Promise.all(
    exportOptions.map(async (packOpts) => {
      const explorter = resolveExporter(packOpts.platform);
      if (!explorter.init) return;
      await explorter.init(new InitHelper(provider, packOpts, stickers));
    })
  );

  log("Stickers Exporting...");
  const totalBar = multibar.create(stickers.length, 0, { work: "总进度" });

  const worker = (sticker: OriginStickerInfo) => {
    const bar = multibar.create(1, 0, { work: "" });
    const child = childProcess.fork(path.join(__dirname, "worker.js"));
    child.send({
      resourceProviderModule,
      moduleOptions,
      sticker,
    });
    child.on("message", ({ progress: [value, total], work }: WorkerOutput) => {
      bar.setTotal(total);
      bar.update(value, { work });
      if (value === total) multibar.remove(bar);
    });

    return new Promise((resolve, reject) => {
      child.on("exit", (code) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(code);
          console.error(`Error(${code}): ${sticker}`);
        }
      });
    });
  };

  await new Promise<void>((r) => {
    const _stickers = [...stickers];
    let completeCount = _stickers.length;

    const loop = async () => {
      const sticker = _stickers.pop();
      if (!sticker) return;
      await worker(sticker);
      totalBar.increment();
      completeCount -= 1;
      if (completeCount === 0) {
        setTimeout(() => multibar.stop());
        r();
      }
      loop();
    };

    const processes = Math.ceil(os.cpus().length / 2);
    for (let i = 0; i < processes; i++) loop();
  });
};
