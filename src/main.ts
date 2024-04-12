import { getInputWrapper } from "@/inputWrapper.js";
import { uploadDirectoryToStorageZone } from "@/actions/upload/uploadDirectory.js";
import {
  endGroup,
  getInput,
  getBooleanInput,
  setFailed,
  startGroup,
} from "@actions/core";
import { getBunnyClient } from "@/bunnyClient.js";
import { validatePositiveInteger, validateUrl } from "@/validators.js";
import { getFileInfo } from "@/actions/fileInfo/fileInfo.js";
import { deleteFiles } from "@/actions/delete/delete.js";

// TODO: document what todo when an deployment fails

// TODO: add tests for this:
/**
 * Main function for the Bunny Deploy action
 */
export const run = async () => {
  try {
    // TODO: test what happens when getInput doesn't have a required input
    const accessKey = getInput("access-key", { required: true });
    const concurrency = getInputWrapper({
      inputName: "concurrency",
      inputOptions: { required: true },
      transformInput: (input: string) => parseInt(input, 10),
      validator: validatePositiveInteger,
    });
    const storageEndpoint = getInputWrapper({
      inputName: "storage-endpoint",
      validator: (url: string) => validateUrl(url, "https"),
    });
    const edgeStorageClient = getBunnyClient(accessKey, storageEndpoint);
    const directoryToUpload = getInput("directory-to-upload", {
      required: true,
    });
    const storageZoneName = getInput("storage-zone-name", { required: true });
    const targetDirectory = getInput("target-directory", { required: true });

    // Toggles
    const isTypeValidationDisabled = getBooleanInput("disable-type-validation");
    const isDeleteActionEnabled = getBooleanInput("enable-delete-action");

    startGroup("Retrieving file info");
    const fileInfo = await getFileInfo({
      client: edgeStorageClient,
      directoryToUpload,
      storageZoneName,
      concurrency,
      disableTypeValidation: isTypeValidationDisabled,
    });
    endGroup();

    if (isDeleteActionEnabled) {
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
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    setFailed(errorMessage);
  }
};
