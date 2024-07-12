import { uploadFile } from "@/actions/storageZone/upload/uploadFile.js";
import {
  getBunnyClient,
  retryErrorCodes,
  retryStatusCodes,
} from "@/bunnyClient/bunnyClient.js";
import {
  describe,
  it,
  vi,
  inject,
  beforeAll,
  beforeEach,
  expect,
} from "vitest";
import { type Got, HTTPError, RequestError, Options } from "got";

describe("uploadFile", () => {
  const filePath = __filename;
  let client: Got, retryLimit: number;
  const baseUploadPath = "test/retry-upload/";

  beforeAll(() => {
    const storageZoneEndpoint = inject("testServerUrl");
    client = getBunnyClient("test", storageZoneEndpoint);
    retryLimit = client.defaults.options.retry.limit ?? 0;
    if (!retryLimit) throw new Error("Invalid retry limit");
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe.each(retryStatusCodes.map((statusCode) => [statusCode]))(
    "When a %s error occurred",
    (statusCode) => {
      it("should throw after the retry limit", { timeout: 10000 }, async () => {
        const putSpy = vi.spyOn(client.stream, "put");

        // Need to test this with actual requests, to be sure that the Got package doesn't retry instead of pRetry
        await expect(
          uploadFile(client, `${baseUploadPath}${statusCode}`, filePath),
        ).rejects.toThrow(HTTPError);

        expect(putSpy).toHaveBeenCalledTimes(retryLimit + 1); // The three retries in combination with the initial call
      });
    },
  );

  describe("When a 400 error occurred", () => {
    it("should throw and not retry to upload the file again", async () => {
      const putSpy = vi.spyOn(client.stream, "put");

      await expect(
        uploadFile(client, `${baseUploadPath}400`, filePath),
      ).rejects.toThrow(HTTPError);

      expect(putSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("When the upload was successful", () => {
    it("should not retry to upload the file again", async () => {
      const putSpy = vi.spyOn(client.stream, "put");

      await expect(
        uploadFile(client, `${baseUploadPath}200`, filePath),
      ).resolves.toBeUndefined();

      expect(putSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe.each(retryErrorCodes.map((errorCode) => [errorCode]))(
    "When an %s error occurred",
    (errorCode) => {
      it("should throw after the retry limit", { timeout: 10000 }, async () => {
        const putSpy = vi
          .spyOn(client.stream, "put")
          .mockRejectedValue(
            new RequestError(errorCode, { code: errorCode }, {} as Options),
          );

        await expect(uploadFile(client, `test`, filePath)).rejects.toThrow(
          RequestError,
        );

        expect(putSpy).toHaveBeenCalledTimes(retryLimit + 1); // The three retries in combination with the initial call
      });
    },
  );

  describe("When an unretryable error occurred", () => {
    it("should throw and not retry to upload the file again", async () => {
      const putSpy = vi
        .spyOn(client.stream, "put")
        .mockRejectedValue(
          new RequestError(
            "unretryableError",
            { code: "unretryableError" },
            {} as Options,
          ),
        );

      await expect(uploadFile(client, `test`, filePath)).rejects.toThrow(
        RequestError,
      );

      expect(putSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("When a generic error occurred", () => {
    it("should throw and not retry to upload the file again", async () => {
      const putSpy = vi
        .spyOn(client.stream, "put")
        .mockRejectedValue(new Error("Generic test error"));

      await expect(uploadFile(client, `test`, filePath)).rejects.toThrow(Error);

      expect(putSpy).toHaveBeenCalledTimes(1);
    });
  });
});
