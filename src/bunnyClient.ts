import got, { Options, RequestError } from "got";
import { MissingAccessKeyError } from "@/errors.js";
import { logNotice } from "@/logger.js";

const logRetry = (error: RequestError, retryCount: number) => {
  logNotice(`Retrying after error ${error.code}, retry #: ${retryCount}`);
};

// TODO: add tests that check retry mechanism
// should not retry on 400 status code
// should retry on 408, 500, 502, 503, 504, 521, 522, 524
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
      methods: ["GET", "PUT"],
      statusCodes: [408, 500, 502, 503, 504, 521, 522, 524],
      errorCodes: [
        "ETIMEDOUT",
        "ECONNRESET",
        "EADDRINUSE",
        "ECONNREFUSED",
        "EPIPE",
        "ENOTFOUND",
        "ENETUNREACH",
        "EAI_AGAIN",
      ],
    },
    hooks: {
      beforeRetry: [logRetry],
    },
  });

  return got.extend(options);
};
