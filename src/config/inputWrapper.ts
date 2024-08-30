import { getInput, InputOptions } from "@actions/core";
import { logError } from "@/logger.js";

/**
 * Properties required to get and optionally transform and validate an input.
 * @template T The expected type of the transformed input.
 */
interface GetInputWrapperProps<T = string> {
  /**
   * The name of the input to retrieve.
   */
  inputName: string;
  /**
   * A custom error message to log when an error occurs
   */
  errorLogMessage?: string;
  /**
   * The options to pass to the getInput function
   */
  inputOptions?: InputOptions;
  /**
   * An optional function that transforms the input from a string to type T.
   * This is useful for converting the input into a different type or format,
   * such as converting a numeric string to a number.
   *
   * @param input The raw string input to transform.
   * @returns The input transformed to type T.
   */
  transformInput?: (input: string) => Promise<T>;
  /**
   * An optional validator function that checks the (transformed) input.
   * If the input is invalid, this function should throw an error.
   *
   * @param input The input of type T to validate.
   */
  validator?: (input: T) => Promise<void>;
}

/**
 * Retrieves an input by name, optionally transforms and validates it.
 *
 * This function is designed to work with GitHub Actions inputs, allowing
 * for more complex processing such as type conversion and validation.
 * If `transformInput` is provided, it will be used to convert the input
 * from a string to the desired type. If `validator` is provided, it will
 * be used to ensure the input meets certain criteria. Errors thrown by
 * either `transformInput` or `validator` are not caught within this function,
 * allowing them to be handled externally if needed.
 *
 * @template T The expected type of the transformed input.
 * @param {GetInputWrapperProps<T>} props The properties for retrieving and processing the input.
 * @returns {Promise<T>} The processed input, transformed and validated as per the provided functions.
 *
 * @example
 * // Retrieve a numeric input, converting from string to number
 * const numericInput = await getInputWrapper({
 *   inputName: 'myNumericInput',
 *   transformInput: async (input) => parseInt(input, 10),
 * });
 *
 * @example
 * // Retrieve and validate an input
 * const validatedInput = await getInputWrapper({
 *   inputName: 'myInput',
 *   validator: async (input) => {
 *     if (input !== 'expectedValue') {
 *       throw new Error('Input does not match expected value.');
 *     }
 *   },
 * });
 */
export const getInputWrapper = async <T = string>({
  inputName,
  errorLogMessage = `Something went wrong while trying to retrieve the input: '${inputName}'`,
  inputOptions,
  transformInput = async (input: string) => input as unknown as Promise<T>,
  validator,
}: GetInputWrapperProps<T>): Promise<T> => {
  try {
    const input = await transformInput(getInput(inputName, inputOptions));
    if (validator) await validator(input);
    return input;
  } catch (error) {
    logError(errorLogMessage);
    throw error;
  }
};
