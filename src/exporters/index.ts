import { ExportConfig } from "../types";

import { bcutExplorter } from "./bcut";
import { discordExplorter } from "./discord";
import { lineExplorter } from "./line";
import { telegramExplorter } from "./telegram";
import { Exporter, StickerPackConfigBase } from "./types";
import { wechatExplorter } from "./wechat";
import { whatsappExplorter } from "./whatsapp";

const exporters: Record<string, Exporter<unknown>> = {
  bcut: bcutExplorter,
  discord: discordExplorter,
  line: lineExplorter,
  telegram: telegramExplorter,
  wechat: wechatExplorter,
  whatsapp: whatsappExplorter,
};

export const resolveExporter = (
  _ec: ExportConfig["exports"][0]
): [Exporter<unknown>, StickerPackConfigBase] => {
  const exportConfig = typeof _ec === "string" ? { type: _ec } : _ec;
  const exporter = exporters[exportConfig.type];
  return [exporter, exportConfig];
};
