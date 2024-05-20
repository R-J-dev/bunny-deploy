import {
  describe,
  it,
  expect,
  beforeAll,
  afterEach,
  vi,
  afterAll,
} from "vitest";
import {
  getBunnyClient,
  retryMethods,
  retryStatusCodes,
} from "@/bunnyClient/bunnyClient.js";
import { HTTPError, type Got, Method } from "got";
import nock from "nock";
import { MissingAccessKeyError } from "@/errors.js";

describe("getBunnyClient", () => {
  let client: Got;
  const eachStatusCodeParams = retryStatusCodes.map((code) => [code]);
  const methodsNotToRetry: Method[] = ["POST", "PUT"];
  const eachMethodNotToRetry: Method[][] = methodsNotToRetry.map((method) => [
    method,
  ]);
  const eachMethodParams = retryMethods.map((method) => [method]);
  const baseUrl = "http://localhost";
  let retryCalls = 0;

  const mockReply = (uri: string) => {
    retryCalls++;
    const url = new URL(uri, baseUrl);
    const status = parseInt(url.searchParams.get("status") ?? "500");
    return [status, { data: `mock data for status ${status}` }];
  };

  beforeAll(() => {
    client = getBunnyClient("test", baseUrl);

    [...retryMethods, ...methodsNotToRetry].forEach((method) =>
      nock(baseUrl)
        .persist()
        .intercept(/test-retry/, method)
        .query(true)
        .reply(mockReply),
    );
  });

  afterAll(() => {
    nock.cleanAll();
    nock.restore();
  });

  afterEach(() => {
    retryCalls = 0;
    vi.restoreAllMocks();
  });

  describe.each(eachMethodParams)("%s requests", (method) => {
    it.each(eachStatusCodeParams)(
      "should retry 3 times on status code %s",
      async (statusCode) => {
        await expect(() =>
          client(`test-retry`, {
            method,
            searchParams: { status: statusCode },
            retry: { backoffLimit: 1 },
          }),
        ).rejects.toThrow(HTTPError);
        expect(retryCalls).toBe(4); // Initial + 3 retries
      },
    );

    // It shouldn't retry on more status codes,
    // but these are probably the ones that would occur more often than others.
    it.each([[400], [401], [403]])(
      "should not retry when status code is %s",
      async (statusCode) => {
        await expect(() =>
          client(`test-retry`, {
            method,
            searchParams: { status: statusCode },
          }),
        ).rejects.toThrow(HTTPError);
        expect(retryCalls).toBe(1);
      },
    );
  });

  describe.each(eachMethodNotToRetry)("%s requests", (method) => {
    it("should not retry", async () => {
      await expect(() =>
        client(`test-retry`, {
          method,
          searchParams: { status: retryStatusCodes[0] },
        }),
      ).rejects.toThrow(HTTPError);
      expect(retryCalls).toBe(1);
    });
  });

  describe("when accessKey is missing", () => {
    it("should throw a MissingAccessKeyError", () => {
      expect(() => getBunnyClient("", baseUrl)).toThrow(MissingAccessKeyError);
    });
  });
});
