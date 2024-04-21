import { logError, logInfo } from "@/logger.js";
import { Got, RequestError } from "got";

interface PurgeCacheProps {
  /*
   * A configured Got client used for HTTP requests.
   */
  client: Got;
  /*
   * The ID of the pull zone to purge.
   */
  pullZoneId: string;
}

/**
 * Purges the cache for a specified pull zone.
 */
export const purgeCache = async ({ client, pullZoneId }: PurgeCacheProps) => {
  const whenDidTheErrorOccurred = "while trying to purge the pull zone cache";
  const unexpectedError = `${whenDidTheErrorOccurred}, an unexpected error occurred`;
  try {
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
