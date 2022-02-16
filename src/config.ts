import { mkdirSync, readFileSync } from "fs";
import path from "path";

import { createCommand } from "commander";
import yaml from "js-yaml";

import { ExportConfig } from "./types";
const program = createCommand();

program
  .option("--debug", "output extra debugging")
  .option("-d, --workdir <string>", "stickers workspace directory");

program.parse(process.argv);

export const workdir =
  path.resolve(program.getOptionValue("workdir")) || process.cwd();

export const configFile = path.join(workdir, "config.yaml");
export const stickersDir = path.join(workdir, "source");

export const exportConfig = yaml.load(
  readFileSync(configFile, "utf-8")
) as ExportConfig;

export const outputDir = exportConfig.destDir
  ? path.resolve(workdir, exportConfig.destDir)
  : path.join(workdir, "output");

mkdirSync(outputDir, { recursive: true });

exportConfig.destDir = outputDir;
