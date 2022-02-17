import { resolveExporter } from "./exporters";
import { ExportHelper } from "./exporters/utils";
import { ImageWorkbench } from "./image-work/workbench";
import { OriginStickerInfo, ResourceProvider } from "./types";

export interface WorkerInput {
  resourceProviderModule: string;
  moduleOptions: unknown;
  sticker: OriginStickerInfo;
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

async function handlerStickerWork({
  resourceProviderModule,
  moduleOptions,
  sticker,
}: WorkerInput) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Provider = require(resourceProviderModule).Provider;
  const provider: ResourceProvider = new Provider(moduleOptions);

  const exportOptions = await provider.getExportSet();
  const workbench = new ImageWorkbench(
    await provider.loadResource(sticker.resId)
  );

  const total = exportOptions.length;

  for (const [index, packOpts] of exportOptions.entries()) {
    const exporter = resolveExporter(packOpts.platform);
    const work = `[${packOpts.name}] ${sticker.name}: ${packOpts.platform}`;
    await send({ work, progress: [index, total] });
    await exporter.export(
      new ExportHelper(provider, packOpts, sticker, workbench)
    );
  }
  await send({ work: "done", progress: [total, total] });
}
