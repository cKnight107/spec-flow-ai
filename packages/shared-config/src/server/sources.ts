import type { RawConfigEntries, RawConfigEntry } from "../core/types";

export type ConfigLayer = Readonly<{
  source: RawConfigEntry["source"];
  sourceName: string;
  values: Record<string, string | undefined>;
}>;

export function mergeConfigLayers(layers: readonly ConfigLayer[]): RawConfigEntries {
  const merged: Record<string, RawConfigEntry> = {};

  for (const layer of layers) {
    for (const [key, value] of Object.entries(layer.values)) {
      if (value === undefined) {
        continue;
      }

      merged[key] = {
        value,
        source: layer.source,
        sourceName: layer.sourceName,
      };
    }
  }

  return Object.freeze(merged);
}
