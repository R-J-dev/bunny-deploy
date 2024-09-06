import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getFeatureFlags,
  getPullZoneConfig,
  getEdgeStorageConfig,
} from "@/config/config.js";
import {
  InvalidIntegerError,
  InvalidDigitStringError,
  InvalidPathError,
  InvalidUrlProtocolError,
  InvalidStorageZoneNameError,
} from "@/errors.js";
import { join } from "path";
import fc from "fast-check";

describe("config", () => {
  describe("getFeatureFlags", () => {
    const testConfig = {
      "disable-type-validation": true,
      "enable-delete-action": false,
      "enable-purge-pull-zone": true,
      "disable-upload": false,
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
        disableUpload: false,
      });
    });
  });

  describe("getPullZoneConfig", () => {
    const testConfig = {
      "access-key": "test-access-key",
      "pull-zone-id": "12345",
      "replication-timeout": "0",
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        pullZoneClient: expect.anything(),
        replicationTimeout: 0,
      });
    });

    it("should format replication-timeout to a number", async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer(), async (timeout) => {
          process.env["INPUT_REPLICATION-TIMEOUT"] = timeout.toString();

          const config = await getPullZoneConfig();

          expect(config.replicationTimeout).toBe(timeout);
        }),
      );
    });

    it("should allow a digit string as a pull zone id", async () => {
      await fc.assert(
        fc.asyncProperty(fc.nat(), async (pullZoneID) => {
          process.env["INPUT_PULL-ZONE-ID"] = pullZoneID.toString();

          await getPullZoneConfig();
        }),
      );
    });

    describe("Missing required config", () => {
      it.each([["access-key"], ["pull-zone-id"], ["replication-timeout"]])(
        "should throw when configParam '%s' is missing",
        async (configParam: string) => {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- Test will fail when this goes wrong, so it's not really an issue here.
          delete process.env[`INPUT_${configParam.toUpperCase()}`];

          await expect(() => getPullZoneConfig()).rejects.toThrow(
            new Error(`Input required and not supplied: ${configParam}`),
          );
        },
      );
    });

    describe("Invalid replication-timeout", () => {
      it("should throw when replication-timeout is a string which is not an integer", async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string().filter((s) => isNaN(Number(s))),
            async (invalidTimeout) => {
              process.env["INPUT_REPLICATION-TIMEOUT"] = invalidTimeout;

              await expect(() => getPullZoneConfig()).rejects.toThrow(
                InvalidIntegerError,
              );
            },
          ),
        );
      });

      it("should throw when replication-timeout is a number with decimals", async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.double({ noInteger: true }),
            async (invalidTimeout) => {
              process.env["INPUT_REPLICATION-TIMEOUT"] =
                invalidTimeout.toString();

              await expect(() => getPullZoneConfig()).rejects.toThrow(
                InvalidIntegerError,
              );
            },
          ),
        );
      });
    });

    describe("Invalid pull-zone-id", () => {
      it("should throw when the pull-zone-id has a leading slash", async () => {
        process.env["INPUT_PULL-ZONE-ID"] = "/1234";

        await expect(() => getPullZoneConfig()).rejects.toThrow(
          InvalidDigitStringError,
        );
      });

      it("should throw when the pull-zone-id contains decimals", async () => {
        process.env["INPUT_PULL-ZONE-ID"] = "1234.56";

        await expect(() => getPullZoneConfig()).rejects.toThrow(
          InvalidDigitStringError,
        );
      });

      it("should not allow strings which has any non digit character", async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.stringMatching(/^.*[^\d].*$/), // Generates only strings that has at least a non digit character
            async (invalidPullZoneID) => {
              process.env["INPUT_PULL-ZONE-ID"] = invalidPullZoneID;

              await expect(() => getPullZoneConfig()).rejects.toThrow(
                InvalidDigitStringError,
              );
            },
          ),
        );
      });
    });
  });

  describe("getEdgeStorageConfig", () => {
    const testConfig = {
      "storage-zone-password": "test-storage-zone-password",
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

    describe("target-directory", () => {
      describe("starts with a slash", () => {
        it("should remove the leading slash", async () => {
          process.env[`INPUT_TARGET-DIRECTORY`] = "/test/target";

          const config = await getEdgeStorageConfig();

          expect(config).toEqual(
            expect.objectContaining({
              targetDirectory: "test/target",
            }),
          );
        });
      });

      describe("ends with a slash", () => {
        it("should remove the end slash", async () => {
          process.env[`INPUT_TARGET-DIRECTORY`] = "test/target/";

          const config = await getEdgeStorageConfig();

          expect(config).toEqual(
            expect.objectContaining({
              targetDirectory: "test/target",
            }),
          );
        });
      });

      describe("starts and ends with a slash", () => {
        it("should remove the leading and end slash", async () => {
          process.env[`INPUT_TARGET-DIRECTORY`] = "/test/target/";

          const config = await getEdgeStorageConfig();

          expect(config).toEqual(
            expect.objectContaining({
              targetDirectory: "test/target",
            }),
          );
        });
      });

      describe("has no slash", () => {
        it("should stay the same", async () => {
          process.env[`INPUT_TARGET-DIRECTORY`] = "test";

          const config = await getEdgeStorageConfig();

          expect(config).toEqual(
            expect.objectContaining({
              targetDirectory: "test",
            }),
          );
        });
      });
    });

    it("should return edge storage configuration without errors", async () => {
      const config = await getEdgeStorageConfig();

      expect(config).toEqual({
        concurrency: 5,
        directoryToUpload: __dirname,
        storageZoneName: "test-zone",
        targetDirectory: "test/target",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        edgeStorageClient: expect.anything(),
      });
    });

    it("should format a concurrency to an int", async () => {
      process.env.INPUT_CONCURRENCY = "3.6";

      const config = await getEdgeStorageConfig();

      expect(config.concurrency).toBe(3);
    });

    describe("Missing required config", () => {
      it.each([
        ["storage-zone-password"],
        ["storage-endpoint"],
        ["concurrency"],
        ["directory-to-upload"],
        ["storage-zone-name"],
      ])(
        "should throw when configParam '%s' is missing",
        async (configParam: string) => {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- Test will fail when this goes wrong, so it's not really an issue here.
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

    describe("Invalid storage-zone-name", () => {
      it("should throw when storage-zone-name contains an slash", async () => {
        process.env["INPUT_STORAGE-ZONE-NAME"] = "test/";

        await expect(() => getEdgeStorageConfig()).rejects.toThrow(
          InvalidStorageZoneNameError,
        );
      });
    });

    describe("Invalid concurrency", () => {
      it("should throw when concurrency is not a number", async () => {
        process.env.INPUT_CONCURRENCY = "test";

        await expect(() => getEdgeStorageConfig()).rejects.toThrow(
          InvalidIntegerError,
        );
      });

      it("should throw when concurrency is not a positive integer", async () => {
        process.env.INPUT_CONCURRENCY = "-1";

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
