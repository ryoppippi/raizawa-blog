import { describe, expect, it } from "vitest";
import { postsLabel } from "./plural";

describe("postsLabel (0-1-N)", () => {
  it("should pluralize zero (0)", () => {
    expect(postsLabel(0)).toBe("0 posts");
  });

  it("should keep the singular for one (1)", () => {
    expect(postsLabel(1)).toBe("1 post");
  });

  it("should pluralize the boundary above one", () => {
    expect(postsLabel(2)).toBe("2 posts");
  });

  it("should pluralize many (N)", () => {
    expect(postsLabel(98)).toBe("98 posts");
  });
});
