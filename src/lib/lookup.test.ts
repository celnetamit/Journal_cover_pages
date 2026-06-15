import { describe, it, expect } from "vitest";
import { dynamicKey, journalLookupKeys } from "@/lib/lookup";
import type { Journal } from "@/lib/journals";

describe("dynamicKey", () => {
  it("lowercases and strips non-alphanumerics", () => {
    expect(dynamicKey("JOADMS")).toBe("joadms");
    expect(dynamicKey("Law & Order!")).toBe("laworder");
    expect(dynamicKey(undefined)).toBe("");
  });

  it("decodes &amp; before stripping", () => {
    expect(dynamicKey("A &amp; B")).toBe("ab");
  });
});

describe("journalLookupKeys", () => {
  it("returns non-empty normalized keys and drops blanks", () => {
    const keys = journalLookupKeys({
      abbreviation: "JOADMS",
      shortName: "",
      name: "Journal of X",
      id: "123",
    } as Journal);
    expect(keys).toContain("joadms");
    expect(keys).toContain("journalofx");
    expect(keys).toContain("123");
    expect(keys).not.toContain("");
  });
});
