import { moderateContent, getViolationMessage } from "../contentModeration";

describe("moderateContent", () => {
  test("returns safe for normal text", () => {
    const result = moderateContent("Hello, welcome to our app!");
    expect(result.safe).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  test("returns safe for empty/null input", () => {
    expect(moderateContent("").safe).toBe(true);
    expect(moderateContent(null).safe).toBe(true);
    expect(moderateContent(undefined).safe).toBe(true);
  });

  test("returns safe for non-string input", () => {
    expect(moderateContent(123).safe).toBe(true);
  });

  test("detects hate speech", () => {
    const result = moderateContent("white supremacy is bad but I typed the phrase");
    expect(result.safe).toBe(false);
    expect(result.violations.some((v) => v.category === "HATE_SPEECH")).toBe(true);
  });

  test("detects abusive language", () => {
    const result = moderateContent("you are a motherfucker");
    expect(result.safe).toBe(false);
    expect(result.violations.some((v) => v.category === "ABUSIVE_LANGUAGE")).toBe(true);
  });

  test("detects sexual content", () => {
    const result = moderateContent("this is pornography");
    expect(result.safe).toBe(false);
    expect(result.violations.some((v) => v.category === "SEXUAL_CONTENT")).toBe(true);
  });

  test("detects violence encouragement", () => {
    const result = moderateContent("how to kill someone");
    expect(result.safe).toBe(false);
    expect(result.violations.some((v) => v.category === "VIOLENCE")).toBe(true);
  });

  test("detects illegal instructions", () => {
    const result = moderateContent("how to hack a website");
    expect(result.safe).toBe(false);
    expect(result.violations.some((v) => v.category === "ILLEGAL_INSTRUCTIONS")).toBe(true);
  });

  test("detects religious insults", () => {
    const result = moderateContent("burn the bible");
    expect(result.safe).toBe(false);
    expect(result.violations.some((v) => v.category === "RELIGIOUS_INSULTS")).toBe(true);
  });

  test("is case insensitive", () => {
    const result = moderateContent("HOW TO HACK");
    expect(result.safe).toBe(false);
  });

  test("detects multiple categories", () => {
    const result = moderateContent("fuck you and how to hack");
    expect(result.safe).toBe(false);
    expect(result.violations.length).toBeGreaterThanOrEqual(2);
  });
});

describe("getViolationMessage", () => {
  test("returns empty string for no violations", () => {
    expect(getViolationMessage([])).toBe("");
  });

  test("returns single category message", () => {
    const violations = [{ category: "HATE_SPEECH", label: "Hate Speech", matched: "test" }];
    const msg = getViolationMessage(violations);
    expect(msg).toContain("hate speech");
    expect(msg).toContain("not allowed");
  });

  test("returns multi-category message with 'and'", () => {
    const violations = [
      { category: "HATE_SPEECH", label: "Hate Speech", matched: "test" },
      { category: "VIOLENCE", label: "Violence Encouragement", matched: "test2" },
    ];
    const msg = getViolationMessage(violations);
    expect(msg).toContain("and");
    expect(msg).toContain("not allowed");
  });

  test("deduplicates labels", () => {
    const violations = [
      { category: "HATE_SPEECH", label: "Hate Speech", matched: "word1" },
      { category: "HATE_SPEECH", label: "Hate Speech", matched: "word2" },
    ];
    const msg = getViolationMessage(violations);
    expect(msg).toContain("hate speech");
    expect(msg).not.toContain("and");
  });
});
