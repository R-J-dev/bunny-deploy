import { Got } from "got";
import { setFailed } from "@actions/core";
import { eachLimit } from "async";
import { join, relative } from "path";
import { readdir } from "node:fs/promises";
import { createReadStream } from "node:fs";
import stream from "node:stream";
import { pipeline as streamPipeline } from "node:stream/promises";
import { logError, logInfo } from "@/logger.js";

const unknownUploadDirError =
  "Unknown error occurred while uploading directory to storage zone";

// TODO: convert relative input path to absolute path by using GITHUB_WORKSPACE before calling uploadDirectoryToStorageZone
/**
 * Uploads a directory to a storage zone with parallel requests.
 * This function recursively traverses the specified directory, uploading each file to the storage zone in parallel batches.
 * It is designed to efficiently handle large numbers of files by limiting the number of concurrent uploads.
 *
 * @param client -
 * A configured Got client used for HTTP requests.
 * The client should have a storageZoneEndpoint defined as a prefixUrl.
 * @param directoryToUpload -
 * The local filesystem path of the directory whose contents are to be uploaded.
 * The function will recursively find and upload all files within this directory.
 * @param targetDirectory -
 * The path within the storage zone where the files will be uploaded.
 * This path will be prefixed to the relative paths of the files found in the directoryToUpload.
 * If left empty, files will be uploaded to the root of the storage zone.
 *
 * @throws Errors during the upload process are logged,
 * and the action is marked as failed using GitHub Actions' setFailed method.
 */
export const uploadDirectoryToStorageZone = async (
  client: Got,
  directoryToUpload: string,
  targetDirectory: string,
) => {
  try {
    const files = await readdir(directoryToUpload, {
      encoding: "utf8",
      recursive: true,
      withFileTypes: true,
    });
    await eachLimit(files, 10, (file, done) => {
      if (file.isDirectory()) return done();
      const filePath = join(file.path, file.name);
      // Use replaceAll to remove backslashes on Windows
      const relativeDir = relative(directoryToUpload, file.path).replaceAll(
        "\\",
        "/",
      );
      const relativeFilePath = relativeDir
        ? `${relativeDir}/${file.name}`
        : file.name;
      const uploadPath = targetDirectory
        ? `${targetDirectory}/${relativeFilePath}`
        : relativeFilePath;
      uploadFile(client, uploadPath, filePath)
        .then(() => done())
        .catch((error) => done(error));
    });
  } catch (error) {
    logError(`Failed to upload: '${directoryToUpload}'`);
    setFailed(error instanceof Error ? error : unknownUploadDirError);
    throw error;
  }
};

/**
 * Uploads a file to a storage zone using a PUT stream.
 * This method employs streaming to upload the file in chunks rather than loading the entire file into memory at once.
 * Streaming is advantageous because it significantly reduces the memory footprint of the upload process, especially for large files.
 * By not loading the whole file into memory, we mitigate the risk of exhausting the available memory,
 * which could lead to performance degradation or process termination.
 *
 * @param client - A got client that has a storageZoneEndpoint defined as a prefixUrl
 * @param uploadPath - The path in the storage zone that you want to upload your file to
 * @param filePath - The path of the file that you want to upload
 */
export const uploadFile = async (
  client: Got,
  uploadPath: string,
  filePath: string,
) => {
  logInfo(`Uploading file: '${filePath}' to Bunny: ${uploadPath}`);
  await streamPipeline(
    createReadStream(filePath),
    client.stream.put(uploadPath, {
      headers: { "Content-Type": "application/octet-stream" },
    }),
    new stream.PassThrough(),
  );
  logInfo(`File: '${uploadPath}' uploaded successfully to Bunny`);
};

// TODO: purge files: https://support.bunny.net/hc/en-us/articles/360020401791-Does-BunnyCDN-automatically-detect-when-a-file-is-changed-
