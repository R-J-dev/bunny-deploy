import { error, info, notice, warning } from "@actions/core";

// This file contains wrappers for the core action logger functions.
// This way it's easier to change all log formats in one place and easier to maintain.

export const logNotice = (message: string) => {
  notice(message);
};

export const logInfo = (message: string) => {
  info(message);
};

export const logWarning = (message: string | Error) => {
  warning(message);
};

export const logError = (message: string | Error) => {
  error(message);
};
