import { uploadDirectoryToStorageZone } from "@/actions/upload/uploadDirectory.js";
import { endGroup, getInput, setFailed, startGroup } from "@actions/core";
import { getBunnyClient } from "@/bunnyClient.js";
import { validateUrl } from "@/validators.js";
import { getFileInfo } from "@/actions/fileInfo/fileInfo.js";
import { logError } from "@/logger.js";

// TODO: document what todo when an deployment fails
// TODO: Add delete unknown files option
// TODO: Add purge files option

// TODO: add tests for this:
const getStorageEndpoint = () => {
  const storageEndpoint = getInput("storage-endpoint", {
    required: true,
  });
  try {
    validateUrl(storageEndpoint, "https");
    return storageEndpoint;
  } catch (error) {
    logError(
      error instanceof Error
        ? error.message
        : "Unknown error occurred while retrieving the storage-endpoint",
    );
    setFailed(
      `The provided storage-endpoint '${storageEndpoint}' isn't valid.`,
    );
    throw error;
  }
};

// TODO: add tests for this:
const getConcurrency = () => {
  const concurrencyInput = getInput("concurrency", { required: true });
  const concurrency = parseInt(concurrencyInput, 10);
  if (
    isNaN(concurrency) ||
    concurrency <= 0 ||
    !Number.isInteger(concurrency)
  ) {
    const errorMessage = `'concurrency' must be a positive integer. Received: ${concurrencyInput}`;
    setFailed(errorMessage);
    throw new Error(errorMessage);
  }
  return concurrency;
};

// TODO: add tests for this:
/**
 * Main function for the Bunny Deploy action
 */
export const run = async () => {
  try {
    // TODO: test what happens when getInput doesn't have a required input
    const accessKey = getInput("access-key", { required: true });
    const concurrency = getConcurrency();
    const storageEndpoint = getStorageEndpoint();
    const bunnyClient = getBunnyClient(accessKey, storageEndpoint);
    const directoryToUpload = getInput("directory-to-upload", {
      required: true,
    });
    const storageZoneName = getInput("storage-zone-name", { required: true });
    const isTypeValidationDisabled =
      getInput("disable-type-validation").toLowerCase() === "true";
    const targetDirectory = getInput("target-directory", { required: true });
    startGroup("Retrieving file info");
    const fileInfo = await getFileInfo({
      client: bunnyClient,
      directoryToUpload,
      storageZoneName,
      concurrency,
      disableTypeValidation: isTypeValidationDisabled,
    });
    endGroup();
    startGroup("Uploading directory to storage zone");
    await uploadDirectoryToStorageZone({
      client: bunnyClient,
      directoryToUpload,
      targetDirectory,
      concurrency,
      fileInfo,
    });
    endGroup();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    setFailed(errorMessage);
  }
};
