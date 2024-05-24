import { isAbsolute, join } from "path";

export const transformDirectoryToUploadInput = async (
  directoryToUpload: string,
) => {
  if (isAbsolute(directoryToUpload)) return directoryToUpload;
  if (!process.env.GITHUB_WORKSPACE)
    throw new Error("process.env.GITHUB_WORKSPACE is undefined");
  return join(process.env.GITHUB_WORKSPACE, directoryToUpload);
};

export const removeEndSlash = async (input: string) =>
  input.endsWith("/") ? input.slice(0, input.length - 1) : input;

export const removeBeginSlash = async (input: string) =>
  input.startsWith("/") ? input.slice(1) : input;
