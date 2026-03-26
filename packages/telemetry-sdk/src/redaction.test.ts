import assert from "node:assert/strict";
import test from "node:test";

import { redactText } from "./redaction";

test("redactText removes common secrets and pii from previews", () => {
  const result = redactText(
    "联系我 test@example.com，手机号 13800138000，Authorization: Bearer abcdef，key=sk-secret123",
    {
      previewLength: 120,
    },
  );

  assert.equal(result.redacted, true);
  assert.match(result.redactedText, /\[REDACTED_EMAIL\]/);
  assert.match(result.redactedText, /\[REDACTED_PHONE\]/);
  assert.match(result.redactedText, /\[REDACTED_TOKEN\]/);
  assert.match(result.redactedText, /\[REDACTED_SECRET\]/);
});
