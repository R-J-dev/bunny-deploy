import { describe, it, expect, vi, afterEach } from "vitest";
import { uploadDirectoryToStorageZone } from "@/actions/upload/upload.js";
import path, { normalize } from "path";
import { getBunnyClient } from "@/bunnyClient.js";
import { readdir } from "node:fs/promises";
import { testUploadResultDirectory } from "@/testSetup/testServer.js";
import * as actions from "@actions/core";

describe("uploadDirectoryToStorageZone", () => {
  const directoryToUpload = path.join(__dirname, "../test/test-dir-for-upload");
  const targetDirectory = `test/upload-with-stream/${testUploadResultDirectory}/upload-with-stream`;
  const storageZoneEndpoint = "http://localhost:8000";
  const bunnyClient = getBunnyClient("test");
  const putSpy = vi.spyOn(bunnyClient.stream, "put");
  const setFailedSpy = vi.spyOn(actions, "setFailed");

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should attempt to upload all files in the directory", async () => {
    await uploadDirectoryToStorageZone(
      bunnyClient,
      directoryToUpload,
      targetDirectory,
      storageZoneEndpoint,
    );

    // Assuming there are 3 files in the directory
    expect(putSpy).toHaveBeenCalledTimes(3);
    const files = await readdir(
      path.join(__dirname, "../../../testSetup/result/upload-with-stream"),
      {
        encoding: "utf8",
        recursive: true,
      },
    );
    expect(files.length).toBe(5);
    expect(files).toContain("test-file-for-upload.html");
    expect(files).toContain(normalize("nested-test-dir/nested-file.html"));
    expect(files).toContain(
      normalize("nested-test-dir/second-nested-dir/second-nested-file.html"),
    );
  });

  it("should set action to failed when upload fails", async () => {
    await expect(() =>
      uploadDirectoryToStorageZone(
        bunnyClient,
        directoryToUpload,
        "t" + targetDirectory,
        storageZoneEndpoint,
      ),
    ).rejects.toThrow();

    expect(setFailedSpy).toHaveBeenCalledTimes(1);
  });
});
