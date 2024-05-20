import getPort from "get-port";
import type { GlobalSetupContext } from "vitest/node";
import {
  deleteTestUploads,
  isServerUp,
  startTestServer,
} from "@/testSetup/testServer.js";

const waitUntilTestServerIsUp = async (port: number) => {
  const maxRetries = 10;
  let retries = 0;
  while (retries < maxRetries) {
    if (await isServerUp(port)) {
      console.log("Test server is up!");
      break;
    } else {
      console.log(`Waiting for test server (attempt ${retries + 1})...`);
      retries++;
      await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for 0,5 seconds
    }
  }

  if (retries === maxRetries) {
    throw new Error("Test server did not start within the expected time.");
  }
};

declare module "vitest" {
  interface ProvidedContext {
    testServerUrl: string;
  }
}

let testServer: ReturnType<typeof startTestServer> | undefined = undefined;

export const setup = async ({ provide }: GlobalSetupContext) => {
  const port = await getPort({ host: "localhost" });
  const testServerUrl = `http://localhost:${port}`;
  provide("testServerUrl", testServerUrl);
  testServer = startTestServer(port);

  await waitUntilTestServerIsUp(port);
};

export const teardown = async () => {
  if (testServer) {
    testServer.close(() => {
      console.log("Test server closed.");
    });
    deleteTestUploads();
  }
};
