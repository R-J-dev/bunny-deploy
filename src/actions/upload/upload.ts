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
export const uploadDirectoryToStorageZone = async (
  bunnyClient: Got,
  directoryToUpload: string,
  targetDirectory: string,
  storageZoneEndpoint: string,
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
      uploadFile(bunnyClient, storageZoneEndpoint, uploadPath, filePath)
        .then(() => done())
        .catch((error) => done(error));
    });
  } catch (error) {
    logError(`Failed to upload: '${directoryToUpload}'`);
    setFailed(error instanceof Error ? error : unknownUploadDirError);
    throw error;
  }
};

export const uploadFile = async (
  bunnyClient: Got,
  storageZoneEndpoint: string,
  uploadPath: string,
  filePath: string,
) => {
  const uploadUrl = `${storageZoneEndpoint}/${uploadPath}`;
  logInfo(`Uploading file: '${filePath}' to Bunny: ${uploadUrl}`);
  await streamPipeline(
    createReadStream(filePath),
    bunnyClient.stream.put(uploadUrl, {
      headers: { "Content-Type": "application/octet-stream" },
    }),
    new stream.PassThrough(),
  );
  logInfo(`File: '${uploadPath}' uploaded successfully to Bunny`);
};

// TODO: purge files: https://support.bunny.net/hc/en-us/articles/360020401791-Does-BunnyCDN-automatically-detect-when-a-file-is-changed-
