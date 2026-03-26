import type { ConfigIssue } from "./types";

function formatIssue(issue: ConfigIssue): string {
  const source = issue.sourceName ? ` [source: ${issue.sourceName}]` : "";
  return `${issue.key}: ${issue.message}${source}`;
}

export class ConfigValidationError extends Error {
  public readonly issues: readonly ConfigIssue[];

  public constructor(issues: readonly ConfigIssue[]) {
    super(issues.map(formatIssue).join("\n"));
    this.name = "ConfigValidationError";
    this.issues = issues;
  }
}
