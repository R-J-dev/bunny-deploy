import { getBunnyClient } from "@/bunnyClient.js";
import { validatePositiveInteger, validateUrl } from "@/validators.js";
import { getInput, getBooleanInput } from "@actions/core";
import { getInputWrapper } from "@/inputWrapper.js";
import { readdir } from "node:fs/promises";

export const getFeatureFlags = async () => {
  return {
    disableTypeValidation: getBooleanInput("disable-type-validation"),
    enableDeleteAction: getBooleanInput("enable-delete-action"),
    enablePurgePullZone: getBooleanInput("enable-purge-pull-zone"),
    enablePurgeOnly: getBooleanInput("enable-purge-only"),
  };
};

export const getPullZoneConfig = async () => {
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

export const getEdgeStorageConfig = async () => {
  // TODO: test what happens when getInput doesn't have a required input
  const accessKey = getInput("access-key", { required: true });
  const storageEndpoint = await getInputWrapper({
    inputName: "storage-endpoint",
    inputOptions: { required: true },
    validator: (url: string) => validateUrl(url, "https"),
  });

  return {
    concurrency: await getInputWrapper({
      inputName: "concurrency",
      inputOptions: { required: true },
      transformInput: async (input: string) => parseInt(input, 10),
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
