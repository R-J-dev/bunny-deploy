import {
  InvalidIntegerError,
  InvalidPathError,
  InvalidUrlProtocolError,
} from "@/errors.js";
import { lstat } from "node:fs/promises";

/**
 * Validates if a given string is a valid URL and has an expected protocol.
 * If the given url is not a valid url, it will throw an error.
 * If the URL's protocol is not equal to the expected protocol, an InvalidUrlProtocolError is thrown.
 *
 * @param url The URL string to be validated.
 * @param expectedProtocol The protocol that is expected.
 */
export const validateUrl = async (url: string, expectedProtocol: string) => {
  const validUrl = new URL(url);
  if (validUrl.protocol !== expectedProtocol) {
    throw new InvalidUrlProtocolError({
      invalidProtocol: validUrl.protocol,
      expectedProtocol: expectedProtocol,
    });
  }
};

export const validatePositiveInteger = async (int: number) => {
  if (!(Number.isInteger(int) && int > 0)) {
    throw new InvalidIntegerError({
      invalidInt: int,
      message: `Expected a positive integer, but received: ${int}`,
    });
  }
};

/**
 * Checks if a given path is a directory
 *
 * @param path - the absolute path to the directory
 * @throws when the path doesn't exists or the file isn't a directory
 */
export const validateDirectory = async (path: string) => {
  const fileStats = await lstat(path);
  if (!fileStats.isDirectory())
    throw new InvalidPathError({ invalidPath: path });
};
