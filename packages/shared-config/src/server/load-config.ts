import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { baseSchema } from "../core/schema/base";
import {
  DEFAULT_CONFIG_FILE,
  DEFAULT_CONFIG_PROFILE,
  DEFAULT_ENV_FILES,
  detectCurrentBranch,
  getDefaultConfigFileCandidates,
  getProfileConfigFileCandidates,
  resolveAppEnv,
} from "../core/env";
import { resolveSchema } from "../core/resolve";
import type {
  AppEnv,
  ConfigProfile,
  ConfigSchema,
  ConfigSourceRecord,
  ConfigWarning,
  InferSchemaOutput,
  LoadConfigOptions,
  LoadConfigResult,
  RawConfigEntries,
} from "../core/types";
import {
  formatConfigDiagnostics,
  printConfigDiagnostics as printDiagnostics,
} from "./diagnostics";
import { mergeConfigLayers, type ConfigLayer } from "./sources";

type ConfigDocument = Record<string, string | undefined>;

type PreparedLoadContext = Readonly<{
  appEnv: AppEnv;
  profile: ConfigProfile;
  loadedFiles: readonly string[];
  rawEntries: RawConfigEntries;
  warnings: readonly ConfigWarning[];
}>;

let lastLoadResult:
  | LoadConfigResult<Readonly<Record<string, unknown>>>
  | undefined;

function toDisplayPath(cwd: string, absolutePath: string): string {
  const relativePath = path.relative(cwd, absolutePath);
  return relativePath.length === 0 ? path.basename(absolutePath) : relativePath;
}

function parseEnvFile(filePath: string): Record<string, string | undefined> {
  const content = fs.readFileSync(filePath, "utf8");
  const values: Record<string, string | undefined> = {};

  for (const line of content.split(/\r?\n/u)) {
    const trimmed = line.trim();

    if (trimmed.length === 0 || trimmed.startsWith("#")) {
      continue;
    }

    const normalized = trimmed.startsWith("export ")
      ? trimmed.slice("export ".length)
      : trimmed;

    const separatorIndex = normalized.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = normalized.slice(0, separatorIndex).trim();
    let value = normalized.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function normalizeProcessEnv(
  processEnv: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const normalized: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(processEnv)) {
    if (typeof value === "string") {
      normalized[key] = value;
    }
  }

  return normalized;
}

function stringifyYamlValue(value: unknown, context: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item, index) => stringifyYamlValue(item, `${context}[${index}]`))
      .filter((item): item is string => item !== undefined)
      .join(",");
  }

  throw new Error(`${context} 只能是标量或标量数组，不能是对象`);
}

function isYamlMap(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectConfigDocumentEntries(options: {
  value: unknown;
  interpolationEnv: Record<string, string | undefined>;
  pathSegments: readonly string[];
  config: Record<string, string | undefined>;
}): void {
  if (options.value === undefined || options.value === null) {
    return;
  }

  if (isYamlMap(options.value)) {
    for (const [key, childValue] of Object.entries(options.value)) {
      collectConfigDocumentEntries({
        value: childValue,
        interpolationEnv: options.interpolationEnv,
        pathSegments: [...options.pathSegments, key],
        config: options.config,
      });
    }

    return;
  }

  const flattenedKey = options.pathSegments.join(".");
  const context = `config.${flattenedKey}`;
  const scalar = stringifyYamlValue(options.value, context);
  if (scalar === undefined) {
    return;
  }

  options.config[flattenedKey] = interpolateValue(scalar, options.interpolationEnv, context);
}

function interpolateValue(
  value: string,
  interpolationEnv: Record<string, string | undefined>,
  context: string,
): string | undefined {
  const wholeVariableMatch = value.match(/^\$\{([A-Z0-9_]+)\}$/u);
  if (wholeVariableMatch !== null) {
    const variableName = wholeVariableMatch[1];
    if (variableName === undefined) {
      return undefined;
    }

    return interpolationEnv[variableName];
  }

  return value.replace(/\$\{([A-Z0-9_]+)\}/gu, (_match, variableName: string) => {
    const resolved = interpolationEnv[variableName];
    if (resolved === undefined) {
      throw new Error(`${context} 引用了未定义变量 ${variableName}`);
    }

    return resolved;
  });
}

function parseConfigDocument(options: {
  filePath: string;
  interpolationEnv: Record<string, string | undefined>;
}): ConfigDocument {
  const content = fs.readFileSync(options.filePath, "utf8");
  const parsed = YAML.parse(content) as Record<string, unknown> | null;
  const root = parsed ?? {};

  if (!isYamlMap(root)) {
    throw new Error("配置文件根节点必须是键值对象");
  }

  const config: Record<string, string | undefined> = {};

  for (const [key, rawValue] of Object.entries(root)) {
    collectConfigDocumentEntries({
      value: rawValue,
      interpolationEnv: options.interpolationEnv,
      pathSegments: [key],
      config,
    });
  }

  return config;
}

function getInterpolationLayers(
  cwd: string,
  envFiles: readonly string[],
  processEnv: Record<string, string | undefined>,
  testOverrides: Record<string, string | undefined> | undefined,
): { env: Record<string, string | undefined>; layers: readonly ConfigLayer[]; loadedFiles: string[] } {
  const layers: ConfigLayer[] = [];
  const loadedFiles: string[] = [];

  for (const envFile of envFiles) {
    const absolutePath = path.isAbsolute(envFile) ? envFile : path.join(cwd, envFile);
    if (!fs.existsSync(absolutePath)) {
      continue;
    }

    const displayPath = toDisplayPath(cwd, absolutePath);
    loadedFiles.push(displayPath);
    layers.push({
      source: "env-file",
      sourceName: displayPath,
      values: parseEnvFile(absolutePath),
    });
  }

  layers.push({
    source: "process-env",
    sourceName: "process.env",
    values: normalizeProcessEnv(processEnv),
  });

  if (testOverrides !== undefined) {
    layers.push({
      source: "test-override",
      sourceName: "testOverrides",
      values: testOverrides,
    });
  }

  const merged = mergeConfigLayers(layers);
  const env: Record<string, string | undefined> = {};
  for (const [key, entry] of Object.entries(merged)) {
    env[key] = entry.value;
  }

  return {
    env,
    layers: Object.freeze(layers),
    loadedFiles,
  };
}

function resolveProfile(options: {
  explicitProfile?: string;
  processEnv?: Record<string, string | undefined>;
  currentBranch?: string;
}): string {
  if (options.explicitProfile !== undefined && options.explicitProfile.trim().length > 0) {
    return options.explicitProfile;
  }

  const configProfile = options.processEnv?.CONFIG_PROFILE;
  if (configProfile !== undefined && configProfile.trim().length > 0) {
    return configProfile.trim();
  }

  if (options.currentBranch !== undefined) {
    return options.currentBranch;
  }

  return DEFAULT_CONFIG_PROFILE;
}

function createDerivedLayer(options: {
  profile: ConfigProfile;
}): ConfigLayer {
  return {
    source: "derived",
    sourceName: "resolved-config",
    values: {
      CONFIG_PROFILE: options.profile,
    },
  };
}

function resolveConfigCandidates(options: {
  cwd: string;
  configFile?: string;
  profile: ConfigProfile;
}): {
  baseCandidates: readonly string[];
  profileCandidates: readonly string[];
} {
  if (options.configFile === undefined) {
    return {
      baseCandidates: getDefaultConfigFileCandidates(),
      profileCandidates:
        options.profile === DEFAULT_CONFIG_PROFILE
          ? []
          : getProfileConfigFileCandidates(options.profile),
    };
  }

  const resolvedBasePath = path.isAbsolute(options.configFile)
    ? options.configFile
    : path.join(options.cwd, options.configFile);
  const parsedPath = path.parse(resolvedBasePath);
  const baseExt = parsedPath.ext.length > 0 ? parsedPath.ext : ".yaml";
  const altExt = baseExt === ".yaml" ? ".yml" : ".yaml";

  return {
    baseCandidates: [resolvedBasePath],
    profileCandidates:
      options.profile === DEFAULT_CONFIG_PROFILE
        ? []
        : [
            path.join(parsedPath.dir, `${parsedPath.name}-${options.profile}${baseExt}`),
            path.join(parsedPath.dir, `${parsedPath.name}-${options.profile}${altExt}`),
          ],
  };
}

function pickExistingConfigFile(options: {
  cwd: string;
  candidates: readonly string[];
  warnings: ConfigWarning[];
  label: string;
}): string | undefined {
  const existing = options.candidates
    .map((candidate) =>
      path.isAbsolute(candidate) ? candidate : path.join(options.cwd, candidate),
    )
    .filter((candidate) => fs.existsSync(candidate));

  if (existing.length > 1) {
    options.warnings.push({
      key: options.label,
      message: `检测到多个同级配置文件，已采用第一个：${toDisplayPath(options.cwd, existing[0] ?? "")}`,
      sourceName: existing.map((item) => toDisplayPath(options.cwd, item)).join(", "),
    });
  }

  return existing[0];
}

function prepareLoadContext<TSchema extends ConfigSchema = typeof baseSchema>(
  options: LoadConfigOptions<TSchema> = {},
): PreparedLoadContext {
  const cwd = options.cwd ?? process.cwd();
  const processEnv = options.processEnv ?? process.env;
  const envFiles = options.envFiles ?? DEFAULT_ENV_FILES;
  const warnings: ConfigWarning[] = [];

  const interpolation = getInterpolationLayers(
    cwd,
    envFiles,
    processEnv,
    options.testOverrides,
  );

  const currentBranch = detectCurrentBranch({
    branchName: options.branchName,
    cwd,
    processEnv,
  });
  const profile = resolveProfile({
    explicitProfile: options.profile,
    processEnv,
    currentBranch,
  });
  const candidates = resolveConfigCandidates({
    cwd,
    configFile: options.configFile ?? DEFAULT_CONFIG_FILE,
    profile,
  });

  const baseConfigFile = pickExistingConfigFile({
    cwd,
    candidates: candidates.baseCandidates,
    warnings,
    label: "base-config",
  });
  const profileConfigFile = pickExistingConfigFile({
    cwd,
    candidates: candidates.profileCandidates,
    warnings,
    label: "profile-config",
  });

  const yamlLayers: ConfigLayer[] = [];
  const loadedFiles: string[] = [];

  if (baseConfigFile !== undefined) {
    loadedFiles.push(toDisplayPath(cwd, baseConfigFile));
    yamlLayers.push({
      source: "config-file",
      sourceName: toDisplayPath(cwd, baseConfigFile),
      values: parseConfigDocument({
        filePath: baseConfigFile,
        interpolationEnv: interpolation.env,
      }),
    });
  }

  if (profileConfigFile !== undefined) {
    loadedFiles.push(toDisplayPath(cwd, profileConfigFile));
    yamlLayers.push({
      source: "config-file",
      sourceName: toDisplayPath(cwd, profileConfigFile),
      values: parseConfigDocument({
        filePath: profileConfigFile,
        interpolationEnv: interpolation.env,
      }),
    });
  } else if (profile !== DEFAULT_CONFIG_PROFILE) {
    warnings.push({
      key: "CONFIG_PROFILE",
      message: `未找到 profile 配置文件 config-${profile}.yaml 或 config-${profile}.yml，将仅使用基础配置`,
      sourceName: profile,
    });
  }

  loadedFiles.push(...interpolation.loadedFiles);

  const preliminaryEntries = mergeConfigLayers([
    ...yamlLayers,
    ...interpolation.layers,
    createDerivedLayer({
      profile,
    }),
  ]);

  const preliminaryEnv: Record<string, string | undefined> = {};
  for (const [key, entry] of Object.entries(preliminaryEntries)) {
    preliminaryEnv[key] = entry.value;
  }

  const appEnv = resolveAppEnv({
    explicitAppEnv: options.appEnv,
    processEnv: preliminaryEnv,
    profile,
  });

  const rawEntries =
    preliminaryEntries.APP_ENV === undefined
      ? mergeConfigLayers([
          ...yamlLayers,
          ...interpolation.layers,
          createDerivedLayer({
            profile,
          }),
          {
            source: "derived",
            sourceName: "resolved-config",
            values: {
              APP_ENV: appEnv,
            },
          },
        ])
      : preliminaryEntries;

  return {
    appEnv,
    profile,
    loadedFiles: Object.freeze(loadedFiles),
    rawEntries,
    warnings: Object.freeze(warnings),
  };
}

export function loadConfigResult<TSchema extends ConfigSchema = typeof baseSchema>(
  options: LoadConfigOptions<TSchema> = {},
): LoadConfigResult<InferSchemaOutput<TSchema>> {
  const schema = (options.schema ?? baseSchema) as TSchema;
  const prepared = prepareLoadContext(options);
  const resolved = resolveSchema({
    schema,
    rawEntries: prepared.rawEntries,
    scope: "all",
  });

  const result: LoadConfigResult<InferSchemaOutput<TSchema>> = {
    appEnv: prepared.appEnv,
    profile: prepared.profile,
    loadedFiles: prepared.loadedFiles,
    config: resolved.config,
    sources: resolved.sources,
    warnings: Object.freeze([...prepared.warnings, ...resolved.warnings]),
  };

  lastLoadResult = result as LoadConfigResult<Readonly<Record<string, unknown>>>;
  return result;
}

export function loadConfig<TSchema extends ConfigSchema = typeof baseSchema>(
  options: LoadConfigOptions<TSchema> = {},
): Readonly<InferSchemaOutput<TSchema>> {
  return loadConfigResult(options).config;
}

export function prepareConfigLoad<TSchema extends ConfigSchema = typeof baseSchema>(
  options: LoadConfigOptions<TSchema> = {},
): PreparedLoadContext {
  return prepareLoadContext(options);
}

export function getConfigSources(): readonly ConfigSourceRecord[] {
  return lastLoadResult?.sources ?? [];
}

export function getConfigWarnings(): readonly ConfigWarning[] {
  return lastLoadResult?.warnings ?? [];
}

export function getLastLoadResult():
  | LoadConfigResult<Readonly<Record<string, unknown>>>
  | undefined {
  return lastLoadResult;
}

export function formatLastConfigDiagnostics(): string {
  if (lastLoadResult === undefined) {
    return "config not loaded";
  }

  return formatConfigDiagnostics(lastLoadResult);
}

export function printConfigDiagnostics(
  result = lastLoadResult,
): void {
  if (result === undefined) {
    console.log("config not loaded");
    return;
  }

  printDiagnostics(result);
}
