import {
  describe,
  it,
  vi,
  expect,
  beforeEach,
  MockInstance,
  afterEach,
} from "vitest";
import { run } from "@/main.js";
import * as configModule from "@/config/config.js";
import * as uploadModule from "@/actions/storageZone/upload/uploadDirectory.js";
import * as deleteModule from "@/actions/storageZone/delete/delete.js";
import * as purgeModule from "@/actions/pullZone/purge/purgeCache.js";
import * as fileInfoModule from "@/actions/storageZone/fileInfo/fileInfo.js";
import { setFailed } from "@actions/core";

vi.mock("@actions/core");
vi.mock("@/config/config.js");
vi.mock("@/actions/storageZone/upload/uploadDirectory.js");
vi.mock("@/actions/storageZone/delete/delete.js");
vi.mock("@/actions/storageZone/fileInfo/fileInfo.js");
vi.mock("@/actions/pullZone/purge/purgeCache.js");

describe("main", () => {
  let purgeSpy: MockInstance,
    uploadSpy: MockInstance,
    deleteSpy: MockInstance,
    fileInfoSpy: MockInstance,
    getFeatureFlagsSpy: MockInstance,
    getEdgeStorageConfigSpy: MockInstance,
    getPullZoneConfigSpy: MockInstance;
  beforeEach(() => {
    purgeSpy = vi.spyOn(purgeModule, "purgeCache");
    uploadSpy = vi.spyOn(uploadModule, "uploadDirectoryToStorageZone");
    deleteSpy = vi.spyOn(deleteModule, "deleteFiles");
    fileInfoSpy = vi.spyOn(fileInfoModule, "getFileInfo");
    getFeatureFlagsSpy = vi.spyOn(configModule, "getFeatureFlags");
    getEdgeStorageConfigSpy = vi.spyOn(configModule, "getEdgeStorageConfig");
    getPullZoneConfigSpy = vi.spyOn(configModule, "getPullZoneConfig");

    getEdgeStorageConfigSpy.mockResolvedValueOnce({
      concurrency: 50,
      directoryToUpload: "",
      edgeStorageClient: vi.fn(),
      storageZoneName: "",
      targetDirectory: "",
    });
    getPullZoneConfigSpy.mockResolvedValueOnce({
      pullZoneClient: vi.fn(),
      pullZoneId: 12345,
      replicationTimeout: 15000,
    });
    fileInfoSpy.mockResolvedValue({
      unknownRemoteFiles: new Set<string>(),
      unchangedFiles: new Set<string>(),
    });
  });
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("when all storage zone actions are disabled and enable-purge-pull-zone is true", () => {
    it("should purge only and not perform other actions", async () => {
      getFeatureFlagsSpy.mockResolvedValue({
        disableUpload: true,
        enableDeleteAction: false,
        enablePurgePullZone: true,
        disableTypeValidation: false,
      });
      purgeSpy.mockResolvedValueOnce(undefined);

      await run();

      expect(purgeSpy).toHaveBeenCalledOnce();
      expect(uploadSpy).not.toHaveBeenCalled();
      expect(deleteSpy).not.toHaveBeenCalled();
      expect(getEdgeStorageConfigSpy).not.toHaveBeenCalled();
    });
  });

  describe("when all feature flags are false", () => {
    it("should only upload the given directory to the storage zone", async () => {
      getFeatureFlagsSpy.mockResolvedValue({
        disableUpload: false,
        enableDeleteAction: false,
        enablePurgePullZone: false,
        disableTypeValidation: false,
      });
      uploadSpy.mockResolvedValueOnce(undefined);

      await run();

      expect(uploadSpy).toHaveBeenCalledOnce();
      expect(purgeSpy).not.toHaveBeenCalled();
      expect(deleteSpy).not.toHaveBeenCalled();
    });
  });

  describe("when all feature flags except disableUpload are true", () => {
    it("should delete, upload and purge", async () => {
      getFeatureFlagsSpy.mockResolvedValue({
        disableUpload: false,
        enableDeleteAction: true,
        enablePurgePullZone: true,
        disableTypeValidation: true,
      });
      deleteSpy.mockResolvedValueOnce(undefined);
      uploadSpy.mockResolvedValueOnce(undefined);
      purgeSpy.mockResolvedValueOnce(undefined);
      fileInfoSpy.mockResolvedValueOnce({
        unknownRemoteFiles: new Set<string>(["test"]),
        unchangedFiles: new Set<string>(),
      });

      await run();

      expect(deleteSpy).toHaveBeenCalledOnce();
      expect(uploadSpy).toHaveBeenCalledOnce();
      expect(purgeSpy).toHaveBeenCalledOnce();
    });
  });

  describe("when enableDeleteAction is true", () => {
    it("should delete unknown files and upload the given directory to the storage zone", async () => {
      getFeatureFlagsSpy.mockResolvedValue({
        disableUpload: false,
        enableDeleteAction: true,
        enablePurgePullZone: false,
        disableTypeValidation: false,
      });
      deleteSpy.mockResolvedValueOnce(undefined);
      uploadSpy.mockResolvedValueOnce(undefined);
      fileInfoSpy.mockResolvedValueOnce({
        unknownRemoteFiles: new Set<string>(["test"]),
        unchangedFiles: new Set<string>(),
      });

      await run();

      expect(deleteSpy).toHaveBeenCalledOnce();
      expect(uploadSpy).toHaveBeenCalledOnce();
      expect(purgeSpy).not.toHaveBeenCalled();
    });
  });

  describe("when enablePurgePullZone is true", () => {
    it("should upload the given directory to the storage zone and purge the cache after the upload", async () => {
      getFeatureFlagsSpy.mockResolvedValue({
        disableUpload: false,
        enableDeleteAction: false,
        enablePurgePullZone: true,
        disableTypeValidation: false,
      });
      purgeSpy.mockResolvedValueOnce(undefined);
      uploadSpy.mockResolvedValueOnce(undefined);

      await run();

      const uploadCallOrder = uploadSpy.mock.invocationCallOrder[0];
      const purgeCallOrder = purgeSpy.mock.invocationCallOrder[0];
      expect(uploadCallOrder).toBeLessThan(purgeCallOrder);
    });
  });

  describe("when an error occurs", () => {
    it("should call setFailed with the error that has occurred", async () => {
      const error = new Error("test error");
      vi.spyOn(configModule, "getFeatureFlags").mockRejectedValueOnce(error);

      await run();

      expect(setFailed).toHaveBeenCalledWith(error);
    });
  });
});
