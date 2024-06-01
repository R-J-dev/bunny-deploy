import { ListFileItem } from "@/actions/storageZone/fileInfo/services/listfiles/listFiles.js";
import { R_OK } from "node:constants";
import { access } from "node:fs/promises";
import { join } from "path";
import { NoReadAccessToFileError } from "@/actions/storageZone/fileInfo/errors.js";

/**
 * Retrieves the local file path corresponding to a remote file for comparison or processing.
 *
 * @param directoryToUpload - The local directory path where the file will be uploaded.
 * @param remoteFile - The remote file object containing information about the file.
 * @returns The local file path.
 * @throws Throws a NoReadAccessToFileError if the file is not found or there is no read access.
 */
export const getLocalFilePath = async (
  directoryToUpload: string,
  remoteFile: ListFileItem,
) => {
  const relativePath = remoteFile.Path.substring(
    `/${remoteFile.StorageZoneName}/`.length,
  );
  const filePath = join(directoryToUpload, relativePath, remoteFile.ObjectName);
  try {
    await access(filePath, R_OK);
  } catch {
    throw new NoReadAccessToFileError(
      `File: '${filePath}' was not found or there was no read access.`,
    );
  }
  return filePath;
};
