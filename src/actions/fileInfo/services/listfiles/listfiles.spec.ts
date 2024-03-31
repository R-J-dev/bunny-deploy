import { listFiles } from "@/actions/fileInfo/services/listfiles/listFiles.js";
import { getBunnyClient } from "@/bunnyClient.js";
import { testServerUrl } from "@/testSetup/globalTestSetup.js";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ZodError } from "zod";

describe("listFiles", () => {
  const storageZoneEndpoint = testServerUrl;
  const bunnyClient = getBunnyClient("test", storageZoneEndpoint);

  afterEach(() => {
    vi.restoreAllMocks();
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
});
