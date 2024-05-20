import { getBunnyClient } from "@/bunnyClient/bunnyClient.js";
import { describe, it, expect, vi, beforeAll, inject } from "vitest";
import { purgeCache } from "@/actions/pullZone/purge/purgeCache.js";
import { RequestError, Options, type Got } from "got";

describe("purgeCache", () => {
  let client: Got;
  beforeAll(() => {
    const storageZoneEndpoint = inject("testServerUrl");
    client = getBunnyClient("test", storageZoneEndpoint);
  });
  it("should throw when an Error occurs", async () => {
    const postSpy = vi.spyOn(client, "post");
    postSpy.mockRejectedValueOnce(new Error("test"));

    await expect(() =>
      purgeCache({ client, pullZoneId: "test", replicationTimeout: 0 }),
    ).rejects.toThrow(new Error("test"));
  });

  it("should throw when an RequestError occurs", async () => {
    const postSpy = vi.spyOn(client, "post");
    postSpy.mockRejectedValueOnce(
      new RequestError("test error", {}, new Options()),
    );

    await expect(() =>
      purgeCache({ client, pullZoneId: "test", replicationTimeout: 0 }),
    ).rejects.toThrow(new RequestError("test error", {}, new Options()));
  });
});
