import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { URL } from "node:url";

import { generateRequestId } from "@enterprise-ai-hub/telemetry-sdk";

import { getModelGatewayRuntimeConfig, type ModelGatewayRuntimeConfig } from "../config";
import { parseChatCompletionRequest } from "../dto/protocol";
import { ModelGatewayError, isModelGatewayError, toModelGatewayError } from "../domain/errors";
import { ModelGatewayApplication } from "../application/model-gateway-application";
import { createDefaultProviderRegistry } from "../providers/provider-registry";

export type CreateModelGatewayHttpServerOptions = Readonly<{
  runtimeConfig?: ModelGatewayRuntimeConfig;
  application?: ModelGatewayApplication;
}>;

export function createModelGatewayApplication(
  runtimeConfig: ModelGatewayRuntimeConfig = getModelGatewayRuntimeConfig(),
): ModelGatewayApplication {
  return new ModelGatewayApplication(runtimeConfig, createDefaultProviderRegistry());
}

export function createModelGatewayHttpServer(
  options: CreateModelGatewayHttpServerOptions = {},
): Server {
  const runtimeConfig = options.runtimeConfig ?? getModelGatewayRuntimeConfig();
  const application = options.application ?? createModelGatewayApplication(runtimeConfig);

  return createServer(async (request, response) => {
    const requestId = readHeader(request, "x-request-id") ?? generateRequestId();
    const traceId = extractTraceId(request);

    response.setHeader("content-type", "application/json; charset=utf-8");
    response.setHeader("x-request-id", requestId);
    if (traceId !== undefined) {
      response.setHeader("x-trace-id", traceId);
    }

    try {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");

      if (request.method === "GET" && url.pathname === "/v1/models") {
        writeJson(response, 200, application.listModels());
        return;
      }

      if (request.method === "POST" && url.pathname === "/v1/chat/completions") {
        const payload = parseChatCompletionRequest(await readJsonBody(request));
        const result = await application.chatCompletion(payload, {
          telemetry: {
            traceId,
            requestId,
            tenantId: payload.quotaSubject?.tenantId ?? readHeader(request, "x-tenant-id") ?? "unknown-tenant",
            appId: payload.quotaSubject?.appId ?? readHeader(request, "x-app-id") ?? "unknown-app",
            userId:
              payload.quotaSubject?.userId ??
              payload.user ??
              readHeader(request, "x-user-id") ??
              "anonymous",
            serviceName: runtimeConfig.serviceName,
            environment: runtimeConfig.appEnv,
            sessionId: readHeader(request, "x-session-id"),
            conversationId: readHeader(request, "x-conversation-id"),
            workflowId: readHeader(request, "x-workflow-id"),
            executionId: readHeader(request, "x-execution-id"),
          },
        });

        if (result.trace.traceId.length > 0) {
          response.setHeader("x-trace-id", result.trace.traceId);
        }

        writeJson(response, 200, result);
        return;
      }

      if (request.method !== "GET" && request.method !== "POST") {
        throw new ModelGatewayError({
          code: "METHOD_NOT_ALLOWED",
          statusCode: 405,
          message: `不支持的请求方法: ${request.method ?? "UNKNOWN"}`,
        });
      }

      throw new ModelGatewayError({
        code: "NOT_FOUND",
        statusCode: 404,
        message: `未找到路由: ${url.pathname}`,
      });
    } catch (error) {
      const gatewayError = isModelGatewayError(error) ? error : toModelGatewayError(error);
      writeJson(response, gatewayError.statusCode, {
        error: {
          code: gatewayError.code,
          message: gatewayError.message,
          retryable: gatewayError.retryable,
          requestId: gatewayError.requestId ?? requestId,
          traceId: gatewayError.traceId ?? traceId,
          auditId: gatewayError.auditId,
          details: gatewayError.details,
        },
      });
    }
  });
}

export async function startModelGatewayHttpServer(
  options: CreateModelGatewayHttpServerOptions = {},
): Promise<Server> {
  const runtimeConfig = options.runtimeConfig ?? getModelGatewayRuntimeConfig();
  const server = createModelGatewayHttpServer({
    runtimeConfig,
    application: options.application,
  });

  await new Promise<void>((resolve) => {
    server.listen(runtimeConfig.port, resolve);
  });

  return server;
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawText = Buffer.concat(chunks).toString("utf8").trim();
  if (rawText.length === 0) {
    return {};
  }

  try {
    return JSON.parse(rawText) as unknown;
  } catch {
    throw new ModelGatewayError({
      code: "INVALID_JSON_REQUEST",
      statusCode: 400,
      message: "请求体不是合法 JSON",
    });
  }
}

function readHeader(request: IncomingMessage, headerName: string): string | undefined {
  const value = request.headers[headerName];

  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return undefined;
}

function extractTraceId(request: IncomingMessage): string | undefined {
  const traceparent = readHeader(request, "traceparent");
  if (traceparent === undefined) {
    return undefined;
  }

  const matched = traceparent.match(/^[\da-f]{2}-([\da-f]{32})-[\da-f]{16}-[\da-f]{2}$/iu);
  return matched?.[1];
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.end(JSON.stringify(payload));
}
