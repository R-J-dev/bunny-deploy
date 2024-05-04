import { Got, RequestError } from "got";
import { setTimeout } from "timers/promises";
import { logError, logInfo } from "@/logger.js";

interface PurgeCacheProps {
  /*
   * A configured Got client used for HTTP requests.
   */
  client: Got;
  /*
   * The ID of the pull zone to purge.
   */
  pullZoneId: string;
  /*
   * The amount of seconds to wait before purging the cache.
   * Unfortunately Bunny doesn't provide an api endpoint yet to check if the replicated storage zones are on the latest version (equal to main storage zone).
   * See for more info: https://support.bunny.net/hc/en-us/articles/360020526159-Understanding-Geo-Replication
   */
  replicationTimeout: number;
}

/**
 * Purges the cache for a specified pull zone.
 */
export const purgeCache = async ({
  client,
  pullZoneId,
  replicationTimeout,
}: PurgeCacheProps) => {
  const whenDidTheErrorOccurred = "while trying to purge the pull zone cache";
  const unexpectedError = `${whenDidTheErrorOccurred}, an unexpected error occurred`;
  try {
    logInfo(
      `Waiting ${replicationTimeout} seconds before purging the cache, to make sure that the storage zones has been replicated.`,
    );
    await setTimeout(replicationTimeout * 1000);

    logInfo("Purging the pull zone cache.");
    await client.post(`${pullZoneId}/purgeCache`);
    logInfo("Purging completed.");
  } catch (error) {
    if (!(error instanceof RequestError)) {
      logError(unexpectedError);
      throw error;
    }
    switch (error.response?.statusCode) {
      case 401:
        logError(
          `${whenDidTheErrorOccurred}, the request authorization failed while making the request.`,
        );
        break;
      case 404:
        logError(
          `${whenDidTheErrorOccurred}, a response was received telling us that the Pull Zone with the requested ID does not exist.`,
        );
        break;
      default:
        logError(unexpectedError);
        break;
    }
    throw error;
  }
};
