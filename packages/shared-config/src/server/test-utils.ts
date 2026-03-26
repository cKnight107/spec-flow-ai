import type { ConfigSchema, LoadConfigOptions } from "../core/types";
import { loadConfig } from "./load-config";

let snapshot: NodeJS.ProcessEnv | undefined;

export function snapshotProcessEnv(): void {
  snapshot = { ...process.env };
}

export function restoreProcessEnv(): void {
  if (snapshot === undefined) {
    return;
  }

  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }

  Object.assign(process.env, snapshot);
  snapshot = undefined;
}

export function loadConfigForTest<TSchema extends ConfigSchema>(
  options: Omit<LoadConfigOptions<TSchema>, "appEnv"> = {},
) {
  if (snapshot === undefined) {
    snapshotProcessEnv();
  }

  return loadConfig({
    ...options,
    appEnv: "test",
  });
}
