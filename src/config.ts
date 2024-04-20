import { getBunnyClient } from "@/bunnyClient.js";
import { validatePositiveInteger, validateUrl } from "@/validators.js";
import { getInput, getBooleanInput } from "@actions/core";
import { getInputWrapper } from "@/inputWrapper.js";

export const getFeatureFlags = () => {
  return {
    disableTypeValidation: getBooleanInput("disable-type-validation"),
    enableDeleteAction: getBooleanInput("enable-delete-action"),
    enablePurgePullZone: getBooleanInput("enable-purge-pull-zone"),
    enablePurgeOnly: getBooleanInput("enable-purge-only"),
  };
};

export const getPullZoneConfig = () => {
  const accessKey = getInput("access-key", { required: true });
  const pullZoneId = getInput("pull-zone-id", { required: true });
  const pullZoneClient = getBunnyClient(
    accessKey,
    "https://api.bunny.net/pullzone/",
  );
  return {
    pullZoneId: pullZoneId,
    pullZoneClient,
  };
};

export const getEdgeStorageConfig = () => {
  // TODO: test what happens when getInput doesn't have a required input
  const accessKey = getInput("access-key", { required: true });
  const storageEndpoint = getInputWrapper({
    inputName: "storage-endpoint",
    validator: (url: string) => validateUrl(url, "https"),
  });

  return {
    concurrency: getInputWrapper({
      inputName: "concurrency",
      inputOptions: { required: true },
      transformInput: (input: string) => parseInt(input, 10),
      validator: validatePositiveInteger,
    }),
    directoryToUpload: getInput("directory-to-upload", {
      required: true,
    }),
    edgeStorageClient: getBunnyClient(accessKey, storageEndpoint),
    storageZoneName: getInput("storage-zone-name", { required: true }),
    targetDirectory: getInput("target-directory", { required: true }),
  };
};
