import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import test from "node:test";

import type { ModelGatewayRuntimeConfig } from "../config";
import { createModelGatewayHttpServer } from "./http-server";

test("HTTP 入口可列出模型并通过 OpenAI / Anthropic 完成非流式 chat completion", async () => {
  const openaiRequests: Array<{ authorization?: string; body: unknown }> = [];
  const anthropicRequests: Array<{ apiKey?: string; body: unknown }> = [];
  const openaiUpstream = await listen(createServer(async (request, response) => {
    if (request.url !== "/v1/chat/completions") {
      response.statusCode = 404;
      response.end();
      return;
    }

    openaiRequests.push({
      authorization: request.headers.authorization,
      body: await readJsonBody(request),
    });

    writeJson(response, 200, {
      id: "chatcmpl-openai-1",
      created: 1_711_111_111,
      model: "gpt-4.1-mini",
      choices: [
        {
          finish_reason: "stop",
          message: {
            content: "来自 OpenAI 的响应",
          },
        },
      ],
      usage: {
        prompt_tokens: 12,
        completion_tokens: 8,
        total_tokens: 20,
      },
    });
  }));
  const anthropicUpstream = await listen(createServer(async (request, response) => {
    if (request.url !== "/v1/messages") {
      response.statusCode = 404;
      response.end();
      return;
    }

    anthropicRequests.push({
      apiKey: readHeader(request, "x-api-key"),
      body: await readJsonBody(request),
    });

    writeJson(response, 200, {
      id: "msg-anthropic-1",
      model: "claude-3-5-sonnet-latest",
      stop_reason: "end_turn",
      content: [
        {
          type: "text",
          text: "来自 Anthropic 的响应",
        },
      ],
      usage: {
        input_tokens: 9,
        output_tokens: 6,
      },
    });
  }));

  const runtimeConfig: ModelGatewayRuntimeConfig = Object.freeze({
    port: 0,
    appEnv: "test",
    serviceName: "model-gateway",
    defaultTimeoutMs: 5_000,
    providers: Object.freeze([
      Object.freeze({
        id: "openai-default",
        provider: "openai",
        baseUrl: `${baseUrl(openaiUpstream)}/v1`,
        apiKey: "openai-secret",
        authType: "bearer",
        timeoutMs: 5_000,
        headers: Object.freeze({}),
      }),
      Object.freeze({
        id: "anthropic-default",
        provider: "anthropic",
        baseUrl: `${baseUrl(anthropicUpstream)}/v1`,
        apiKey: "anthropic-secret",
        authType: "x-api-key",
        timeoutMs: 5_000,
        headers: Object.freeze({}),
      }),
    ]),
    models: Object.freeze([
      Object.freeze({
        id: "gpt-4.1-mini",
        providerModel: "gpt-4.1-mini",
        providerInstance: "openai-default",
        type: "chat",
        displayName: "GPT 4.1 Mini",
        aliases: Object.freeze(["customer-support"]),
        capabilities: Object.freeze(["chat", "tools"]),
        scenarioTags: Object.freeze(["support"]),
        maxTokens: 8_192,
        status: "active",
        pricing: Object.freeze({
          inputPerMillionUsd: 0.4,
          outputPerMillionUsd: 1.6,
          currency: "USD",
        }),
      }),
      Object.freeze({
        id: "claude-3-5-sonnet",
        providerModel: "claude-3-5-sonnet-latest",
        providerInstance: "anthropic-default",
        type: "chat",
        displayName: "Claude 3.5 Sonnet",
        aliases: Object.freeze(["claude-sonnet"]),
        capabilities: Object.freeze(["chat"]),
        scenarioTags: Object.freeze(["analysis"]),
        maxTokens: 8_192,
        status: "active",
        pricing: Object.freeze({
          inputPerMillionUsd: 3,
          outputPerMillionUsd: 15,
          currency: "USD",
        }),
      }),
    ]),
    routes: Object.freeze([
      Object.freeze({
        id: "route-support-app",
        requestedModel: "support-assistant",
        targetModel: "gpt-4.1-mini",
        appIds: Object.freeze(["support-app"]),
        priority: 100,
      }),
    ]),
  });

  const gateway = await listen(createModelGatewayHttpServer({ runtimeConfig }));

  try {
    const listResponse = await fetch(`${baseUrl(gateway)}/v1/models`);
    assert.equal(listResponse.status, 200);
    const listPayload = (await listResponse.json()) as {
      object: string;
      data: Array<{ id: string }>;
    };
    assert.equal(listPayload.object, "list");
    assert.deepEqual(
      listPayload.data.map((item) => item.id),
      ["gpt-4.1-mini", "claude-3-5-sonnet"],
    );

    const openaiResponse = await fetch(`${baseUrl(gateway)}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-app-id": "support-app",
        "x-tenant-id": "tenant-a",
        "x-user-id": "user-1",
      },
      body: JSON.stringify({
        model: "support-assistant",
        system: "你是客服助理。",
        messages: [
          {
            role: "user",
            content: "帮我总结这个工单。",
          },
        ],
        metadata: {
          promptSource: "template",
          promptTemplateId: "support-summary",
          promptVersion: "v1",
        },
      }),
    });
    assert.equal(openaiResponse.status, 200);
    const openaiPayload = (await openaiResponse.json()) as {
      route: { provider: string; resolvedModel: string };
      choices: Array<{ message: { content: string } }>;
      usage: { totalTokens: number };
      trace: { requestId: string; traceId: string };
    };
    assert.equal(openaiPayload.route.provider, "openai");
    assert.equal(openaiPayload.route.resolvedModel, "gpt-4.1-mini");
    assert.equal(openaiPayload.choices[0]?.message.content, "来自 OpenAI 的响应");
    assert.equal(openaiPayload.usage.totalTokens, 20);
    assert.match(openaiPayload.trace.requestId, /^[a-f0-9]{24}$/u);
    assert.match(openaiPayload.trace.traceId, /^[a-f0-9]{32}$/u);

    const anthropicResponse = await fetch(`${baseUrl(gateway)}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-app-id": "analysis-app",
        "x-tenant-id": "tenant-a",
        "x-user-id": "user-2",
      },
      body: JSON.stringify({
        model: "claude-sonnet",
        messages: [
          {
            role: "user",
            content: "提炼三点风险。",
          },
        ],
      }),
    });
    assert.equal(anthropicResponse.status, 200);
    const anthropicPayload = (await anthropicResponse.json()) as {
      route: { provider: string; resolvedModel: string };
      choices: Array<{ message: { content: string } }>;
    };
    assert.equal(anthropicPayload.route.provider, "anthropic");
    assert.equal(anthropicPayload.route.resolvedModel, "claude-3-5-sonnet");
    assert.equal(anthropicPayload.choices[0]?.message.content, "来自 Anthropic 的响应");

    const notFoundResponse = await fetch(`${baseUrl(gateway)}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "missing-model",
        messages: [
          {
            role: "user",
            content: "hello",
          },
        ],
      }),
    });
    assert.equal(notFoundResponse.status, 404);
    const notFoundPayload = (await notFoundResponse.json()) as {
      error: { code: string };
    };
    assert.equal(notFoundPayload.error.code, "MODEL_NOT_FOUND");

    assert.equal(openaiRequests.length, 1);
    assert.equal(openaiRequests[0]?.authorization, "Bearer openai-secret");
    assert.equal(anthropicRequests.length, 1);
    assert.equal(anthropicRequests[0]?.apiKey, "anthropic-secret");
  } finally {
    await closeServer(gateway);
    await closeServer(openaiUpstream);
    await closeServer(anthropicUpstream);
  }
});

async function listen(server: Server): Promise<Server> {
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  return server;
}

function baseUrl(server: Server): string {
  const address = server.address();

  if (typeof address !== "object" || address === null) {
    throw new Error("server 未成功监听");
  }

  return `http://127.0.0.1:${address.port}`;
}

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error === undefined) {
        resolve();
        return;
      }

      reject(error);
    });
  });
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function readHeader(request: IncomingMessage, headerName: string): string | undefined {
  const value = request.headers[headerName];
  return typeof value === "string" ? value : undefined;
}
