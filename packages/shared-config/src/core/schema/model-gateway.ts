import {
  defineField,
  defineSchema,
  enumParser,
  mergeSchemas,
  numberParser,
  stringParser,
} from "../fields";
import { baseSchema } from "./base";

const modelGatewayOnlySchema = defineSchema({
  PORT: defineField({
    parser: numberParser({ integer: true, min: 1, max: 65535 }),
    scope: "server",
    required: false,
    defaultValue: 3001,
    description: "模型网关监听端口",
  }),
  MODEL_GATEWAY_PROVIDER: defineField({
    parser: enumParser(["openai", "azure-openai", "anthropic"]),
    scope: "server",
    description: "上游模型提供方",
  }),
  MODEL_GATEWAY_TIMEOUT_MS: defineField({
    parser: numberParser({ integer: true, min: 1000 }),
    scope: "server",
    required: false,
    defaultValue: 30000,
    description: "模型请求超时时间",
  }),
  OPENAI_API_KEY: defineField({
    parser: stringParser(),
    scope: "server",
    secret: true,
    description: "调用上游模型供应商的凭据",
    aliases: ["MODEL_GATEWAY_OPENAI_API_KEY"],
    deprecated: {
      since: "0.1.0",
      removeBy: "0.3.0",
      replacement: "OPENAI_API_KEY",
    },
  }),
});

export const modelGatewaySchema = mergeSchemas(baseSchema, modelGatewayOnlySchema);
