import fs from "fs";
import path from "path";

import { createCommand } from "commander";
import yaml from "js-yaml";

import {
  FileSystemResourceProvider,
  FileSystemResourceProviderOptions,
} from "./resource-providers/file-system";

import { buildStickerPacks } from "./";

const program = createCommand();

program
  .option("-c, --config <string>", "config file name in workdir")
  .argument(
    "[string]",
    "stickers workspace directory, default: current directory"
  );

program.parse(process.argv);

export const workdir = path.resolve(program.args[0] || process.cwd());

export const _optsSet = yaml.load(
  fs.readFileSync(
    path.resolve(workdir, program.getOptionValue("config") || "config.yaml"),
    "utf-8"
  )
) as Record<string, FileSystemResourceProviderOptions>;

const optsSet = Object.entries(_optsSet).map(([name, config]) => {
  const sourceDir = path.resolve(workdir, config.sourceDir || "source");
  const destDir = path.resolve(workdir, config.destDir || name);
  config.name = config.name || name;

  fs.mkdirSync(destDir, { recursive: true });

  return {
    ...config,
    sourceDir,
    destDir,
  };
});

(async () => {
  for (const opts of optsSet) {
    console.log(`Config: ${opts.name}`);
    try {
      await buildStickerPacks({
        resourceProviderModule: FileSystemResourceProvider.moduleName,
        moduleOptions: opts,
        showProgress: true,
      });
    } catch (e) {
      console.error(e);
    }
  }
})();
