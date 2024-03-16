import { logInfo } from "@/logger.js";
import { Got } from "got";
import { createReadStream } from "node:fs";
import stream from "node:stream";
import { pipeline as streamPipeline } from "node:stream/promises";

/**
 * Uploads a file to a storage zone using a PUT stream.
 * This method employs streaming to upload the file in chunks rather than loading the entire file into memory at once.
 * Streaming is advantageous because it significantly reduces the memory footprint of the upload process, especially for large files.
 * By not loading the whole file into memory, we mitigate the risk of exhausting the available memory,
 * which could lead to performance degradation or process termination.
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
  logInfo(`Uploading file: '${filePath}' to Bunny: ${uploadPath}`);
  await streamPipeline(
    createReadStream(filePath),
    client.stream.put(uploadPath, {
      headers: { "Content-Type": "application/octet-stream" },
    }),
    new stream.PassThrough(),
  );
  logInfo(`File: '${uploadPath}' uploaded successfully to Bunny`);
};
