import { startModelGatewayHttpServer } from "./controllers/http-server";

async function main(): Promise<void> {
  const server = await startModelGatewayHttpServer();
  const address = server.address();
  const displayAddress =
    typeof address === "object" && address !== null
      ? `http://127.0.0.1:${address.port}`
      : "http://127.0.0.1";

  process.stdout.write(`model-gateway listening on ${displayAddress}\n`);
}

void main();
