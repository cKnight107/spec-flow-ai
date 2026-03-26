import "server-only";

import {
  adminConsoleSchema,
  loadPublicConfig,
} from "@enterprise-ai-hub/shared-config/public/server";

export const publicConfig = loadPublicConfig({
  schema: adminConsoleSchema,
  cwd: process.cwd(),
});
