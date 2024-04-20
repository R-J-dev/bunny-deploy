import { Got } from "got";
import { join, relative } from "path";
import { readdir } from "node:fs/promises";
import { logError, logInfo } from "@/logger.js";
import { asyncForEach } from "modern-async";
import { uploadFile } from "@/actions/upload/uploadFile.js";
import { FileInfo } from "@/actions/fileInfo/fileInfo.js";

interface UploadDirectoryToStorageZoneProps {
  /*
   * A configured Got client used for HTTP requests.
   * The client should have a storageZoneEndpoint defined as a prefixUrl.
   */
  client: Got;
  /*
   * The local filesystem path of the directory whose contents are to be uploaded.
   * The function will recursively find and upload all files within this directory.
   */
  directoryToUpload: string;
  /*
   * The path within the storage zone where the files will be uploaded.
   * This path will be prefixed to the relative paths of the files found in the directoryToUpload.
   * If left empty, files will be uploaded to the root of the storage zone.
   */
  targetDirectory: string;
  /*
   * The maximum number of file upload operations to run concurrently.
   * This parameter controls how many files are uploaded in parallel, allowing for efficient use of resources and faster upload times.
   */
  concurrency: number;
  fileInfo: FileInfo;
}

// TODO: convert relative input path to absolute path by using GITHUB_WORKSPACE before calling uploadDirectoryToStorageZone
/**
 * Uploads a directory to a storage zone with parallel requests.
 * This function recursively traverses the specified directory, uploading each file to the storage zone in parallel batches.
 * It is designed to efficiently handle large numbers of files by limiting the number of concurrent uploads.
 */
export const uploadDirectoryToStorageZone = async ({
  client,
  directoryToUpload,
  targetDirectory,
  concurrency,
  fileInfo,
}: UploadDirectoryToStorageZoneProps) => {
  try {
    const files = await readdir(directoryToUpload, {
      encoding: "utf8",
      recursive: true,
      withFileTypes: true,
    });
    await asyncForEach(
      files,
      async (file) => {
        if (file.isDirectory()) return;
        const filePath = join(file.path, file.name);
        if (fileInfo.unchangedFiles.has(filePath)) {
          logInfo(`Skipped uploading unchanged file: ${filePath}`);
          return;
        }
        const uploadPath = getUploadPath(
          filePath,
          directoryToUpload,
          targetDirectory,
        );
        await uploadFile(client, uploadPath, filePath);
      },
      concurrency,
    );
  } catch (error) {
    logError(`Failed to upload: '${directoryToUpload}'`);
    throw error;
  }
};

/**
 * Get the upload path that is later needed to upload a file to a specific place inside a storage zone.
 *
 * @param absoluteFilePath - The absolute path to the file that you want to upload
 * @param directoryToUpload - The absolute path to the local directory that you are uploading
 * @param targetDirectory - The path of the remote directory where the file should be uploaded to.
 * @returns upload path
 */
const getUploadPath = (
  absoluteFilePath: string,
  directoryToUpload: string,
  targetDirectory: string,
) => {
  // Use replaceAll to remove backslashes on Windows
  const relativeFilePath = relative(
    directoryToUpload,
    absoluteFilePath,
  ).replaceAll("\\", "/");
  return targetDirectory
    ? join(targetDirectory, relativeFilePath).replaceAll("\\", "/")
    : relativeFilePath;
};
