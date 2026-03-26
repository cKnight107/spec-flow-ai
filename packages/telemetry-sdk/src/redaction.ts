import type { TextRedactionResult } from "./types";
import { sha256 } from "./utils";

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /(?<!\d)(?:\+?86[- ]?)?1\d{10}(?!\d)/g;
const BEARER_TOKEN_PATTERN = /\bBearer\s+[A-Za-z0-9._-]+\b/g;
const OPENAI_KEY_PATTERN = /\bsk-[A-Za-z0-9]+\b/g;
const COOKIE_HEADER_PATTERN = /\b(cookie|set-cookie)\s*:\s*[^;\n]+/gi;

export type RedactTextOptions = {
  previewLength?: number;
};

export function redactText(input: string, options: RedactTextOptions = {}): TextRedactionResult {
  const previewLength = options.previewLength ?? 256;
  const originalLength = input.length;
  const redactedText = applyRedactions(input);

  return {
    redactedText,
    preview: createPreview(redactedText, previewLength),
    hash: sha256(redactedText),
    originalLength,
    redacted: redactedText !== input,
  };
}

export function createPreview(input: string, maxLength = 256): string {
  if (input.length <= maxLength) {
    return input;
  }

  return `${input.slice(0, Math.max(0, maxLength - 1))}…`;
}

function applyRedactions(input: string): string {
  return input
    .replace(EMAIL_PATTERN, "[REDACTED_EMAIL]")
    .replace(PHONE_PATTERN, "[REDACTED_PHONE]")
    .replace(BEARER_TOKEN_PATTERN, "Bearer [REDACTED_TOKEN]")
    .replace(OPENAI_KEY_PATTERN, "[REDACTED_SECRET]")
    .replace(COOKIE_HEADER_PATTERN, "$1: [REDACTED_COOKIE]");
}
