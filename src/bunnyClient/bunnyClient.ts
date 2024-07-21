import got, { type Method, Options, RequestError } from "got";
import { MissingAccessKeyError } from "@/errors.js";
import { logNotice } from "@/logger.js";

const logRetry = (error: RequestError, retryCount: number) => {
  logNotice(`Retrying after error ${error.code}, retry #: ${retryCount}`);
};

export const retryStatusCodes = [408, 500, 502, 503, 504, 521, 522, 524];
export const retryErrorCodes = [
  "ETIMEDOUT",
  "ECONNRESET",
  "EADDRINUSE",
  "ECONNREFUSED",
  "EPIPE",
  "ENOTFOUND",
  "ENETUNREACH",
  "EAI_AGAIN",
];
// NOTE: PUT streams are also being retried, but in a different way. See uploadFile.ts for more info.
export const retryMethods: Method[] = ["GET", "DELETE"];
export const getBunnyClient = (accessKey: string, baseUrl: string) => {
  if (!accessKey) throw new MissingAccessKeyError();

  const options = new Options({
    prefixUrl: baseUrl,
    headers: {
      AccessKey: accessKey,
    },
    throwHttpErrors: true,
    timeout: {
      request: 5000, // 5 seconds
    },
    retry: {
      limit: 3,
      methods: retryMethods,
      statusCodes: retryStatusCodes,
      errorCodes: retryErrorCodes,
    },
    hooks: {
      beforeRetry: [logRetry],
    },
  });

  return got.extend(options);
};
