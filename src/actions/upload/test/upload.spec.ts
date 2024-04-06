import { describe, it, expect, vi, afterEach } from "vitest";
import { uploadDirectoryToStorageZone } from "@/actions/upload/uploadDirectory.js";
import * as upload from "@/actions/upload/uploadFile.js";
import { normalize, join } from "path";
import { getBunnyClient } from "@/bunnyClient.js";
import { readdir } from "node:fs/promises";
import { testUploadResultDirectory } from "@/testSetup/testServer.js";
import { removeSync } from "fs-extra";
import { testServerUrl } from "@/testSetup/globalTestSetup.js";
import { uploadFileHeaders } from "@/actions/upload/uploadFile.js";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const directoryToUpload = join(__dirname, "../test/test-dir-for-upload");
const targetDirectory = `test/upload-with-stream/${testUploadResultDirectory}/upload-with-stream`;
const storageZoneEndpoint = testServerUrl;
const bunnyClient = getBunnyClient("test", storageZoneEndpoint);
let concurrentUploads = 0;
let maxConcurrentUploads = 0;

describe("uploadDirectoryToStorageZone", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    const dirToDelete = join(__dirname, "../../../testSetup/result");
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

      await uploadDirectoryToStorageZone({
        client: bunnyClient,
        directoryToUpload,
        targetDirectory,
        concurrency,
        fileInfo: {
          unchangedFiles: new Set<string>(),
          unknownRemoteFiles: new Set<string>(),
        },
      });

      expect(maxConcurrentUploads).toBeLessThanOrEqual(concurrency);
    });
  });

  describe("Concurrency is set to 10", () => {
    const concurrency = 10;
    it("should attempt to upload all files in the directory", async () => {
      const putSpy = vi.spyOn(bunnyClient.stream, "put");

      await uploadDirectoryToStorageZone({
        client: bunnyClient,
        directoryToUpload,
        targetDirectory,
        concurrency,
        fileInfo: {
          unchangedFiles: new Set<string>(),
          unknownRemoteFiles: new Set<string>(),
        },
      });

      // Assuming there are 3 files in the directory
      expect(putSpy).toHaveBeenCalledTimes(3);
      const files = await readdir(
        join(__dirname, "../../../testSetup/result/upload-with-stream"),
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

    it("should throw when upload fails", async () => {
      await expect(() =>
        uploadDirectoryToStorageZone({
          client: bunnyClient,
          directoryToUpload,
          targetDirectory: "t" + targetDirectory,
          concurrency,
          fileInfo: {
            unchangedFiles: new Set<string>(),
            unknownRemoteFiles: new Set<string>(),
          },
        }),
      ).rejects.toThrow();
    });

    describe("When there are unchanged files", () => {
      const unchangedFiles = new Set([
        join(directoryToUpload, "test-file-for-upload.html"),
        join(
          directoryToUpload,
          "nested-test-dir",
          "second-nested-dir",
          "second-nested-file.html",
        ),
      ]);
      it("should upload only changed files", async () => {
        const putSpy = vi.spyOn(bunnyClient.stream, "put");

        await uploadDirectoryToStorageZone({
          client: bunnyClient,
          directoryToUpload,
          targetDirectory,
          concurrency,
          fileInfo: {
            unchangedFiles: unchangedFiles,
            unknownRemoteFiles: new Set<string>(),
          },
        });

        // There are in total 3 files in the directoryToUpload, 2 of those are unchanged.
        expect(putSpy).toHaveBeenCalledTimes(1);
        expect(putSpy).toHaveBeenCalledWith(
          `${targetDirectory}/nested-test-dir/nested-file.html`,
          uploadFileHeaders,
        );
      });
    });
  });
});
