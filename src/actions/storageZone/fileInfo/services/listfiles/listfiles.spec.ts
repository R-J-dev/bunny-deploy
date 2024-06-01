import {
  listFiles,
  listFilesRequestOptions,
} from "@/actions/storageZone/fileInfo/services/listfiles/listFiles.js";
import { getBunnyClient } from "@/bunnyClient/bunnyClient.js";
import type { Got } from "got";
import { describe, it, expect, vi, afterEach, inject, beforeAll } from "vitest";
import { ZodError } from "zod";

describe("listFiles", () => {
  let bunnyClient: Got;
  const defaultGetMockResponse = {
    Guid: "test",
    StorageZoneName: "test",
    Path: "test",
    ObjectName: "test",
    Length: 1,
    LastChanged: "test",
    ServerId: 1,
    ArrayNumber: 0,
    IsDirectory: false,
    UserId: "test",
    ContentType: "test",
    DateCreated: "test",
    StorageZoneId: 123,
    Checksum: "test",
    ReplicatedZones: "test",
  };

  beforeAll(() => {
    const storageZoneEndpoint = inject("testServerUrl");
    bunnyClient = getBunnyClient("test", storageZoneEndpoint);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("when path has a leading slash", () => {
    it("should remove the leading slash", async () => {
      const getSpy = vi.spyOn(bunnyClient, "get");
      getSpy.mockResolvedValueOnce([defaultGetMockResponse]);

      await listFiles({
        client: bunnyClient,
        path: "/test/testen/",
        disableTypeValidation: false,
      });

      expect(getSpy).toHaveBeenCalledWith(
        "test/testen/",
        listFilesRequestOptions,
      );
    });
  });

  describe("when path doesn't has a leading slash", () => {
    it("should not remove the first character", async () => {
      const getSpy = vi.spyOn(bunnyClient, "get");
      getSpy.mockResolvedValueOnce([defaultGetMockResponse]);

      await listFiles({
        client: bunnyClient,
        path: "test/testen/",
        disableTypeValidation: false,
      });

      expect(getSpy).toHaveBeenCalledWith(
        "test/testen/",
        listFilesRequestOptions,
      );
    });
  });

  describe("response type is invalid", () => {
    describe("when type validation is disabled", () => {
      it("should return the request response without runtime type validation", async () => {
        const getSpy = vi.spyOn(bunnyClient, "get");
        getSpy.mockResolvedValueOnce({ test: "invalid response type" });

        await expect(
          listFiles({
            client: bunnyClient,
            path: "test",
            disableTypeValidation: true,
          }),
        ).resolves.toStrictEqual({ test: "invalid response type" });
      });
    });

    describe("when type validation is enabled", () => {
      it("should throw a type validation error", async () => {
        const getSpy = vi.spyOn(bunnyClient, "get");
        getSpy.mockResolvedValueOnce({ test: "invalid response type" });

        await expect(() =>
          listFiles({
            client: bunnyClient,
            path: "test",
            disableTypeValidation: false,
          }),
        ).rejects.toThrow(ZodError);
      });
    });
  });

  describe("response type is valid", () => {
    describe("when type validation is enabled and the response contains an unknown extra attribute", () => {
      it("should not throw", async () => {
        const getSpy = vi.spyOn(bunnyClient, "get");
        getSpy.mockResolvedValueOnce([
          { ...defaultGetMockResponse, unknownAttribute: "test" },
        ]);

        await expect(
          listFiles({
            client: bunnyClient,
            path: "/test/testen/",
            disableTypeValidation: false,
          }),
        ).resolves.toStrictEqual([defaultGetMockResponse]);
      });
    });
  });
});
