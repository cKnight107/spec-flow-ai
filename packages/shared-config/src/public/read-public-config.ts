import { adminConsoleSchema } from "../core/schema/admin-console";
import { resolveSchema } from "../core/resolve";
import type {
  ConfigSchema,
  InferSchemaOutputByScope,
  RawConfigEntries,
} from "../core/types";

function toRawEntries(
  rawEnv: Record<string, string | undefined>,
): RawConfigEntries {
  const entries: Record<string, { value: string; source: "process-env"; sourceName: string }> = {};

  for (const [key, value] of Object.entries(rawEnv)) {
    if (value === undefined) {
      continue;
    }

    entries[key] = {
      value,
      source: "process-env",
      sourceName: "process.env",
    };
  }

  return Object.freeze(entries);
}

export function readPublicConfig<TSchema extends ConfigSchema = typeof adminConsoleSchema>(options: {
  rawEnv: Record<string, string | undefined>;
  schema?: TSchema;
}): Readonly<InferSchemaOutputByScope<TSchema, "public">> {
  const resolved = resolveSchema({
    schema: (options.schema ?? adminConsoleSchema) as TSchema,
    rawEntries: toRawEntries(options.rawEnv),
    scope: "public",
  });

  return resolved.config;
}
