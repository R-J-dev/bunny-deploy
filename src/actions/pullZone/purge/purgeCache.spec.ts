import { getBunnyClient } from "@/bunnyClient.js";
import { testServerUrl } from "@/testSetup/globalTestSetup.js";
import { describe, it, expect, vi } from "vitest";
import { purgeCache } from "@/actions/pullZone/purge/purgeCache.js";
import { RequestError, Options } from "got";

describe("purgeCache", () => {
  it("should throw when an Error occurs", async () => {
    const client = getBunnyClient("test", testServerUrl);
    const postSpy = vi.spyOn(client, "post");
    postSpy.mockRejectedValueOnce(new Error("test"));

    await expect(() =>
      purgeCache({ client, pullZoneId: "test", replicationTimeout: 0 }),
    ).rejects.toThrow(new Error("test"));
  });

  it("should throw when an RequestError occurs", async () => {
    const client = getBunnyClient("test", testServerUrl);
    const postSpy = vi.spyOn(client, "post");
    postSpy.mockRejectedValueOnce(
      new RequestError("test error", {}, new Options()),
    );

    await expect(() =>
      purgeCache({ client, pullZoneId: "test", replicationTimeout: 0 }),
    ).rejects.toThrow(new RequestError("test error", {}, new Options()));
  });
});
