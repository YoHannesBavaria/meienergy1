import { describe, expect, it } from "vitest";
import { getPageByPath, getSiteContent, normalizePath, pathToSlugParts, slugPartsToPath } from "./content";

describe("meienergy content utils", () => {
  it("normalizes paths", () => {
    expect(normalizePath("ueber-uns/")).toBe("/ueber-uns");
    expect(normalizePath("/")).toBe("/");
  });

  it("roundtrips slug parts", () => {
    const route = "/kursuebersicht";
    expect(slugPartsToPath(pathToSlugParts(route))).toBe(route);
    expect(slugPartsToPath([])).toBe("/");
  });

  it("loads site content with menu and pages", async () => {
    const content = await getSiteContent();
    expect(content.pages.length).toBeGreaterThan(40);
    expect(content.menuItems.length).toBeGreaterThan(5);
    expect(getPageByPath("/", content)).not.toBeNull();
    expect(getPageByPath("/kursuebersicht", content)).not.toBeNull();
  });
});
