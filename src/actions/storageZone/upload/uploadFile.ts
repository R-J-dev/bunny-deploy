import { logError, logInfo, logNotice } from "@/logger.js";
import { Got, RequestError } from "got";
import { createReadStream } from "node:fs";
import stream from "node:stream";
import { pipeline as streamPipeline } from "node:stream/promises";
import pRetry, { AbortError } from "p-retry";

export const uploadFileHeaders = {
  headers: { "Content-Type": "application/octet-stream" },
};

/**
 * Attempts to upload a file to a storage zone using a PUT stream. \
 * When failed, it throws an AbortError if it shouldn't be retried. \
 * It throws a RequestError, when it should be retried.
 */
const retryableUploadFile = async (
  client: Got,
  uploadPath: string,
  filePath: string,
) => {
  try {
    await streamPipeline(
      createReadStream(filePath),
      client.stream.put(uploadPath, uploadFileHeaders),
      new stream.PassThrough(),
    );
    return;
  } catch (error) {
    const retryStatusCodes = client.defaults.options.retry.statusCodes;
    const retryErrorCodes = client.defaults.options.retry.errorCodes;
    if (error instanceof RequestError) {
      const statusCode = error.response?.statusCode;
      let shouldRetry = !!(
        statusCode && retryStatusCodes?.includes(statusCode)
      );
      shouldRetry ||= !!retryErrorCodes?.includes(error.code);
      if (shouldRetry) {
        throw error; // pRetry should catch the error and check if it can retry the failed stream
      }
    }
    throw new AbortError(error instanceof Error ? error : "unknown error");
  }
};

/**
 * Uploads a file to a storage zone using a PUT stream.
 * This method employs streaming to upload the file in chunks rather than loading the entire file into memory at once.
 * Streaming is advantageous because it significantly reduces the memory footprint of the upload process, especially for large files.
 * By not loading the whole file into memory, we mitigate the risk of exhausting the available memory,
 * which could lead to performance degradation or process termination.
 *
 * pRetry is used here instead of the got built-in retry solution, because it doesn't seem to support async streams.
 *
 * @param client - A got client that has a storageZoneEndpoint defined as a prefixUrl
 * @param uploadPath - The path in the storage zone that you want to upload your file to
 * @param filePath - The absolute path of the file that you want to upload
 */
export const uploadFile = async (
  client: Got,
  uploadPath: string,
  filePath: string,
) => {
  try {
    logInfo(`Uploading file: '${filePath}' to Bunny: ${uploadPath}`);
    await pRetry(
      async () => retryableUploadFile(client, uploadPath, filePath),
      {
        retries: client.defaults.options.retry.limit,
        onFailedAttempt: (error) => {
          logNotice(
            `Retrying after error ${error.name}, retry #: ${error.attemptNumber}`,
          );
        },
      },
    );
    logInfo(`File: '${uploadPath}' uploaded successfully to Bunny`);
  } catch (error) {
    logError(`Failed to upload file: '${filePath}' to Bunny: ${uploadPath}.`);
    throw error;
  }
};
