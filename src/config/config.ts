import { getInput, getBooleanInput, setSecret } from "@actions/core";
import { getBunnyClient } from "@/bunnyClient/bunnyClient.js";
import {
  validateDirectory,
  validateInteger,
  validateDigitString,
  validatePositiveInteger,
  validateUrl,
} from "@/config/validators.js";
import { getInputWrapper } from "@/config/inputWrapper.js";
import {
  removeBeginSlash,
  removeEndSlash,
  transformDirectoryToUploadInput,
} from "@/config/transformers.js";
import { logDebug } from "@/logger.js";
import { InvalidStorageZoneNameError } from "@/errors.js";

export const getSecret = async (secretName: string) => {
  const secret = getInput(secretName, { required: true });
  setSecret(secret);
  return secret;
};

export const getFeatureFlags = async () => {
  logDebug("Retrieving feature flags");
  return {
    disableTypeValidation: getBooleanInput("disable-type-validation"),
    enableDeleteAction: getBooleanInput("enable-delete-action"),
    enablePurgePullZone: getBooleanInput("enable-purge-pull-zone"),
    disableUpload: getBooleanInput("disable-upload"),
  };
};

export const getPullZoneConfig = async () => {
  logDebug("Retrieving pullZoneConfig");
  const accessKey = await getSecret("access-key");
  const pullZoneId = await getInputWrapper({
    inputName: "pull-zone-id",
    inputOptions: { required: true },
    validator: validateDigitString,
    errorLogMessage: "The pull-zone-id should only contain digits.",
  });
  const pullZoneClient = getBunnyClient(
    accessKey,
    "https://api.bunny.net/pullzone/",
  );
  const replicationTimeout = await getInputWrapper({
    inputName: "replication-timeout",
    inputOptions: { required: true },
    transformInput: async (input: string) => parseInt(input, 10),
    validator: validateInteger,
    errorLogMessage: "The replication-timeout is not a valid integer.",
  });
  return {
    pullZoneId: pullZoneId,
    pullZoneClient,
    replicationTimeout,
  };
};

export const getEdgeStorageConfig = async () => {
  logDebug("Retrieving edgeStorageConfig");
  const storageZonePassword = await getSecret("storage-zone-password");
  const storageEndpoint = await getInputWrapper({
    inputName: "storage-endpoint",
    inputOptions: { required: true },
    validator: (url: string) => validateUrl(url, "https:"),
  });

  return {
    concurrency: await getInputWrapper({
      inputName: "concurrency",
      inputOptions: { required: true },
      transformInput: async (input: string) => parseInt(input, 10),
      validator: validatePositiveInteger,
    }),
    directoryToUpload: await getInputWrapper({
      inputName: "directory-to-upload",
      inputOptions: { required: true },
      transformInput: transformDirectoryToUploadInput,
      validator: validateDirectory,
      errorLogMessage:
        "The directory-to-upload path isn't a valid path to an existing directory or doesn't have read access.",
    }),
    edgeStorageClient: getBunnyClient(storageZonePassword, storageEndpoint),
    storageZoneName: await getInputWrapper({
      inputName: "storage-zone-name",
      inputOptions: { required: true },
      validator: async (input: string) => {
        if (input.includes("/")) throw new InvalidStorageZoneNameError();
      },
    }),
    targetDirectory: await getInputWrapper({
      inputName: "target-directory",
      transformInput: async (input: string) =>
        removeEndSlash(await removeBeginSlash(input)),
    }),
  };
};
