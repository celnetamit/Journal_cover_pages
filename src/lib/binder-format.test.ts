import { describe, it, expect } from "vitest";
import {
  cleanIcv,
  compactKeyword,
  frontCoverTitleClass,
  initials,
  lowerRoman,
  titleCaseName,
} from "@/lib/binder-format";

describe("initials", () => {
  it("takes the first two word initials, uppercased", () => {
    expect(initials("Journal of Advanced Database")).toBe("JO");
    expect(initials("nolegein")).toBe("N");
    expect(initials("  spaced   out name")).toBe("SO");
  });
});

describe("titleCaseName", () => {
  it("title-cases each word", () => {
    expect(titleCaseName("journal of LAW")).toBe("Journal Of Law");
  });
  it("preserves the NOLEGEIN brand token", () => {
    expect(titleCaseName("NOLEGEIN journal")).toBe("NOLEGEIN Journal");
  });
});

describe("compactKeyword", () => {
  it("returns the first token, stripping leading punctuation", () => {
    expect(compactKeyword("  •Strategic Management")).toBe("Strategic");
    expect(compactKeyword("AI/ML systems")).toBe("AI");
    expect(compactKeyword("")).toBe("");
  });
});

describe("lowerRoman", () => {
  it("maps 1..10 to roman numerals", () => {
    expect(lowerRoman(1)).toBe("i");
    expect(lowerRoman(4)).toBe("iv");
  });
  it("falls back to the number for out-of-range values", () => {
    expect(lowerRoman(11)).toBe("11");
  });
});

describe("cleanIcv", () => {
  it("strips an ICV prefix", () => {
    expect(cleanIcv("ICV: 62.07")).toBe("62.07");
    expect(cleanIcv("62.07")).toBe("62.07");
  });
});

describe("frontCoverTitleClass", () => {
  it("buckets the class by title length", () => {
    expect(frontCoverTitleClass("Short")).toBe("front-cover-title");
    expect(frontCoverTitleClass("x".repeat(40))).toBe("front-cover-title balanced");
    expect(frontCoverTitleClass("x".repeat(60))).toBe("front-cover-title compact");
    expect(frontCoverTitleClass("x".repeat(80))).toBe("front-cover-title ultra-compact");
  });
});
