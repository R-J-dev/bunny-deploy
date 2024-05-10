import { uploadDirectoryToStorageZone } from "@/actions/upload/uploadDirectory.js";
import { endGroup, setFailed, startGroup } from "@actions/core";
import { getFileInfo } from "@/actions/fileInfo/fileInfo.js";
import { deleteFiles } from "@/actions/delete/delete.js";
import { purgeCache } from "@/actions/pullZone/purge/purgeCache.js";
import {
  getEdgeStorageConfig,
  getFeatureFlags,
  getPullZoneConfig,
} from "@/config/config.js";

// TODO: add tests for this:
/**
 * Main function for the Bunny Deploy action
 */
export const run = async () => {
  try {
    const {
      disableTypeValidation,
      enableDeleteAction,
      enablePurgePullZone,
      enablePurgeOnly,
    } = await getFeatureFlags();

    if (enablePurgeOnly) {
      const { pullZoneClient, pullZoneId, replicationTimeout } =
        await getPullZoneConfig();
      await purgeCache({
        client: pullZoneClient,
        pullZoneId,
        replicationTimeout,
      });
    }

    const {
      concurrency,
      directoryToUpload,
      edgeStorageClient,
      storageZoneName,
      targetDirectory,
    } = await getEdgeStorageConfig();
    startGroup("Retrieving file info");
    const fileInfo = await getFileInfo({
      client: edgeStorageClient,
      directoryToUpload,
      storageZoneName,
      concurrency,
      disableTypeValidation,
    });
    endGroup();

    if (enableDeleteAction) {
      startGroup("Deleting unknown remote files");
      await deleteFiles({
        client: edgeStorageClient,
        filesToDelete: fileInfo.unknownRemoteFiles,
        concurrency,
      });
      endGroup();
    }

    startGroup("Uploading directory to storage zone");
    await uploadDirectoryToStorageZone({
      client: edgeStorageClient,
      directoryToUpload,
      targetDirectory,
      concurrency,
      fileInfo,
      storageZoneName,
    });
    endGroup();

    if (enablePurgePullZone) {
      const { pullZoneClient, pullZoneId, replicationTimeout } =
        await getPullZoneConfig();
      await purgeCache({
        client: pullZoneClient,
        pullZoneId,
        replicationTimeout,
      });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    setFailed(errorMessage);
  }
};
