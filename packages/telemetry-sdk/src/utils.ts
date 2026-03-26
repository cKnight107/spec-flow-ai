import { randomBytes, createHash } from "node:crypto";

import type { JsonObject, JsonValue, SerializedError, TelemetryAttributes, TelemetryPrimitive } from "./types";

export function nowIsoString(): string {
  return new Date().toISOString();
}

export function generateTraceId(): string {
  return randomBytes(16).toString("hex");
}

export function generateSpanId(): string {
  return randomBytes(8).toString("hex");
}

export function generateRequestId(): string {
  return randomBytes(12).toString("hex");
}

export function generateAuditId(): string {
  return `aud_${randomBytes(8).toString("hex")}`;
}

export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function compactAttributes(input: Record<string, TelemetryPrimitive | undefined>): TelemetryAttributes {
  const output: TelemetryAttributes = {};

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      output[key] = value;
    }
  }

  return output;
}

export function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    const candidateCode = "code" in error ? error.code : undefined;

    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: typeof candidateCode === "string" ? candidateCode : undefined,
    };
  }

  return {
    name: "UnknownError",
    message: typeof error === "string" ? error : "Unknown error",
  };
}

export function toJsonValue(value: unknown): JsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return errorToJsonObject(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => toJsonValue(item))
      .filter((item): item is JsonValue => item !== undefined);
  }

  if (typeof value === "object") {
    const output: JsonObject = {};

    for (const [key, item] of Object.entries(value)) {
      const jsonValue = toJsonValue(item);

      if (jsonValue !== undefined) {
        output[key] = jsonValue;
      }
    }

    return output;
  }

  return String(value);
}

function errorToJsonObject(error: Error): JsonObject {
  const output: JsonObject = {
    name: error.name,
    message: error.message,
  };

  if (error.stack !== undefined) {
    output.stack = error.stack;
  }

  const candidateCode = "code" in error ? error.code : undefined;

  if (typeof candidateCode === "string") {
    output.code = candidateCode;
  }

  return output;
}
