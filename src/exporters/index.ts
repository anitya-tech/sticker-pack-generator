import { ExportConfig } from "../types";

import { lineExplorter } from "./line";
import { telegramExplorter } from "./telegram";
import { Exporter, StickerPackConfigBase } from "./types";
import { wechatExplorter } from "./wechat";

const exporters: Record<string, Exporter<unknown>> = {
  wechat: wechatExplorter,
  line: lineExplorter,
  telegram: telegramExplorter,
};

export const resolveExporter = (
  _ec: ExportConfig["exports"][0]
): [Exporter<unknown>, StickerPackConfigBase] => {
  const exportConfig = typeof _ec === "string" ? { type: _ec } : _ec;
  const exporter = exporters[exportConfig.type];
  return [exporter, exportConfig];
};
