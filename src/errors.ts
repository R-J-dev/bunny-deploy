export class MissingAccessKeyError extends Error {
  constructor(message?: string) {
    super(message ?? "No access key provided. Please provide an access key.");
  }
}
