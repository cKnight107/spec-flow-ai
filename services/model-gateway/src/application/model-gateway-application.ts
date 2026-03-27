import type { PromptSource, TelemetryContextInput } from "@enterprise-ai-hub/telemetry-sdk";

import { InstrumentedModelInvocationError, invokeModelWithTelemetry } from "../observability";
import type {
  ChatCompletionRequest,
  ChatCompletionSuccessResponse,
  ListModelsResponse,
  RegisteredModelSummary,
} from "../dto/protocol";
import { ModelGatewayError, toModelGatewayError } from "../domain/errors";
import type { ModelGatewayRuntimeConfig } from "../domain/types";
import { ModelRouteResolver } from "../policies/route-resolver";
import { ModelProviderRegistry } from "../providers/provider-registry";

type ChatCompletionExecutionContext = Readonly<{
  telemetry: TelemetryContextInput;
}>;

export class ModelGatewayApplication {
  private readonly routeResolver: ModelRouteResolver;

  public constructor(
    private readonly runtimeConfig: ModelGatewayRuntimeConfig,
    private readonly providerRegistry: ModelProviderRegistry,
  ) {
    this.routeResolver = new ModelRouteResolver(runtimeConfig);
  }

  public listModels(): ListModelsResponse {
    const data: RegisteredModelSummary[] = this.routeResolver.listModels().map((item) => {
      const providerInstance = this.runtimeConfig.providers.find(
        (provider) => provider.id === item.providerInstance,
      );

      return Object.freeze({
        id: item.id,
        displayName: item.displayName ?? item.id,
        provider: providerInstance?.provider ?? "unknown",
        providerInstance: item.providerInstance,
        type: item.type,
        aliases: item.aliases ?? Object.freeze([]),
        capabilities: item.capabilities ?? Object.freeze([]),
        scenarioTags: item.scenarioTags ?? Object.freeze([]),
        maxTokens: item.maxTokens,
      });
    });

    return Object.freeze({
      object: "list",
      data: Object.freeze(data),
    });
  }

  public async chatCompletion(
    request: ChatCompletionRequest,
    context: ChatCompletionExecutionContext,
  ): Promise<ChatCompletionSuccessResponse> {
    if (request.stream === true) {
      throw new ModelGatewayError({
        code: "UNSUPPORTED_STREAM",
        statusCode: 400,
        message: "P0 基础版暂不支持 stream=true，请改用非流式调用",
      });
    }

    const tenantId = request.quotaSubject?.tenantId ?? context.telemetry.tenantId;
    const appId = request.quotaSubject?.appId ?? context.telemetry.appId;
    const resolvedRoute = this.routeResolver.resolve({
      requestedModel: request.model,
      tenantId,
      appId,
      routeHints: request.routeHints,
    });
    const timeoutMs =
      request.maxTokens === undefined
        ? resolvedRoute.resolvedModel.timeoutMs ??
          resolvedRoute.providerInstance.timeoutMs ??
          this.runtimeConfig.defaultTimeoutMs
        : resolvedRoute.resolvedModel.timeoutMs ??
          resolvedRoute.providerInstance.timeoutMs ??
          this.runtimeConfig.defaultTimeoutMs;
    const promptMetadata = extractPromptMetadata(request.metadata);

    try {
      const result = await invokeModelWithTelemetry({
        request: {
          context: context.telemetry,
          provider: resolvedRoute.providerInstance.provider,
          model: resolvedRoute.resolvedModel.id,
          modelEndpoint: resolvedRoute.providerInstance.baseUrl,
          operation: "chat.completion",
          prompt: {
            text: renderPromptText(request),
            source: promptMetadata.source,
            templateId: promptMetadata.templateId,
            version: promptMetadata.version,
          },
          settings: {
            temperature: request.temperature,
            maxTokens: request.maxTokens,
          },
        },
        invoke: async () => {
          const providerResponse = await this.providerRegistry.chatCompletion({
            providerInstance: resolvedRoute.providerInstance,
            model: resolvedRoute.resolvedModel,
            request,
            timeoutMs,
          });

          return {
            providerResponse,
            responseText: providerResponse.message.content,
            finishReason: providerResponse.finishReason,
            usage: providerResponse.usage,
            cost: calculateCost(
              providerResponse.usage,
              resolvedRoute.resolvedModel.pricing?.inputPerMillionUsd ?? 0,
              resolvedRoute.resolvedModel.pricing?.outputPerMillionUsd ?? 0,
            ),
            httpStatusCode: providerResponse.httpStatusCode,
          };
        },
      });

      return Object.freeze({
        id: result.providerResponse.id,
        object: "chat.completion",
        created: result.providerResponse.created,
        model: resolvedRoute.resolvedModel.id,
        choices: Object.freeze([
          Object.freeze({
            index: 0,
            message: result.providerResponse.message,
            finishReason: result.providerResponse.finishReason,
          }),
        ]),
        usage: result.usage,
        cost: result.cost,
        audit: Object.freeze({
          auditId: result.audit.record.auditId,
          status: "success" as const,
        }),
        trace: result.trace,
        route: Object.freeze({
          provider: resolvedRoute.providerInstance.provider,
          providerInstance: resolvedRoute.providerInstance.id,
          requestedModel: request.model,
          resolvedModel: resolvedRoute.resolvedModel.id,
        }),
      });
    } catch (error) {
      if (error instanceof InstrumentedModelInvocationError) {
        const mappedError = toModelGatewayError(error.cause ?? error);
        throw new ModelGatewayError({
          code: mappedError.code,
          statusCode: mappedError.statusCode,
          message: mappedError.message,
          retryable: mappedError.retryable,
          traceId: error.traceId,
          requestId: error.requestId,
          auditId: error.auditId,
          cause: error,
        });
      }

      throw toModelGatewayError(error);
    }
  }
}

function renderPromptText(request: ChatCompletionRequest): string {
  const lines: string[] = [];

  if (request.system !== undefined) {
    lines.push(`[system]\n${request.system}`);
  }

  for (const message of request.messages) {
    lines.push(`[${message.role}]${message.name === undefined ? "" : `(${message.name})`}\n${message.content}`);
  }

  if (request.tools !== undefined && request.tools.length > 0) {
    lines.push(`[tools]\n${request.tools.map((tool) => tool.function.name).join(", ")}`);
  }

  return lines.join("\n\n");
}

function extractPromptMetadata(
  metadata: Readonly<Record<string, unknown>> | undefined,
): Readonly<{
  source: PromptSource;
  templateId?: string;
  version?: string;
}> {
  const sourceValue = typeof metadata?.promptSource === "string" ? metadata.promptSource : "inline";
  const source: PromptSource =
    sourceValue === "template" ||
    sourceValue === "inline" ||
    sourceValue === "system-generated" ||
    sourceValue === "fallback"
      ? sourceValue
      : "inline";

  return Object.freeze({
    source,
    templateId: typeof metadata?.promptTemplateId === "string" ? metadata.promptTemplateId : undefined,
    version: typeof metadata?.promptVersion === "string" ? metadata.promptVersion : undefined,
  });
}

function calculateCost(
  usage: Readonly<{
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  }>,
  inputPerMillionUsd: number,
  outputPerMillionUsd: number,
): Readonly<{ estimatedUsd: number }> {
  const estimatedUsd =
    (usage.inputTokens * inputPerMillionUsd) / 1_000_000 +
    (usage.outputTokens * outputPerMillionUsd) / 1_000_000;

  return Object.freeze({
    estimatedUsd: Number(estimatedUsd.toFixed(8)),
  });
}
