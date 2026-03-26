import {
  booleanParser,
  defineField,
  defineSchema,
  enumParser,
  stringParser,
} from "../fields";

export const baseSchema = defineSchema({
  CONFIG_PROFILE: defineField({
    parser: stringParser(),
    scope: "server",
    required: false,
    defaultValue: "default",
    description: "当前启用的配置 profile",
  }),
  APP_ENV: defineField({
    parser: enumParser(["development", "test", "staging", "production"]),
    scope: "server",
    required: false,
    defaultValue: "development",
    description: "当前运行环境",
  }),
  LOG_LEVEL: defineField({
    parser: enumParser(["debug", "info", "warn", "error"]),
    scope: "server",
    required: false,
    defaultValue: "info",
    description: "日志级别",
  }),
  OTEL_ENABLED: defineField({
    parser: booleanParser(),
    scope: "server",
    required: false,
    defaultValue: false,
    description: "是否开启 OpenTelemetry",
  }),
});
