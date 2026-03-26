import { getTelemetryContext } from "./context";
import type { JsonObject, JsonValue, LogLevel } from "./types";
import { nowIsoString, toJsonValue } from "./utils";

export type LogWriter = (line: string, level: LogLevel) => void;

export type TelemetryLogger = {
  child(bindings: Record<string, unknown>): TelemetryLogger;
  debug(message: string, fields?: Record<string, unknown>): void;
  info(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
  error(message: string, fields?: Record<string, unknown>): void;
};

type LoggerOptions = {
  name?: string;
  writer?: LogWriter;
  now?: () => string;
};

class JsonTelemetryLogger implements TelemetryLogger {
  private readonly baseBindings: Record<string, unknown>;
  private readonly writer: LogWriter;
  private readonly now: () => string;

  public constructor(baseBindings: Record<string, unknown>, writer: LogWriter, now: () => string) {
    this.baseBindings = baseBindings;
    this.writer = writer;
    this.now = now;
  }

  public child(bindings: Record<string, unknown>): TelemetryLogger {
    return new JsonTelemetryLogger(
      {
        ...this.baseBindings,
        ...bindings,
      },
      this.writer,
      this.now,
    );
  }

  public debug(message: string, fields?: Record<string, unknown>): void {
    this.write("debug", message, fields);
  }

  public info(message: string, fields?: Record<string, unknown>): void {
    this.write("info", message, fields);
  }

  public warn(message: string, fields?: Record<string, unknown>): void {
    this.write("warn", message, fields);
  }

  public error(message: string, fields?: Record<string, unknown>): void {
    this.write("error", message, fields);
  }

  private write(level: LogLevel, message: string, fields?: Record<string, unknown>): void {
    const record: JsonObject = {
      level,
      time: this.now(),
      message,
    };
    const context = getTelemetryContext();

    mergeJsonObject(record, this.baseBindings);
    mergeJsonObject(record, fields);

    if (context !== undefined) {
      record.trace_id = context.traceId;
      record.span_id = context.spanId;
      record.request_id = context.requestId;
      record.tenant_id = context.tenantId;
      record.app_id = context.appId;
      record.user_id = context.userId;
      record.service_name = context.serviceName;
      record.environment = context.environment;

      if (context.sessionId !== undefined) {
        record.session_id = context.sessionId;
      }

      if (context.conversationId !== undefined) {
        record.conversation_id = context.conversationId;
      }

      if (context.workflowId !== undefined) {
        record.workflow_id = context.workflowId;
      }

      if (context.executionId !== undefined) {
        record.execution_id = context.executionId;
      }

      if (context.auditId !== undefined) {
        record.audit_id = context.auditId;
      }
    }

    this.writer(JSON.stringify(record), level);
  }
}

export function createJsonLogger(options: LoggerOptions = {}): TelemetryLogger {
  const writer = options.writer ?? defaultLogWriter;
  const now = options.now ?? nowIsoString;

  return new JsonTelemetryLogger(
    options.name === undefined ? {} : { logger: options.name },
    writer,
    now,
  );
}

function mergeJsonObject(target: JsonObject, source: Record<string, unknown> | undefined): void {
  if (source === undefined) {
    return;
  }

  for (const [key, value] of Object.entries(source)) {
    const jsonValue = toJsonValue(value);

    if (jsonValue !== undefined) {
      target[key] = jsonValue;
    }
  }
}

function defaultLogWriter(line: string, level: LogLevel): void {
  if (level === "error" || level === "warn") {
    process.stderr.write(`${line}\n`);
    return;
  }

  process.stdout.write(`${line}\n`);
}

export function parseJsonLogLine(line: string): JsonValue {
  return JSON.parse(line) as JsonValue;
}
