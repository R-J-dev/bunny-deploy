import { describe, it, expect, beforeEach, afterEach } from "vitest";
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
import { join } from "path";

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
      "replication-timeout": "0",
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
        replicationTimeout: 0,
        storageZoneName: "test-zone",
        targetDirectory: "test/target",
        edgeStorageClient: expect.anything(),
      });
    });

    it("should format a concurrency to an int", async () => {
      process.env["INPUT_CONCURRENCY"] = "3.6";

      const config = await getEdgeStorageConfig();

      expect(config.concurrency).toBe(3);
    });

    it("should format replication-timeout to an int", async () => {
      process.env["INPUT_REPLICATION-TIMEOUT"] = "20.6";

      const config = await getEdgeStorageConfig();

      expect(config.replicationTimeout).toBe(20);
    });

    describe("Missing required config", () => {
      it.each([
        ["access-key"],
        ["storage-endpoint"],
        ["concurrency"],
        ["directory-to-upload"],
        ["storage-zone-name"],
        ["target-directory"],
        ["replication-timeout"],
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

    describe("Invalid replication-timeout", () => {
      it("should throw when replication-timeout is not a number", async () => {
        process.env["INPUT_REPLICATION-TIMEOUT"] = "test";

        await expect(() => getEdgeStorageConfig()).rejects.toThrow(
          InvalidIntegerError,
        );
      });
    });

    describe("Directory to upload is relative", () => {
      const original_github_workspace = process.env.GITHUB_WORKSPACE;
      afterEach(() => {
        process.env.GITHUB_WORKSPACE = original_github_workspace;
      });

      it("should create an absolute path", async () => {
        process.env.GITHUB_WORKSPACE = join(__dirname, "..");
        process.env["INPUT_DIRECTORY-TO-UPLOAD"] = "config";
        const config = await getEdgeStorageConfig();

        expect(config.directoryToUpload).toBe(__dirname);
      });

      it("should throw when GITHUB_WORKSPACE is undefined", async () => {
        delete process.env.GITHUB_WORKSPACE;
        process.env["INPUT_DIRECTORY-TO-UPLOAD"] = `test`;

        await expect(() => getEdgeStorageConfig()).rejects.toThrow(Error);
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