import { describe, expect, it } from "vitest";
import { readingMinutes } from "./reading-time";

const chars = (count: number): string => "あ".repeat(count);

describe("readingMinutes (0-1-N)", () => {
  it("should return 1 for empty content (0)", () => {
    expect(readingMinutes("")).toBe(1);
  });

  it("should return 1 for a single character (1)", () => {
    expect(readingMinutes("あ")).toBe(1);
  });

  it("should return 1 at the exact one-minute boundary", () => {
    expect(readingMinutes(chars(500))).toBe(1);
  });

  it("should round up just past the one-minute boundary", () => {
    expect(readingMinutes(chars(501))).toBe(2);
  });

  it("should scale for long content (N)", () => {
    expect(readingMinutes(chars(2600))).toBe(6);
  });

  it("should ignore whitespace when counting", () => {
    expect(readingMinutes(`${chars(500)}\n\n   \n`)).toBe(1);
  });
});
