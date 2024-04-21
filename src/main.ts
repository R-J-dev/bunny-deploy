import { logInfo } from "@/logger.js";
import { setTimeout } from "timers/promises";
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

// TODO: document what todo when an deployment fails

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
      const { pullZoneClient, pullZoneId } = await getPullZoneConfig();
      return await purgeCache({ client: pullZoneClient, pullZoneId });
    }

    const {
      concurrency,
      directoryToUpload,
      edgeStorageClient,
      replicationTimeout,
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
    });
    endGroup();

    if (enablePurgePullZone) {
      const { pullZoneClient, pullZoneId } = await getPullZoneConfig();
      // Unfortunately Bunny doesn't provide an api endpoint yet to check if the replicated storage zones are on the latest version (equal to main storage zone).
      // See for more info: https://support.bunny.net/hc/en-us/articles/360020526159-Understanding-Geo-Replication
      logInfo(
        `Waiting ${replicationTimeout} seconds before purging the cache, to make sure that the storage zones has been replicated.`,
      );
      await setTimeout(replicationTimeout * 1000);
      await purgeCache({ client: pullZoneClient, pullZoneId });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    setFailed(errorMessage);
  }
};
