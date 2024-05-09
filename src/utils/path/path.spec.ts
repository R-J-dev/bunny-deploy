import { describe, expect, it } from "vitest";
import { getPathWithoutLeadingSlash } from "./path.js";

describe("getPathWithoutLeadingSlash", () => {
  it("should remove a leading slash in a given path", () => {
    expect(getPathWithoutLeadingSlash("/test/path/")).toBe("test/path/");
  });
  it("should not remove the first character in a given path without a leading slash", () => {
    expect(getPathWithoutLeadingSlash("test/path/")).toBe("test/path/");
  });
});
