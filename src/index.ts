import childProcess from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";

import { MultiBar } from "cli-progress";

import { exportConfig, stickersDir } from "./config";
import { resolveExporter } from "./exporters";
import { OriginStickerMeta } from "./types";
import { WorkerOutput } from "./worker";

const start = async () => {
  const stickerFiles = await fs.readdir(stickersDir);
  const stickers: OriginStickerMeta[] = await Promise.all(
    stickerFiles.map(async (filename) => {
      const file = path.join(stickersDir, filename);
      const match = file.match(/(\d+)\.(.+)\.(.+)/);
      if (!match) throw `filename format error: ${file}`;
      const [, index, name, ext] = match;
      return { index: Number(index), file, name, ext };
    })
  );

  const exporters = exportConfig.exports.map((i) => resolveExporter(i));

  await Promise.all(
    exporters.map(([exporter, ec]) => exporter.init(ec, stickers))
  );

  console.log("Sticker Export Start");

  const multibar = new MultiBar({
    format: "[{bar}] {percentage}% | {work} | {value}/{total}",
  });

  const totalBar = multibar.create(stickers.length, 0, { work: "总进度" });

  const worker = (sticker: OriginStickerMeta) => {
    const bar = multibar.create(1, 0, { work: "" });
    const child = childProcess.fork(
      path.join(__dirname, "worker.js"),
      process.argv,
      { stdio: "inherit" }
    );
    child.send({ config: exportConfig, sticker });
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

  const _stickers = [...stickers];
  let completeCount = _stickers.length;
  const loop = async () => {
    const sticker = _stickers.pop();
    if (!sticker) return;
    await worker(sticker);
    completeCount -= 1;
    if (completeCount === 0) setTimeout(() => multibar.stop());
    totalBar.increment();
    loop();
  };

  const processes = Math.ceil(os.cpus().length / 2);

  for (let i = 0; i < processes; i++) loop();
};

start();
