import { describe, it, expect, beforeEach } from "vitest";
import {
  getFeatureFlags,
  getPullZoneConfig,
  getEdgeStorageConfig,
} from "@/config/config.js";
import {
  InvalidIntegerError,
  InvalidPathError,
  InvalidUrlProtocolError,
} from "@/errors.js";

describe("config", () => {
  describe("getFeatureFlags", () => {
    const testConfig = {
      "disable-type-validation": true,
      "enable-delete-action": false,
      "enable-purge-pull-zone": true,
      "enable-purge-only": false,
    };
    beforeEach(() => {
      Object.entries(testConfig).forEach(([key, value]) => {
        process.env[`INPUT_${key.toUpperCase()}`] = `${value}`;
      });
    });
    it("should return the correct feature flags based on input", async () => {
      const featureFlags = await getFeatureFlags();

      expect(featureFlags).toEqual({
        disableTypeValidation: true,
        enableDeleteAction: false,
        enablePurgePullZone: true,
        enablePurgeOnly: false,
      });
    });
  });

  describe("getPullZoneConfig", () => {
    const testConfig = {
      "access-key": "test-access-key",
      "pull-zone-id": "12345",
    };
    beforeEach(() => {
      Object.entries(testConfig).forEach(([key, value]) => {
        process.env[`INPUT_${key.toUpperCase()}`] = value;
      });
    });
    it("should return pull zone configuration without errors", async () => {
      const config = await getPullZoneConfig();

      expect(config).toEqual({
        pullZoneId: "12345",
        pullZoneClient: expect.anything(),
      });
    });

    describe("Missing required config", () => {
      it.each([["access-key"], ["pull-zone-id"]])(
        "should throw when configParam '%s' is missing",
        async (configParam: string) => {
          delete process.env[`INPUT_${configParam.toUpperCase()}`];

          await expect(() => getPullZoneConfig()).rejects.toThrow(
            new Error(`Input required and not supplied: ${configParam}`),
          );
        },
      );
    });
  });

  describe("getEdgeStorageConfig", () => {
    const testConfig = {
      "access-key": "test-access-key",
      "storage-zone-name": "test-zone",
      "target-directory": "test/target",
      "storage-endpoint": "https://example.com",
      concurrency: "5",
      "directory-to-upload": __dirname,
    };
    beforeEach(() => {
      Object.entries(testConfig).forEach(([key, value]) => {
        process.env[`INPUT_${key.toUpperCase()}`] = value;
      });
    });
    it("should return edge storage configuration without errors", async () => {
      const config = await getEdgeStorageConfig();

      expect(config).toEqual({
        concurrency: 5,
        directoryToUpload: __dirname,
        storageZoneName: "test-zone",
        targetDirectory: "test/target",
        edgeStorageClient: expect.anything(),
      });
    });

    it("should format a concurrency number to an int", async () => {
      process.env["INPUT_CONCURRENCY"] = "3.6";

      const config = await getEdgeStorageConfig();

      expect(config.concurrency).toBe(3);
    });

    describe("Missing required config", () => {
      it.each([
        ["access-key"],
        ["storage-endpoint"],
        ["concurrency"],
        ["directory-to-upload"],
        ["storage-zone-name"],
        ["target-directory"],
      ])(
        "should throw when configParam '%s' is missing",
        async (configParam: string) => {
          delete process.env[`INPUT_${configParam.toUpperCase()}`];

          await expect(() => getEdgeStorageConfig()).rejects.toThrow(
            new Error(`Input required and not supplied: ${configParam}`),
          );
        },
      );
    });

    describe("Invalid storage endpoint", () => {
      it("should throw", async () => {
        process.env["INPUT_STORAGE-ENDPOINT"] = "http://example.com";

        await expect(() => getEdgeStorageConfig()).rejects.toThrow(
          InvalidUrlProtocolError,
        );
      });
    });

    describe("Invalid concurrency", () => {
      it("should throw when concurrency is not a number", async () => {
        process.env["INPUT_CONCURRENCY"] = "test";

        await expect(() => getEdgeStorageConfig()).rejects.toThrow(
          InvalidIntegerError,
        );
      });

      it("should throw when concurrency is not a positive integer", async () => {
        process.env["INPUT_CONCURRENCY"] = "-1";

        await expect(() => getEdgeStorageConfig()).rejects.toThrow(
          InvalidIntegerError,
        );
      });
    });

    describe("Invalid directory to upload", () => {
      it("should throw when file path doesn't exists", async () => {
        process.env["INPUT_DIRECTORY-TO-UPLOAD"] = `${__dirname}-test`;

        await expect(() => getEdgeStorageConfig()).rejects.toThrow(Error);
      });

      it("should throw when file path exists, but is not a directory", async () => {
        process.env["INPUT_DIRECTORY-TO-UPLOAD"] = __filename;

        await expect(() => getEdgeStorageConfig()).rejects.toThrow(
          InvalidPathError,
        );
      });
    });
  });
});
