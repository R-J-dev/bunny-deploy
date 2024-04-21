import { debug, error, info, notice, warning } from "@actions/core";

// This file contains wrappers for the core action logger functions.
// This way it's easier to change all log formats in one place and easier to maintain.

// TODO: add a way to inject your own custom logger, this would be useful when this action is uploaded to npm to be used outside github as well.
// TODO: add log location
export const logNotice = (message: string) => {
  notice(message);
};

export const logInfo = (message: string) => {
  info(message);
};

export const logDebug = (message: string) => {
  debug(message);
};

export const logWarning = (message: string | Error) => {
  warning(message);
};

export const logError = (message: string | Error) => {
  error(message);
};
