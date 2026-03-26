import { adminConsoleSchema } from "../core/schema/admin-console";
import { resolveSchema } from "../core/resolve";
import type {
  ConfigSchema,
  InferSchemaOutputByScope,
  LoadConfigOptions,
} from "../core/types";
import { prepareConfigLoad } from "../server/load-config";

export function loadPublicConfig<TSchema extends ConfigSchema = typeof adminConsoleSchema>(
  options: LoadConfigOptions<TSchema> = {},
): Readonly<InferSchemaOutputByScope<TSchema, "public">> {
  const schema = (options.schema ?? adminConsoleSchema) as TSchema;
  const prepared = prepareConfigLoad({
    ...options,
    schema,
  });
  const resolved = resolveSchema({
    schema,
    rawEntries: prepared.rawEntries,
    scope: "public",
  });

  return resolved.config;
}
