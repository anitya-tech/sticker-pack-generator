import { bcutExplorter } from "./bcut";
import { discordExplorter } from "./discord";
import { lineExplorter } from "./line";
import { telegramExplorter } from "./telegram";
import { Exporter } from "./types";
import { wechatExplorter } from "./wechat";
import { whatsappExplorter } from "./whatsapp";

const exporters: Record<string, Exporter<unknown>> = Object.fromEntries(
  [
    bcutExplorter,
    discordExplorter,
    lineExplorter,
    telegramExplorter,
    wechatExplorter,
    whatsappExplorter,
  ].map((e) => [e.platform, e])
);

export const resolveExporter = (platform: string): Exporter<unknown> => {
  return exporters[platform];
};
