import {
  ListFileItem,
  listFiles,
} from "@/actions/storageZone/fileInfo/services/listfiles/listFiles.js";
import { logDebug, logInfo } from "@/logger.js";
import { getFileChecksum } from "@/utils/checksum/checksum.js";
import { Got } from "got";
import { NoReadAccessToFileError } from "@/actions/storageZone/fileInfo/errors.js";
import { asyncForEach } from "modern-async";
import { getLocalFilePath } from "./utils.js";
import { join as posixJoin } from "node:path/posix";

interface GetFileInfoProps {
  /**
   * A configured Got client used for HTTP requests.
   * This client should be set up with necessary configurations such as authentication headers,
   * and a `prefixUrl` that points to the base URL of the storage service API.
   */
  client: Got;
  /**
   * This is the directory which will be uploaded later on.
   * We need it to compare local files with the remote files.
   */
  directoryToUpload: string;
  /**
   * An optional parameter, that tells from which remote directory we need to gather the required file info.
   */
  targetDirectory?: string;
  storageZoneName: string;
  /**
   * The maximum number of file comparison operations and listFiles requests to run concurrently.
   */
  concurrency?: number;
  /**
   * Disables type validation in listFiles request.
   * In case that Bunny changes their API unexpectedly and the action doesn't break due to the changes,
   * someone might choose to temporary disable the type validation.
   */
  disableTypeValidation?: boolean;
}

export interface FileInfo {
  unchangedFiles: Set<string>;
  unknownRemoteFiles: Set<string>;
}

/**
 * Collects file info to determine which files are unchanged and which remote files are locally not found.
 *
 * @returns an object that contains unchangedFiles and unknownRemoteFiles
 */
export const getFileInfo = async ({
  client,
  directoryToUpload,
  targetDirectory,
  storageZoneName,
  concurrency = 10,
  disableTypeValidation = false,
}: GetFileInfoProps): Promise<FileInfo> => {
  const unchangedFiles = new Set<string>();
  // contains remote paths that can directly be used in delete calls
  const unknownRemoteFiles = new Set<string>();
  const fileInfo = { unchangedFiles, unknownRemoteFiles };

  const listFilesResults = new Set<Awaited<ReturnType<typeof listFiles>>>();
  listFilesResults.add(
    await listFiles({
      client,
      path: targetDirectory
        ? posixJoin(storageZoneName, `${targetDirectory}/`)
        : `${storageZoneName}/`,
      disableTypeValidation,
    }),
  );

  while (listFilesResults.size) {
    const [listFileResult] = listFilesResults;
    listFilesResults.delete(listFileResult);
    await asyncForEach(
      listFileResult,
      async (remoteFile) => {
        let localFilePath;
        try {
          // If file couldn't be read, it's added to unknownRemoteFiles in the catch
          localFilePath = await getLocalFilePath(directoryToUpload, remoteFile);
        } catch (error) {
          if (error instanceof NoReadAccessToFileError) {
            logDebug(error.message);
            const remoteFileEndpoint = getRemoteFileEndpoint(remoteFile);
            logInfo(`Found unknown remote file: '${remoteFileEndpoint}'`);
            fileInfo.unknownRemoteFiles.add(remoteFileEndpoint);
            return;
          }
          throw error;
        }
        if (remoteFile.IsDirectory) {
          // add directory to listFilesResults queue
          listFilesResults.add(
            await listFiles({
              client,
              path: getRemoteFileEndpoint(remoteFile),
              disableTypeValidation,
            }),
          );
          return;
        }
        const checksum = await getFileChecksum(localFilePath);
        logDebug(
          `localFilePath: ${localFilePath}, localChecksum: ${checksum.toLowerCase()}, remoteFileChecksum: ${remoteFile.Checksum?.toLowerCase()}`,
        );
        if (checksum.toLowerCase() === remoteFile.Checksum?.toLowerCase()) {
          logInfo(
            `Found unchanged local file ${localFilePath} compared to remote: '${remoteFile.Path}${remoteFile.ObjectName}'`,
          );
          fileInfo.unchangedFiles.add(localFilePath);
        }
      },
      concurrency,
    );
  }

  return fileInfo;
};

const getRemoteFileEndpoint = (remoteFile: ListFileItem) => {
  const remoteFileEndpoint = posixJoin(remoteFile.Path, remoteFile.ObjectName);
  if (remoteFile.IsDirectory && !remoteFile.ObjectName.endsWith("/")) {
    return `${remoteFileEndpoint}/`;
  }
  return remoteFileEndpoint;
};
