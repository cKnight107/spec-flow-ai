import { ConfigValidationError } from "./errors";
import type {
  ConfigIssue,
  ConfigSchema,
  ConfigScope,
  ConfigSourceKind,
  ConfigSourceRecord,
  ConfigWarning,
  InferSchemaOutput,
  InferSchemaOutputByScope,
  RawConfigEntries,
  ResolveConfigResult,
} from "./types";

type ResolveScope = ConfigScope | "all";

type ResolveSchemaOptions<
  TSchema extends ConfigSchema,
  TScope extends ResolveScope,
> = Readonly<{
  schema: TSchema;
  rawEntries: RawConfigEntries;
  scope?: TScope;
}>;

function hasDefaultValue(field: { defaultValue?: unknown }): boolean {
  return Object.prototype.hasOwnProperty.call(field, "defaultValue");
}

function freezeValue<TValue>(value: TValue): TValue {
  if (Array.isArray(value)) {
    return Object.freeze([...value]) as TValue;
  }

  return value;
}

function pushAliasWarnings(options: {
  key: string;
  alias: string;
  warnings: ConfigWarning[];
  sourceName?: string;
  replacement?: string;
  removeBy?: string;
}): void {
  const suffix =
    options.removeBy !== undefined ? `，请在 ${options.removeBy} 前迁移到 ${options.replacement ?? options.key}` : "";

  options.warnings.push({
    key: options.key,
    sourceName: options.sourceName,
    message: `${options.key} 当前通过别名 ${options.alias} 加载${suffix}`,
  });
}

export function resolveSchema<TSchema extends ConfigSchema>(
  options: ResolveSchemaOptions<TSchema, "all">,
): ResolveConfigResult<InferSchemaOutput<TSchema>>;
export function resolveSchema<TSchema extends ConfigSchema>(
  options: ResolveSchemaOptions<TSchema, "public">,
): ResolveConfigResult<InferSchemaOutputByScope<TSchema, "public">>;
export function resolveSchema<TSchema extends ConfigSchema>(
  options: ResolveSchemaOptions<TSchema, "server">,
): ResolveConfigResult<InferSchemaOutputByScope<TSchema, "server">>;
export function resolveSchema<TSchema extends ConfigSchema>(
  options: ResolveSchemaOptions<TSchema, ResolveScope>,
): ResolveConfigResult<InferSchemaOutput<TSchema>> {
  const scope = options.scope ?? "all";
  const config: Record<string, unknown> = {};
  const sources: ConfigSourceRecord[] = [];
  const warnings: ConfigWarning[] = [];
  const issues: ConfigIssue[] = [];

  for (const [key, field] of Object.entries(options.schema)) {
    if (scope !== "all" && field.scope !== scope) {
      continue;
    }

    const directEntry = options.rawEntries[key];

    let selectedValue = directEntry?.value;
    let selectedSource: ConfigSourceKind | undefined = directEntry?.source;
    let selectedSourceName = directEntry?.sourceName;

    let aliasUsed: string | undefined;

    for (const alias of field.aliases) {
      const aliasEntry = options.rawEntries[alias];

      if (aliasEntry === undefined) {
        continue;
      }

      if (directEntry !== undefined && directEntry.value !== aliasEntry.value) {
        warnings.push({
          key,
          sourceName: aliasEntry.sourceName,
          message: `${key} 同时提供了主变量和别名 ${alias}，已优先采用主变量`,
        });
      }

      if (selectedValue === undefined) {
        selectedValue = aliasEntry.value;
        selectedSource = "alias";
        selectedSourceName = alias;
        aliasUsed = alias;
      }
    }

    if (selectedValue === undefined && hasDefaultValue(field)) {
      config[key] = freezeValue(field.defaultValue);
      sources.push({
        key,
        source: "default",
        sourceName: "defaultValue",
        masked: field.secret,
      });
      continue;
    }

    if (selectedValue === undefined) {
      if (field.required) {
        issues.push({
          key,
          code: "missing",
          message: "缺少必填配置",
        });
      }

      continue;
    }

    try {
      const parsed = field.parser.parse(selectedValue, { key });
      config[key] = freezeValue(parsed);
      sources.push({
        key,
        source: selectedSource ?? "default",
        sourceName: selectedSourceName ?? "defaultValue",
        masked: field.secret,
      });
    } catch (error) {
      issues.push({
        key,
        code: "invalid",
        sourceName: selectedSourceName,
        message: error instanceof Error ? error.message : "配置解析失败",
      });
      continue;
    }

    if (aliasUsed !== undefined) {
      pushAliasWarnings({
        key,
        alias: aliasUsed,
        warnings,
        sourceName: selectedSourceName,
        replacement: key,
        removeBy: field.deprecated?.removeBy,
      });
    }

    if (field.deprecated !== undefined && aliasUsed === undefined) {
      warnings.push({
        key,
        sourceName: selectedSourceName,
        message: `${key} 已被标记为废弃，请在 ${field.deprecated.removeBy} 前迁移`,
      });
    }
  }

  if (issues.length > 0) {
    throw new ConfigValidationError(issues);
  }

  return {
    config: Object.freeze(config) as InferSchemaOutput<TSchema>,
    sources: Object.freeze(sources),
    warnings: Object.freeze(warnings),
  };
}
