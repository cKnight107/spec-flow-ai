export type AppEnv = "development" | "test" | "staging" | "production";

export type ConfigProfile = string;

export type ConfigScope = "server" | "public";

export type ConfigSourceKind =
  | "default"
  | "config-file"
  | "env-file"
  | "process-env"
  | "test-override"
  | "derived"
  | "alias";

export type DeprecatedConfig = Readonly<{
  since: string;
  removeBy: string;
  replacement?: string;
  note?: string;
}>;

export type ConfigParser<TValue> = Readonly<{
  kind: string;
  parse: (raw: string, context: { key: string }) => TValue;
}>;

export type FieldDefinition<
  TValue,
  TScope extends ConfigScope = ConfigScope,
> = Readonly<{
  parser: ConfigParser<TValue>;
  scope: TScope;
  required: boolean;
  defaultValue?: TValue;
  secret: boolean;
  description: string;
  example?: string;
  aliases: readonly string[];
  deprecated?: DeprecatedConfig;
}>;

export type ConfigSchema = Record<string, FieldDefinition<unknown, ConfigScope>>;

type InferFieldValue<TField> = TField extends FieldDefinition<infer TValue, ConfigScope>
  ? TValue
  : never;

export type InferSchemaOutput<TSchema extends ConfigSchema> = Readonly<{
  [K in keyof TSchema]: InferFieldValue<TSchema[K]>;
}>;

export type InferSchemaOutputByScope<
  TSchema extends ConfigSchema,
  TScope extends ConfigScope,
> = Readonly<{
  [K in keyof TSchema as TSchema[K]["scope"] extends TScope ? K : never]: InferFieldValue<
    TSchema[K]
  >;
}>;

export type RawConfigEntry = Readonly<{
  value: string;
  source: Exclude<ConfigSourceKind, "default" | "alias">;
  sourceName: string;
}>;

export type RawConfigEntries = Readonly<Record<string, RawConfigEntry>>;

export type ConfigSourceRecord = Readonly<{
  key: string;
  source: ConfigSourceKind;
  sourceName: string;
  masked: boolean;
}>;

export type ConfigWarning = Readonly<{
  key: string;
  message: string;
  sourceName?: string;
}>;

export type ConfigIssueCode = "missing" | "invalid" | "conflict" | "removed-alias";

export type ConfigIssue = Readonly<{
  key: string;
  code: ConfigIssueCode;
  message: string;
  sourceName?: string;
}>;

export type ResolveConfigResult<TConfig> = Readonly<{
  config: TConfig;
  sources: readonly ConfigSourceRecord[];
  warnings: readonly ConfigWarning[];
}>;

export type LoadConfigOptions<TSchema extends ConfigSchema = ConfigSchema> = Readonly<{
  schema?: TSchema;
  appEnv?: AppEnv;
  profile?: ConfigProfile;
  cwd?: string;
  configFile?: string;
  envFiles?: readonly string[];
  branchName?: string;
  processEnv?: Record<string, string | undefined>;
  testOverrides?: Record<string, string | undefined>;
}>;

export type LoadConfigResult<TConfig> = Readonly<{
  config: TConfig;
  appEnv: AppEnv;
  profile: ConfigProfile;
  loadedFiles: readonly string[];
  sources: readonly ConfigSourceRecord[];
  warnings: readonly ConfigWarning[];
}>;
