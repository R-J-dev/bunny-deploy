export class NoReadAccessToFileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoReadAccessToFileError";
  }
}
