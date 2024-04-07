export class MissingAccessKeyError extends Error {
  constructor(message?: string) {
    super(message ?? "No access key provided. Please provide an access key.");
  }
}

type BaseUrlProtocolErrorParams = {
  invalidProtocol: string;
  expectedProtocol: string;
};

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
        `Invalid protocol ${invalidProtocol} provided, expected: ${expectedProtocol}`,
    );
  }
}
