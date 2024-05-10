import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  MockInstance,
} from "vitest";
import { getFileInfo } from "@/actions/fileInfo/fileInfo.js";
import * as listFilesModule from "@/actions/fileInfo/services/listfiles/listFiles.js";
import path, { join } from "path";
import { testServerUrl } from "@/testSetup/globalTestSetup.js";
import { getBunnyClient } from "@/bunnyClient.js";
import * as utils from "@/actions/fileInfo/utils.js";
import { getLocalFilePath } from "@/actions/fileInfo/utils.js";

const baseListFileItemMock = {
  StorageZoneName: "test-zone",
  Length: 0,
  LastChanged: "",
  ServerId: 0,
  ArrayNumber: 0,
  UserId: "test",
  ContentType: "",
  DateCreated: "",
  StorageZoneId: 0,
  ReplicatedZones: null,
};

const storageZoneName = "test-zone";

const mockListFilesResponse1 = [
  {
    ...baseListFileItemMock,
    Guid: "file1",
    ObjectName: "file1.txt",
    Path: `/${storageZoneName}/`,
    Checksum:
      "96d2ae4fabe419c2bfb5f8c3ac689e4969bf27474befa8694378b731c0e96722",
    IsDirectory: false,
  },
  {
    ...baseListFileItemMock,
    Guid: "test-dir",
    ObjectName: "test-dir",
    Path: `/${storageZoneName}/`,
    Checksum: null,
    IsDirectory: true,
  },
];

const mockListFilesResponse2 = [
  {
    ...baseListFileItemMock,
    Guid: "nested-test-dir",
    ObjectName: "nested-test-dir",
    Path: `/${storageZoneName}/test-dir/`,
    Checksum: null,
    IsDirectory: true,
  },
  {
    ...baseListFileItemMock,
    Guid: "file2",
    ObjectName: "file2.txt",
    Path: `/${storageZoneName}/test-dir/`,
    Checksum:
      "different-checksum-to-verify-that-it-is-not-being-added-to-unchanged-files",
    IsDirectory: false,
  },
  {
    ...baseListFileItemMock,
    Guid: "test-dir-to-delete",
    ObjectName: "test-dir-to-delete",
    Path: `/${storageZoneName}/test-dir/`,
    Checksum: null,
    IsDirectory: true,
  },
];

const mockListFilesResponse3 = [
  {
    ...baseListFileItemMock,
    Guid: "file3",
    ObjectName: "file3.txt",
    Path: `/${storageZoneName}/test-dir/nested-test-dir/`,
    Checksum:
      "5a82ed5a4d37023e7bfe57a7a5bd0e23f48605dfa7d11a410e1108f1ef6223ef",
    IsDirectory: false,
  },
  {
    ...baseListFileItemMock,
    Guid: "test-file-to-delete",
    ObjectName: "test-file-to-delete.txt",
    Path: `/${storageZoneName}/test-dir/nested-test-dir/`,
    Checksum:
      "5a82ed5a4d37023e7bfe57a7a5bd0e23f48605dfa7d11a410e1108f1ef6223ef",
    IsDirectory: false,
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const directoryToCheck = path.join(__dirname, "/test-dir-file-info");
const bunnyClient = getBunnyClient("test", testServerUrl);
let concurrentFileInfoGathering = 0;
let maxConcurrentFileInfoGathering = 0;

describe("getFileInfo", () => {
  const originalGetLocalFilePath = getLocalFilePath;
  let getLocalFilePathSpy: MockInstance;
  let listFilesSpy: MockInstance;
  beforeEach(() => {
    getLocalFilePathSpy = vi.spyOn(utils, "getLocalFilePath");
    listFilesSpy = vi.spyOn(listFilesModule, "listFiles");
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe.each([[1], [2]])("Concurrency is set to %i", (concurrency) => {
    it(
      `should not retrieve file info for more than ${concurrency} files concurrently`,
      {
        timeout: 10000, // Due to simulating slow file read
      },
      async () => {
        concurrentFileInfoGathering = 0;
        maxConcurrentFileInfoGathering = 0;

        getLocalFilePathSpy.mockImplementation(
          async (
            directoryToUpload: string,
            remoteFile: listFilesModule.ListFileItem,
          ) => {
            concurrentFileInfoGathering++;
            maxConcurrentFileInfoGathering = Math.max(
              maxConcurrentFileInfoGathering,
              concurrentFileInfoGathering,
            );
            // Simulate file read
            await delay(400);
            concurrentFileInfoGathering--;
            return originalGetLocalFilePath(directoryToUpload, remoteFile);
          },
        );

        listFilesSpy
          .mockResolvedValueOnce(mockListFilesResponse1)
          .mockResolvedValueOnce(mockListFilesResponse2)
          .mockResolvedValueOnce(mockListFilesResponse3);

        await getFileInfo({
          client: bunnyClient,
          directoryToUpload: directoryToCheck,
          storageZoneName,
          concurrency,
        });

        expect(maxConcurrentFileInfoGathering).toBeLessThanOrEqual(concurrency);
      },
    );
  });
  it("should return fileInfo with unchanged files and unknown files", async () => {
    listFilesSpy
      .mockResolvedValueOnce(mockListFilesResponse1)
      .mockResolvedValueOnce(mockListFilesResponse2)
      .mockResolvedValueOnce(mockListFilesResponse3);

    const fileInfo = await getFileInfo({
      client: bunnyClient,
      directoryToUpload: directoryToCheck,
      storageZoneName,
    });

    expect(fileInfo.unchangedFiles).toEqual(
      new Set([
        join(directoryToCheck, "file1.txt"),
        join(directoryToCheck, "test-dir", "nested-test-dir", "file3.txt"),
      ]),
    );
    expect(fileInfo.unknownRemoteFiles).toEqual(
      new Set([
        `/${storageZoneName}/test-dir/test-dir-to-delete/`,
        `/${storageZoneName}/test-dir/nested-test-dir/test-file-to-delete.txt`,
      ]),
    );
  });

  it("should throw when error is no NoReadAccessToFileError", async () => {
    listFilesSpy
      .mockResolvedValueOnce(mockListFilesResponse1)
      .mockResolvedValueOnce(mockListFilesResponse2)
      .mockResolvedValueOnce(mockListFilesResponse3);
    getLocalFilePathSpy.mockRejectedValueOnce(new Error());

    await expect(() =>
      getFileInfo({
        client: bunnyClient,
        directoryToUpload: directoryToCheck,
        storageZoneName,
      }),
    ).rejects.toThrow();
  });
});
