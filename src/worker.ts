import fs from "fs/promises";

import { exportConfig } from "./config";
import { resolveExporter } from "./exporters";
import { StickerWorkbench } from "./sticker-workbench";
import { ExportConfig, OriginStickerMeta } from "./types";

export interface WorkerInput {
  config: ExportConfig;
  sticker: OriginStickerMeta;
}

export interface WorkerOutput {
  work?: string;
  progress: [value: number, total: number];
}

process.on("message", async (message: WorkerInput) => {
  await handlerStickerWork(message);
  process.exit(0);
});

const send = (message: WorkerOutput) =>
  new Promise(
    (r) => process.send && process.send(message, undefined, undefined, r)
  );

async function handlerStickerWork({ config, sticker }: WorkerInput) {
  const workbench = new StickerWorkbench(await fs.readFile(sticker.file));

  for (const [index, _ec] of config.exports.entries()) {
    const [exporter, ec] = resolveExporter(_ec);
    const work = `[${ec.name || exportConfig.name}] ${sticker.name}: ${
      ec.type
    }`;
    await send({ work, progress: [0, config.exports.length] });

    await exporter.export(ec, sticker, workbench);
    await send({ work, progress: [index + 1, config.exports.length] });
  }
}
