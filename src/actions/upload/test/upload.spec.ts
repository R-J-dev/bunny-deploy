import { describe, it, expect, vi, afterEach } from "vitest";
import { uploadDirectoryToStorageZone } from "@/actions/upload/uploadDirectory.js";
import * as upload from "@/actions/upload/uploadFile.js";
import path, { normalize } from "path";
import { getBunnyClient } from "@/bunnyClient.js";
import { readdir } from "node:fs/promises";
import { testUploadResultDirectory } from "@/testSetup/testServer.js";
import * as actions from "@actions/core";
import { removeSync } from "fs-extra";
import { testServerUrl } from "@/testSetup/globalTestSetup.js";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const directoryToUpload = path.join(__dirname, "../test/test-dir-for-upload");
const targetDirectory = `test/upload-with-stream/${testUploadResultDirectory}/upload-with-stream`;
const storageZoneEndpoint = testServerUrl;
const bunnyClient = getBunnyClient("test", storageZoneEndpoint);
let concurrentUploads = 0;
let maxConcurrentUploads = 0;

describe("uploadDirectoryToStorageZone", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    const dirToDelete = path.join(__dirname, "../../../testSetup/result");
    removeSync(dirToDelete);
  });

  describe.each([[1], [2]])("Concurrency is set to %i", (concurrency) => {
    const uploadSpy = vi.spyOn(upload, "uploadFile");
    afterEach(() => {
      uploadSpy.mockRestore();
    });
    it(`should not upload more than ${concurrency} files concurrently`, async () => {
      concurrentUploads = 0;
      maxConcurrentUploads = 0;
      // Mock `uploadFile` to track concurrent uploads
      uploadSpy.mockImplementation(async () => {
        concurrentUploads++;
        maxConcurrentUploads = Math.max(
          maxConcurrentUploads,
          concurrentUploads,
        );
        // Simulate file upload delay
        await delay(500);
        concurrentUploads--;
      });

      await uploadDirectoryToStorageZone(
        bunnyClient,
        directoryToUpload,
        targetDirectory,
        concurrency,
      );

      expect(maxConcurrentUploads).toBeLessThanOrEqual(concurrency);
    });
  });

  describe("Concurrency is set to 10 (default)", () => {
    it("should attempt to upload all files in the directory", async () => {
      const putSpy = vi.spyOn(bunnyClient.stream, "put");

      await uploadDirectoryToStorageZone(
        bunnyClient,
        directoryToUpload,
        targetDirectory,
        10,
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
      const setFailedSpy = vi.spyOn(actions, "setFailed");

      await expect(() =>
        uploadDirectoryToStorageZone(
          bunnyClient,
          directoryToUpload,
          "t" + targetDirectory,
          10,
        ),
      ).rejects.toThrow();

      expect(setFailedSpy).toHaveBeenCalledTimes(1);
    });
  });
});
