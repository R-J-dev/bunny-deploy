import { isAbsolute, join } from "path";

export const transformDirectoryToUploadInput = async (
  directoryToUpload: string,
) => {
  if (isAbsolute(directoryToUpload)) return directoryToUpload;
  if (!process.env.GITHUB_WORKSPACE)
    throw new Error("process.env.GITHUB_WORKSPACE is undefined");
  return join(process.env.GITHUB_WORKSPACE, directoryToUpload);
};
