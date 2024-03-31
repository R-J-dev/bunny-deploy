import { createHash } from "crypto";
import { createReadStream } from "node:fs";

/**
 * Calculates the SHA-256 checksum of a file.
 *
 * @param {string} filePath - The path to the file whose checksum is to be calculated.
 * @returns {Promise<string>} A promise that resolves with the checksum of the file.
 */
export const getFileChecksum = async (filePath: string): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);

    stream.on("data", (data) => {
      hash.update(data);
    });

    stream.on("end", () => {
      resolve(hash.digest("hex"));
    });

    stream.on("error", (error) => {
      reject(error);
    });
  });
};
