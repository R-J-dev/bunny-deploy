import { logDebug } from "@/logger.js";
import { getPathWithoutLeadingSlash } from "@/utils/path/path.js";
import { Got } from "got";
import { z } from "zod";

const ListFileItem = z.object({
  Guid: z.string(),
  StorageZoneName: z.string(),
  Path: z.string(),
  ObjectName: z.string(),
  Length: z.number(),
  LastChanged: z.string(),
  ServerId: z.number(),
  ArrayNumber: z.number(),
  IsDirectory: z.boolean(),
  UserId: z.string(),
  ContentType: z.string(),
  DateCreated: z.string(),
  StorageZoneId: z.number(),
  Checksum: z.string().nullable(),
  ReplicatedZones: z.string().nullable(),
});

const ListFileResponseSchema = z.array(ListFileItem);
export type ListFileResponse = z.infer<typeof ListFileResponseSchema>;
export type ListFileItem = z.infer<typeof ListFileItem>;

export interface ListFiles {
  client: Got;
  path: string;
  /**
   * Disables runtime response type validation, which is enabled by default.
   */
  disableTypeValidation: boolean;
}

export const listFiles = async ({
  client,
  path,
  disableTypeValidation = false,
}: ListFiles) => {
  logDebug(`Retrieving file info for: ${path}`);
  // Remote paths received from this request starts with a slash, which is not allowed to pass as an url to got (when a prefixUrl is defined).
  // See for more info: https://github.com/sindresorhus/got/blob/main/documentation/2-options.md#note-2
  const response = await client.get(getPathWithoutLeadingSlash(path), {
    headers: { "Content-Type": "application/json" },
    resolveBodyOnly: true,
    responseType: "json",
  });
  return disableTypeValidation
    ? (response as ListFileResponse)
    : ListFileResponseSchema.parse(response);
};
