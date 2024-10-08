export class MissingAccessKeyError extends Error {
  constructor(message?: string) {
    super(message ?? "No access key provided. Please provide an access key.");
  }
}

interface BaseUrlProtocolErrorParams {
  invalidProtocol: string;
  expectedProtocol: string;
}

export type InvalidUrlProtocolErrorParams =
  | (BaseUrlProtocolErrorParams & { message?: string })
  | (Partial<BaseUrlProtocolErrorParams> & { message: string });
export class InvalidUrlProtocolError extends Error {
  constructor({
    invalidProtocol,
    expectedProtocol,
    message,
  }: InvalidUrlProtocolErrorParams) {
    super(
      message ??
        `Invalid protocol '${invalidProtocol}' provided, expected: '${expectedProtocol}'`,
    );
  }
}

type InvalidIntStringParams =
  | { invalidString: string; message?: string }
  | { invalidString?: string; message: string };

export class InvalidDigitStringError extends Error {
  constructor({ invalidString, message }: InvalidIntStringParams) {
    super(
      message ??
        `Invalid digit string: ${invalidString}. Only digits are allowed.`,
    );
  }
}

type InvalidNumberParams =
  | { invalidInt: number; message?: string }
  | { invalidInt?: number; message: string };

export class InvalidIntegerError extends Error {
  constructor({ invalidInt, message }: InvalidNumberParams) {
    super(message ?? `Expected an integer, but received: ${invalidInt}`);
  }
}

type InvalidPathParams =
  | { invalidPath: string; message?: string }
  | { invalidPath?: string; message: string };

export class InvalidPathError extends Error {
  constructor({ invalidPath, message }: InvalidPathParams) {
    super(message ?? `The given path: '${invalidPath}' isn't valid.`);
  }
}

export class InvalidStorageZoneNameError extends Error {
  constructor(
    message = "storage-zone-name can only contain letters, numbers and dashes",
  ) {
    super(message);
  }
}
