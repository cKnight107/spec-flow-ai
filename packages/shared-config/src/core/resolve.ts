import { ConfigValidationError } from "./errors";
import type {
  ConfigIssue,
  ConfigSchema,
  ConfigScope,
  ConfigSourceKind,
  RawConfigEntry,
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

type MatchedRawEntry = Readonly<{
  requestedKey: string;
  entry: RawConfigEntry;
}>;

function freezeValue<TValue>(value: TValue): TValue {
  if (Array.isArray(value)) {
    return Object.freeze([...value]) as TValue;
  }

  return value;
}

function collectLookupKeys(values: readonly (string | undefined)[]): string[] {
  const seen = new Set<string>();
  const keys: string[] = [];

  for (const value of values) {
    const normalized = value?.trim();
    if (normalized === undefined || normalized.length === 0 || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    keys.push(normalized);
  }

  return keys;
}

function normalizeLookupKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/gu, "");
}

function findMatchedEntry(
  rawEntries: RawConfigEntries,
  normalizedEntries: ReadonlyMap<string, Readonly<{ matchedKey: string; entry: RawConfigEntry }>>,
  lookupKeys: readonly string[],
): MatchedRawEntry | undefined {
  for (const lookupKey of lookupKeys) {
    const entry = rawEntries[lookupKey];
    if (entry !== undefined) {
      return {
        requestedKey: lookupKey,
        entry,
      };
    }
  }

  for (const lookupKey of lookupKeys) {
    const matched = normalizedEntries.get(normalizeLookupKey(lookupKey));
    if (matched !== undefined) {
      return {
        requestedKey: lookupKey,
        entry: matched.entry,
      };
    }
  }

  return undefined;
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
  const normalizedEntries = new Map<
    string,
    Readonly<{
      matchedKey: string;
      entry: RawConfigEntry;
    }>
  >();

  for (const [rawKey, entry] of Object.entries(options.rawEntries)) {
    normalizedEntries.set(normalizeLookupKey(rawKey), {
      matchedKey: rawKey,
      entry,
    });
  }

  for (const [key, field] of Object.entries(options.schema)) {
    if (scope !== "all" && field.scope !== scope) {
      continue;
    }

    const directKeys = collectLookupKeys([field.sourceKey ?? key, field.yamlPath]);
    const aliasKeys = collectLookupKeys(field.aliases);
    const directMatch = findMatchedEntry(options.rawEntries, normalizedEntries, directKeys);
    const aliasMatch = findMatchedEntry(options.rawEntries, normalizedEntries, aliasKeys);

    let selectedValue = directMatch?.entry.value;
    let selectedSource: ConfigSourceKind | undefined = directMatch?.entry.source;
    let selectedSourceName = directMatch?.entry.sourceName;

    let aliasUsed: string | undefined;

    if (
      directMatch !== undefined &&
      aliasMatch !== undefined &&
      directMatch.entry.value !== aliasMatch.entry.value
    ) {
      warnings.push({
        key,
        sourceName: aliasMatch.entry.sourceName,
        message: `${key} 同时提供了主变量和别名 ${aliasMatch.requestedKey}，已优先采用主变量`,
      });
    }

    if (selectedValue === undefined && aliasMatch !== undefined) {
      selectedValue = aliasMatch.entry.value;
      selectedSource = aliasMatch.entry.source;
      selectedSourceName = aliasMatch.entry.sourceName;
      aliasUsed = aliasMatch.requestedKey;
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
