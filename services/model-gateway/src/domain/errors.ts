export type ModelGatewayErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_JSON_REQUEST"
  | "UNSUPPORTED_STREAM"
  | "MODEL_NOT_FOUND"
  | "PROVIDER_NOT_SUPPORTED"
  | "PROVIDER_AUTH_MISSING"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_AUTH_FAILED"
  | "PROVIDER_RATE_LIMITED"
  | "PROVIDER_BAD_REQUEST"
  | "PROVIDER_UPSTREAM_ERROR"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "INTERNAL_ERROR";

export class ModelGatewayError extends Error {
  public readonly code: ModelGatewayErrorCode;
  public readonly statusCode: number;
  public readonly retryable: boolean;
  public readonly traceId?: string;
  public readonly requestId?: string;
  public readonly auditId?: string;
  public readonly details?: Readonly<Record<string, string>>;

  public constructor(options: {
    code: ModelGatewayErrorCode;
    statusCode: number;
    message: string;
    retryable?: boolean;
    traceId?: string;
    requestId?: string;
    auditId?: string;
    details?: Readonly<Record<string, string>>;
    cause?: unknown;
  }) {
    super(options.message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "ModelGatewayError";
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.retryable = options.retryable ?? false;
    this.traceId = options.traceId;
    this.requestId = options.requestId;
    this.auditId = options.auditId;
    this.details = options.details;
  }
}

type ErrorLike = Partial<
  Error & {
    code: string;
    statusCode: number;
    retryable: boolean;
  }
>;

function isErrorLike(value: unknown): value is ErrorLike {
  return value instanceof Error || (typeof value === "object" && value !== null);
}

export function isModelGatewayError(error: unknown): error is ModelGatewayError {
  return error instanceof ModelGatewayError;
}

export function toModelGatewayError(error: unknown): ModelGatewayError {
  if (error instanceof ModelGatewayError) {
    return error;
  }

  const candidate = isErrorLike(error) ? error : undefined;
  const code = candidate?.code;

  switch (code) {
    case "PROVIDER_TIMEOUT":
      return new ModelGatewayError({
        code: "PROVIDER_TIMEOUT",
        statusCode: 504,
        message: candidate?.message ?? "上游 provider 调用超时",
        retryable: candidate?.retryable ?? true,
        cause: error,
      });
    case "PROVIDER_AUTH_FAILED":
      return new ModelGatewayError({
        code: "PROVIDER_AUTH_FAILED",
        statusCode: 502,
        message: candidate?.message ?? "上游 provider 鉴权失败",
        cause: error,
      });
    case "PROVIDER_RATE_LIMITED":
      return new ModelGatewayError({
        code: "PROVIDER_RATE_LIMITED",
        statusCode: 429,
        message: candidate?.message ?? "上游 provider 触发限流",
        retryable: true,
        cause: error,
      });
    case "PROVIDER_BAD_REQUEST":
      return new ModelGatewayError({
        code: "PROVIDER_BAD_REQUEST",
        statusCode: 400,
        message: candidate?.message ?? "上游 provider 拒绝当前请求",
        cause: error,
      });
    case "PROVIDER_UPSTREAM_ERROR":
      return new ModelGatewayError({
        code: "PROVIDER_UPSTREAM_ERROR",
        statusCode: candidate?.statusCode ?? 502,
        message: candidate?.message ?? "上游 provider 调用失败",
        retryable: candidate?.retryable ?? true,
        cause: error,
      });
    default:
      return new ModelGatewayError({
        code: "INTERNAL_ERROR",
        statusCode: 500,
        message: error instanceof Error ? error.message : "模型网关内部错误",
        cause: error,
      });
  }
}
