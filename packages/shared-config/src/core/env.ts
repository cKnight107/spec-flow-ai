import { execSync } from "node:child_process";
import type { AppEnv, ConfigProfile } from "./types";

export const APP_ENV_VALUES = [
  "development",
  "test",
  "staging",
  "production",
] as const satisfies readonly AppEnv[];

export const DEFAULT_APP_ENV: AppEnv = "development";
export const DEFAULT_CONFIG_PROFILE = "default";
export const DEFAULT_CONFIG_FILE = "config.yaml";
export const DEFAULT_ENV_FILES = [".env", ".env.local"] as const;

export function isAppEnv(value: string | undefined): value is AppEnv {
  return value !== undefined && APP_ENV_VALUES.includes(value as AppEnv);
}

export function normalizeAppEnv(value: string | undefined): AppEnv | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (isAppEnv(value)) {
    return value;
  }

  return undefined;
}

export function normalizeBranchName(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed === "HEAD") {
    return undefined;
  }

  return trimmed
    .replace(/^refs\/heads\//u, "")
    .replace(/^origin\//u, "");
}

export function detectCurrentBranch(options: {
  branchName?: string;
  cwd?: string;
  processEnv?: Record<string, string | undefined>;
}): string | undefined {
  const explicit = normalizeBranchName(options.branchName);
  if (explicit !== undefined) {
    return explicit;
  }

  const processEnv = options.processEnv;
  const candidates = [
    processEnv?.GIT_BRANCH,
    processEnv?.GITHUB_HEAD_REF,
    processEnv?.GITHUB_REF_NAME,
    processEnv?.CI_COMMIT_REF_NAME,
    processEnv?.BRANCH_NAME,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeBranchName(candidate);
    if (normalized !== undefined) {
      return normalized;
    }
  }

  try {
    const raw = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: options.cwd,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    });

    return normalizeBranchName(raw);
  } catch {
    return undefined;
  }
}

export function resolveAppEnv(options: {
  explicitAppEnv?: AppEnv;
  profile?: ConfigProfile;
  processEnv?: Record<string, string | undefined>;
}): AppEnv {
  if (options.explicitAppEnv !== undefined) {
    return options.explicitAppEnv;
  }

  const fromAppEnv = normalizeAppEnv(options.processEnv?.APP_ENV);
  if (fromAppEnv !== undefined) {
    return fromAppEnv;
  }

  const fromNodeEnv = normalizeAppEnv(options.processEnv?.NODE_ENV);
  if (fromNodeEnv !== undefined) {
    return fromNodeEnv;
  }

  const fromProfile = normalizeAppEnv(options.profile);
  if (fromProfile !== undefined) {
    return fromProfile;
  }

  return DEFAULT_APP_ENV;
}

export function getDefaultConfigFileCandidates(): readonly string[] {
  return ["config.yaml", "config.yml"];
}

export function getProfileConfigFileCandidates(profile: ConfigProfile): readonly string[] {
  return [`config-${profile}.yaml`, `config-${profile}.yml`];
}
