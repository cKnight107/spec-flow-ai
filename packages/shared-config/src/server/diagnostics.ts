import type { LoadConfigResult } from "../core/types";

export function maskSecret(value: string): string {
  if (value.length <= 4) {
    return "***";
  }

  return `${value.slice(0, 3)}***${value.slice(-2)}`;
}

export function formatConfigDiagnostics(
  result: LoadConfigResult<Readonly<Record<string, unknown>>>,
): string {
  const lines = [
    `appEnv=${result.appEnv}`,
    `profile=${result.profile}`,
    `loadedFiles=${result.loadedFiles.length > 0 ? result.loadedFiles.join(", ") : "(none)"}`,
  ];

  for (const source of result.sources) {
    lines.push(`${source.key} <= ${source.source} (${source.sourceName})`);
  }

  for (const warning of result.warnings) {
    lines.push(`warning: ${warning.message}`);
  }

  return lines.join("\n");
}

export function printConfigDiagnostics(
  result: LoadConfigResult<Readonly<Record<string, unknown>>>,
): void {
  console.log(formatConfigDiagnostics(result));
}
