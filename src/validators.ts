import { InvalidUrlProtocolError } from "@/errors.js";

/**
 * Validates if a given string is a valid URL and has an expected protocol.
 * If the given url is not a valid url, it will throw an error.
 * If the URL's protocol is not equal to the expected protocol, an InvalidUrlProtocolError is thrown.
 *
 * @param url The URL string to be validated.
 * @param expectedProtocol The protocol that is expected.
 */
export const validateUrl = (url: string, expectedProtocol: string) => {
  const validUrl = new URL(url);
  if (validUrl.protocol !== expectedProtocol) {
    throw new InvalidUrlProtocolError({
      invalidProtocol: validUrl.protocol,
      expectedProtocol: expectedProtocol,
    });
  }
};
