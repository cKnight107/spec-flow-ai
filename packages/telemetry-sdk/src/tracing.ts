import { createChildTelemetryContext, ensureTelemetryContext, runWithTelemetryContext } from "./context";
import type {
  CompletedSpanRecord,
  SerializedError,
  SpanEvent,
  SpanKind,
  SpanStatus,
  TelemetryAttributes,
  TelemetryContextInput,
  TelemetryPrimitive,
} from "./types";
import { compactAttributes, nowIsoString, serializeError } from "./utils";

export type SpanSink = (record: CompletedSpanRecord) => void | Promise<void>;

export type StartSpanOptions = {
  name: string;
  kind?: SpanKind;
  attributes?: Record<string, TelemetryPrimitive | undefined>;
  context?: Partial<TelemetryContextInput>;
  now?: () => string;
};

export type ActiveSpan = {
  readonly traceId: string;
  readonly spanId: string;
  readonly parentSpanId?: string;
  readonly name: string;
  setAttribute(key: string, value: TelemetryPrimitive | undefined): void;
  addEvent(name: string, attributes?: Record<string, TelemetryPrimitive | undefined>): void;
  setStatus(status: SpanStatus): void;
  recordError(error: unknown): void;
};

const spanSinks = new Set<SpanSink>();

class ActiveSpanImpl implements ActiveSpan {
  public readonly traceId: string;
  public readonly spanId: string;
  public readonly parentSpanId?: string;
  public readonly name: string;

  private readonly events: SpanEvent[] = [];
  private readonly attributes: TelemetryAttributes;
  private readonly startedAt: string;
  private readonly kind: SpanKind;
  private readonly serviceName: string;
  private readonly environment: string;
  private readonly now: () => string;

  private status: SpanStatus = "ok";
  private error?: SerializedError;

  public constructor(options: {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    name: string;
    kind: SpanKind;
    serviceName: string;
    environment: string;
    startedAt: string;
    attributes: TelemetryAttributes;
    now: () => string;
  }) {
    this.traceId = options.traceId;
    this.spanId = options.spanId;
    this.parentSpanId = options.parentSpanId;
    this.name = options.name;
    this.kind = options.kind;
    this.serviceName = options.serviceName;
    this.environment = options.environment;
    this.startedAt = options.startedAt;
    this.attributes = options.attributes;
    this.now = options.now;
  }

  public setAttribute(key: string, value: TelemetryPrimitive | undefined): void {
    if (value !== undefined) {
      this.attributes[key] = value;
    }
  }

  public addEvent(name: string, attributes?: Record<string, TelemetryPrimitive | undefined>): void {
    this.events.push({
      name,
      timestamp: this.now(),
      attributes: attributes === undefined ? undefined : compactAttributes(attributes),
    });
  }

  public setStatus(status: SpanStatus): void {
    this.status = status;
  }

  public recordError(error: unknown): void {
    this.status = "error";
    this.error = serializeError(error);
  }

  public toCompletedRecord(): CompletedSpanRecord {
    return {
      name: this.name,
      kind: this.kind,
      traceId: this.traceId,
      spanId: this.spanId,
      parentSpanId: this.parentSpanId,
      serviceName: this.serviceName,
      environment: this.environment,
      startedAt: this.startedAt,
      endedAt: this.now(),
      status: this.status,
      attributes: { ...this.attributes },
      events: [...this.events],
      error: this.error,
    };
  }
}

export function registerSpanSink(sink: SpanSink): () => void {
  spanSinks.add(sink);

  return () => {
    spanSinks.delete(sink);
  };
}

export async function withSpan<T>(
  options: StartSpanOptions,
  callback: (span: ActiveSpan) => Promise<T> | T,
): Promise<T> {
  const baseContext = ensureTelemetryContext(options.context);
  const spanContext = createChildTelemetryContext(baseContext);
  const now = options.now ?? nowIsoString;
  const span = new ActiveSpanImpl({
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    parentSpanId: baseContext.spanId,
    name: options.name,
    kind: options.kind ?? "internal",
    serviceName: spanContext.serviceName,
    environment: spanContext.environment,
    startedAt: now(),
    attributes: compactAttributes(options.attributes ?? {}),
    now,
  });

  try {
    return await runWithTelemetryContext(spanContext, async () => callback(span));
  } catch (error) {
    span.recordError(error);
    throw error;
  } finally {
    await emitSpanRecord(span.toCompletedRecord());
  }
}

async function emitSpanRecord(record: CompletedSpanRecord): Promise<void> {
  for (const sink of spanSinks) {
    try {
      await sink(record);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown span sink error";
      process.stderr.write(
        JSON.stringify({
          level: "warn",
          message: "telemetry.span_sink_failed",
          trace_id: record.traceId,
          span_id: record.spanId,
          error: message,
        }) + "\n",
      );
    }
  }
}
