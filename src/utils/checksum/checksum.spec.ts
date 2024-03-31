import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getFileChecksum } from "@/utils/checksum/checksum.js";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";

describe("getFileChecksum", () => {
  const testFilePath = join(__dirname, "test-checksum.txt");
  const testContent = "Hello, world!";
  // SHA-256 checksum of the testContent
  const expectedChecksum =
    "315f5bdb76d078c43b8ac0064e4a0164612b1fce77c869345bfc94c75894edd3";

  beforeAll(() => {
    writeFileSync(testFilePath, testContent);
  });

  afterAll(() => {
    unlinkSync(testFilePath);
  });

  it("calculates the correct checksum for a file", async () => {
    const checksum = await getFileChecksum(testFilePath);

    expect(checksum).toEqual(expectedChecksum);
  });

  it("throws an error for a non-existent file", async () => {
    await expect(getFileChecksum("nonexistent.txt")).rejects.toThrow();
  });
});
