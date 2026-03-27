import type {
  ConfigParser,
  ConfigSchema,
  ConfigScope,
  DeprecatedConfig,
  FieldDefinition,
} from "./types";

type FieldOptions<TValue, TScope extends ConfigScope> = Readonly<{
  parser: ConfigParser<TValue>;
  sourceKey?: string;
  yamlPath?: string;
  scope: TScope;
  required?: boolean;
  defaultValue?: TValue;
  secret?: boolean;
  description: string;
  example?: string;
  aliases?: readonly string[];
  deprecated?: DeprecatedConfig;
}>;

type UnionToIntersection<TValue> = (
  TValue extends unknown ? (value: TValue) => void : never
) extends (value: infer TIntersection) => void
  ? TIntersection
  : never;

type MergedSchema<TSchemas extends readonly ConfigSchema[]> = UnionToIntersection<TSchemas[number]>;

export function defineField<TValue, TScope extends ConfigScope>(
  options: FieldOptions<TValue, TScope>,
): FieldDefinition<TValue, TScope> {
  if (options.scope === "public" && options.secret === true) {
    throw new Error("public 字段不能同时标记为 secret");
  }

  const field: Record<string, unknown> = {
    parser: options.parser,
    scope: options.scope,
    required: options.required ?? true,
    secret: options.secret ?? false,
    description: options.description,
    example: options.example,
    aliases: Object.freeze([...(options.aliases ?? [])]),
    deprecated: options.deprecated,
  };

  if (Object.prototype.hasOwnProperty.call(options, "sourceKey")) {
    field.sourceKey = options.sourceKey;
  }

  if (Object.prototype.hasOwnProperty.call(options, "yamlPath")) {
    field.yamlPath = options.yamlPath;
  }

  if (Object.prototype.hasOwnProperty.call(options, "defaultValue")) {
    field.defaultValue = options.defaultValue;
  }

  return Object.freeze(field) as FieldDefinition<TValue, TScope>;
}

export function defineSchema<const TSchema extends ConfigSchema>(schema: TSchema): TSchema {
  return Object.freeze({ ...schema });
}

type ConfigPropertiesOptions<TSchema extends ConfigSchema> = Readonly<{
  prefix: string;
  fields: TSchema;
  envPrefix?: string;
  yamlPrefix?: string;
}>;

function splitNameTokens(value: string): string[] {
  const normalized = value
    .replace(/([a-z0-9])([A-Z])/gu, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z0-9])/gu, "$1 $2")
    .replace(/[^A-Za-z0-9]+/gu, " ")
    .trim();

  if (normalized.length === 0) {
    return [];
  }

  return normalized.split(/\s+/u).map((token) => token.toLowerCase());
}

function toKebabCase(value: string): string {
  return splitNameTokens(value).join("-");
}

function toUpperSnakeCase(value: string): string {
  return splitNameTokens(value).join("_").toUpperCase();
}

function toKebabPath(value: string): string {
  return value
    .split(".")
    .map((segment) => toKebabCase(segment))
    .filter((segment) => segment.length > 0)
    .join(".");
}

export function defineConfigProperties<const TSchema extends ConfigSchema>(
  options: ConfigPropertiesOptions<TSchema>,
): TSchema {
  const envPrefix = options.envPrefix ?? toUpperSnakeCase(options.prefix);
  const yamlPrefix = options.yamlPrefix ?? toKebabPath(options.prefix);
  const schema: Record<string, FieldDefinition<unknown, ConfigScope>> = {};

  for (const [key, field] of Object.entries(options.fields)) {
    const derivedSourceKey =
      field.sourceKey ??
      [envPrefix, toUpperSnakeCase(key)]
        .filter((segment) => segment.length > 0)
        .join("_");
    const derivedYamlPath =
      field.yamlPath ??
      [yamlPrefix, toKebabCase(key)]
        .filter((segment) => segment.length > 0)
        .join(".");

    schema[key] = Object.freeze({
      ...field,
      sourceKey: derivedSourceKey,
      yamlPath: derivedYamlPath,
      aliases: Object.freeze([...field.aliases]),
    }) as FieldDefinition<unknown, ConfigScope>;
  }

  return defineSchema(schema as TSchema);
}

export function mergeSchemas<const TSchemas extends readonly ConfigSchema[]>(
  ...schemas: TSchemas
): MergedSchema<TSchemas> {
  return Object.freeze(Object.assign({}, ...schemas)) as MergedSchema<TSchemas>;
}

export function stringParser(): ConfigParser<string> {
  return {
    kind: "string",
    parse: (raw) => raw,
  };
}

export function numberParser(options?: {
  integer?: boolean;
  min?: number;
  max?: number;
}): ConfigParser<number> {
  return {
    kind: "number",
    parse: (raw, context) => {
      const value = Number(raw);
      if (!Number.isFinite(value)) {
        throw new Error(`${context.key} 不是合法数字`);
      }

      if (options?.integer === true && !Number.isInteger(value)) {
        throw new Error(`${context.key} 必须是整数`);
      }

      if (options?.min !== undefined && value < options.min) {
        throw new Error(`${context.key} 必须大于等于 ${options.min}`);
      }

      if (options?.max !== undefined && value > options.max) {
        throw new Error(`${context.key} 必须小于等于 ${options.max}`);
      }

      return value;
    },
  };
}

export function booleanParser(): ConfigParser<boolean> {
  return {
    kind: "boolean",
    parse: (raw, context) => {
      if (raw === "true") {
        return true;
      }

      if (raw === "false") {
        return false;
      }

      throw new Error(`${context.key} 只能为 true 或 false`);
    },
  };
}

export function enumParser<const TValues extends readonly [string, ...string[]]>(
  values: TValues,
): ConfigParser<TValues[number]> {
  return {
    kind: "enum",
    parse: (raw, context) => {
      if (!values.includes(raw)) {
        throw new Error(`${context.key} 必须是 ${values.join(" / ")} 之一`);
      }

      return raw as TValues[number];
    },
  };
}

export function urlParser(): ConfigParser<string> {
  return {
    kind: "url",
    parse: (raw, context) => {
      try {
        new URL(raw);
        return raw;
      } catch {
        throw new Error(`${context.key} 不是合法 URL`);
      }
    },
  };
}

export function arrayParser(options?: {
  separator?: string;
  allowEmpty?: boolean;
}): ConfigParser<readonly string[]> {
  const separator = options?.separator ?? ",";

  return {
    kind: "array",
    parse: (raw, context) => {
      const values = raw
        .split(separator)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      if (values.length === 0 && options?.allowEmpty !== true) {
        throw new Error(`${context.key} 不能为空数组`);
      }

      return Object.freeze(values);
    },
  };
}
