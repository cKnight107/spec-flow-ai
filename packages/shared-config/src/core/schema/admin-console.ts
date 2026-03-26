import {
  defineField,
  defineSchema,
  enumParser,
  mergeSchemas,
  stringParser,
} from "../fields";
import { baseSchema } from "./base";

const adminConsoleOnlySchema = defineSchema({
  WEB_TITLE: defineField({
    parser: stringParser(),
    scope: "public",
    required: false,
    defaultValue: "AI中台",
    description: "Admin Console 页面标题",
  }),
  NEXT_PUBLIC_APP_ENV: defineField({
    parser: enumParser(["development", "test", "staging", "production"]),
    scope: "public",
    required: false,
    defaultValue: "development",
    description: "前端可见的当前环境名",
  }),
  NEXT_PUBLIC_CONSOLE_TITLE: defineField({
    parser: stringParser(),
    scope: "public",
    required: false,
    defaultValue: "Enterprise AI Admin Console",
    description: "控制台标题",
  }),
  NEXT_PUBLIC_API_BASE_URL: defineField({
    parser: stringParser(),
    scope: "public",
    required: false,
    defaultValue: "/api",
    description: "控制台调用 BFF 的基础路径",
  }),
});

export const adminConsoleSchema = mergeSchemas(baseSchema, adminConsoleOnlySchema);
