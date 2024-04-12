import { asyncForEach } from "modern-async";
import type { Got } from "got";
import { logInfo, logWarning } from "@/logger.js";

export interface DeleteFilesProps {
  /*
   * A configured Got client used for HTTP requests.
   * The client should have a storageZoneEndpoint defined as a prefixUrl.
   */
  client: Got;
  /*
   * A collection of remote file paths designated for deletion. This includes both individual files and directories.
   * Deleting a directory will also remove all its contents.
   *
   * Caution: Avoid listing files that are within a directory marked for deletion to prevent unnecessary warning logs.
   * Files within a deleted directory are automatically removed and cannot be deleted again.
   */
  filesToDelete: Set<string>;
  /*
   * The maximum number of delete operations to run concurrently.
   * This parameter controls how many files are deleted in parallel.
   */
  concurrency: number;
}

/**
 * Asynchronously deletes a set of files or directories in a remote storage zone.
 */
export const deleteFiles = async ({
  client,
  filesToDelete,
  concurrency,
}: DeleteFilesProps) => {
  await asyncForEach(
    filesToDelete,
    async (file) => {
      try {
        logInfo(`Deleting file: ${file}`);
        await client.delete(file);
      } catch (error) {
        logWarning(
          `Failed deleting file: ${file}.
          You might need to delete the file yourself or reset your storage zone with a back-up.
          The error that triggered this was: ${error instanceof Error ? error.message : "unknown"}`,
        );
      }
    },
    concurrency,
  );
};
