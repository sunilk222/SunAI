import { sanitizeText } from "../sanitize";

describe("sanitizeText", () => {
  test("returns empty string for non-string input", () => {
    expect(sanitizeText(null)).toBe("");
    expect(sanitizeText(undefined)).toBe("");
    expect(sanitizeText(123)).toBe("");
    expect(sanitizeText({})).toBe("");
  });

  test("passes through normal text unchanged", () => {
    expect(sanitizeText("Hello world")).toBe("Hello world");
  });

  test("strips HTML tags", () => {
    expect(sanitizeText("<script>alert(1)</script>")).toBe("alert(1)");
    expect(sanitizeText("<b>bold</b>")).toBe("bold");
    expect(sanitizeText('<a href="x">link</a>')).toBe("link");
  });

  test("strips stray angle brackets after tag removal", () => {
    expect(sanitizeText("a < b > c")).toBe("a  c");
    expect(sanitizeText("use > not <")).toBe("use  not ");
  });

  test("handles nested tags", () => {
    expect(sanitizeText("<div><p>text</p></div>")).toBe("text");
  });

  test("truncates text to 5000 characters", () => {
    const longText = "a".repeat(6000);
    expect(sanitizeText(longText)).toHaveLength(5000);
  });

  test("does not truncate text under 5000 characters", () => {
    const text = "a".repeat(4999);
    expect(sanitizeText(text)).toHaveLength(4999);
  });

  test("returns empty string for empty input", () => {
    expect(sanitizeText("")).toBe("");
  });
});
