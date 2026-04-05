import { getPiperVoiceId, hasPiperVoice, getPiperLanguages, getPiperVoiceInfo } from "../piperTTS";

describe("hasPiperVoice", () => {
  test("returns true for supported Piper languages", () => {
    expect(hasPiperVoice("en-US")).toBe(true);
    expect(hasPiperVoice("en-GB")).toBe(true);
    expect(hasPiperVoice("de-DE")).toBe(true);
    expect(hasPiperVoice("fr-FR")).toBe(true);
    expect(hasPiperVoice("ru-RU")).toBe(true);
  });

  test("returns false for unsupported languages", () => {
    expect(hasPiperVoice("hi-IN")).toBe(false);
    expect(hasPiperVoice("ja-JP")).toBe(false);
    expect(hasPiperVoice("zh-CN")).toBe(false);
    expect(hasPiperVoice("ko-KR")).toBe(false);
    expect(hasPiperVoice("xyz")).toBe(false);
  });

  test("returns false for empty/null input", () => {
    expect(hasPiperVoice("")).toBe(false);
    expect(hasPiperVoice(null)).toBe(false);
    expect(hasPiperVoice(undefined)).toBe(false);
  });
});

describe("getPiperVoiceId", () => {
  test("returns correct male voice ID for en-US", () => {
    expect(getPiperVoiceId("en-US", "male")).toBe("en_US-hfc_male-medium");
  });

  test("returns correct female voice ID for en-US", () => {
    expect(getPiperVoiceId("en-US", "female")).toBe("en_US-hfc_female-medium");
  });

  test("returns correct voice IDs for en-GB", () => {
    expect(getPiperVoiceId("en-GB", "male")).toBe("en_GB-alan-medium");
    expect(getPiperVoiceId("en-GB", "female")).toBe("en_GB-jenny_dioco-medium");
  });

  test("returns correct voice IDs for en-AU", () => {
    expect(getPiperVoiceId("en-AU", "male")).toBe("en_US-ryan-medium");
    expect(getPiperVoiceId("en-AU", "female")).toBe("en_US-amy-medium");
  });

  test("returns null for unsupported language", () => {
    expect(getPiperVoiceId("hi-IN", "male")).toBeNull();
    expect(getPiperVoiceId("xyz", "female")).toBeNull();
  });

  test("returns null for invalid voice type", () => {
    expect(getPiperVoiceId("en-US", "other")).toBeNull();
  });

  test("returns null for null language", () => {
    expect(getPiperVoiceId(null, "male")).toBeNull();
  });
});

describe("getPiperLanguages", () => {
  test("returns an array of language codes", () => {
    const langs = getPiperLanguages();
    expect(Array.isArray(langs)).toBe(true);
    expect(langs.length).toBeGreaterThan(0);
  });

  test("includes expected languages", () => {
    const langs = getPiperLanguages();
    expect(langs).toContain("en-US");
    expect(langs).toContain("en-GB");
    expect(langs).toContain("de-DE");
    expect(langs).toContain("fr-FR");
    expect(langs).toContain("es-ES");
    expect(langs).toContain("ru-RU");
  });

  test("has 18 languages in the voice map", () => {
    const langs = getPiperLanguages();
    expect(langs).toHaveLength(18);
  });
});

describe("getPiperVoiceInfo", () => {
  test("returns male and female names for supported language", () => {
    const info = getPiperVoiceInfo("en-US");
    expect(info).toEqual({ male: "James", female: "Emily" });
  });

  test("returns correct names for en-GB", () => {
    const info = getPiperVoiceInfo("en-GB");
    expect(info).toEqual({ male: "Alan", female: "Jenny" });
  });

  test("returns correct names for de-DE", () => {
    const info = getPiperVoiceInfo("de-DE");
    expect(info).toEqual({ male: "Thorsten", female: "Eva" });
  });

  test("returns null for unsupported language", () => {
    expect(getPiperVoiceInfo("hi-IN")).toBeNull();
    expect(getPiperVoiceInfo("xyz")).toBeNull();
  });

  test("returns null for null input", () => {
    expect(getPiperVoiceInfo(null)).toBeNull();
  });
});
