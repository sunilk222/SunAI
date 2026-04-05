/**
 * Tests for the internal helper functions exposed indirectly through
 * downloadAudio.js. We test the text-chunking algorithm by extracting its
 * logic, and the Google TTS URL builder pattern.
 */

describe("splitTextIntoChunks logic", () => {
  // Re-implement the chunking algorithm for isolated testing.
  // This mirrors the logic in downloadAudio.js splitTextIntoChunks.
  function splitTextIntoChunks(text, maxLen = 200) {
    const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
    const chunks = [];
    let current = "";
    for (const sentence of sentences) {
      if (sentence.length > maxLen) {
        if (current) { chunks.push(current.trim()); current = ""; }
        const words = sentence.split(/\s+/);
        let wc = "";
        for (const word of words) {
          if ((wc + " " + word).trim().length > maxLen) {
            if (wc) chunks.push(wc.trim());
            wc = word;
          } else {
            wc = wc ? wc + " " + word : word;
          }
        }
        if (wc) current = wc;
      } else if ((current + sentence).length > maxLen) {
        if (current) chunks.push(current.trim());
        current = sentence;
      } else {
        current += sentence;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks.length > 0 ? chunks : [text.substring(0, maxLen)];
  }

  test("returns single chunk for short text", () => {
    const chunks = splitTextIntoChunks("Hello world.");
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe("Hello world.");
  });

  test("splits long text at sentence boundaries", () => {
    const text = "First sentence. ".repeat(20);
    const chunks = splitTextIntoChunks(text, 200);
    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk) => {
      expect(chunk.length).toBeLessThanOrEqual(220);
    });
  });

  test("handles text with no sentence delimiters", () => {
    const text = "word ".repeat(100);
    const chunks = splitTextIntoChunks(text, 200);
    expect(chunks.length).toBeGreaterThan(1);
  });

  test("handles empty text", () => {
    const chunks = splitTextIntoChunks("");
    expect(chunks).toHaveLength(1);
  });

  test("handles text exactly at maxLen", () => {
    const text = "a".repeat(200);
    const chunks = splitTextIntoChunks(text, 200);
    expect(chunks.length).toBeGreaterThanOrEqual(1);
  });

  test("splits very long sentences at word boundaries", () => {
    const longSentence = ("longword ".repeat(50)).trim();
    const chunks = splitTextIntoChunks(longSentence, 50);
    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk) => {
      expect(chunk.length).toBeLessThanOrEqual(60);
    });
  });
});

describe("Google TTS URL format", () => {
  function buildGoogleTTSUrl(text, langCode) {
    const ttsLang = langCode.split("-")[0];
    return `https://translate.google.com/translate_tts?ie=UTF-8&tl=${ttsLang}&client=tw-ob&q=${encodeURIComponent(text)}&textlen=${text.length}`;
  }

  test("builds correct URL for English", () => {
    const url = buildGoogleTTSUrl("Hello", "en-US");
    expect(url).toContain("tl=en");
    expect(url).toContain("q=Hello");
    expect(url).toContain("textlen=5");
  });

  test("encodes special characters in text", () => {
    const url = buildGoogleTTSUrl("Hello World!", "en-US");
    expect(url).toContain("q=Hello%20World!");
  });

  test("uses correct language code for Hindi", () => {
    const url = buildGoogleTTSUrl("test", "hi-IN");
    expect(url).toContain("tl=hi");
  });

  test("includes correct text length", () => {
    const text = "Testing length";
    const url = buildGoogleTTSUrl(text, "en-US");
    expect(url).toContain(`textlen=${text.length}`);
  });
});
