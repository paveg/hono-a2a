import { describe, it, expect } from "vitest";
import { parseExtensionHeader } from "../src/json-rpc-handler.js";

describe("parseExtensionHeader", () => {
  it("returns empty array for undefined", () => {
    expect(parseExtensionHeader(undefined)).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(parseExtensionHeader("")).toEqual([]);
  });

  it("returns empty array for comma-only input", () => {
    expect(parseExtensionHeader(",,,")).toEqual([]);
  });

  it("parses single extension", () => {
    expect(parseExtensionHeader("ext1")).toEqual(["ext1"]);
  });

  it("parses multiple extensions", () => {
    expect(parseExtensionHeader("ext1,ext2,ext3")).toEqual([
      "ext1",
      "ext2",
      "ext3",
    ]);
  });

  it("trims whitespace around extensions", () => {
    expect(parseExtensionHeader("  ext1 , ext2  ,  ext3  ")).toEqual([
      "ext1",
      "ext2",
      "ext3",
    ]);
  });

  it("deduplicates repeated extensions", () => {
    expect(parseExtensionHeader("ext1,ext2,ext1,ext2")).toEqual([
      "ext1",
      "ext2",
    ]);
  });

  it("filters out empty segments from trailing commas", () => {
    expect(parseExtensionHeader("ext1,,ext2,")).toEqual(["ext1", "ext2"]);
  });
});
