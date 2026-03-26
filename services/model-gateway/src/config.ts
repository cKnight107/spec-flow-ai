import {
  type InferSchemaOutput,
  formatLastConfigDiagnostics,
  loadConfig,
  modelGatewaySchema,
} from "@enterprise-ai-hub/shared-config/server";

export type ModelGatewayConfig = InferSchemaOutput<typeof modelGatewaySchema>;

let cachedConfig: Readonly<ModelGatewayConfig> | undefined;

export function getModelGatewayConfig(): Readonly<ModelGatewayConfig> {
  if (cachedConfig === undefined) {
    cachedConfig = loadConfig({
      schema: modelGatewaySchema,
      cwd: process.cwd(),
    });
  }

  return cachedConfig;
}

export function describeModelGatewayConfig(): string {
  if (cachedConfig === undefined) {
    getModelGatewayConfig();
  }

  return formatLastConfigDiagnostics();
}
