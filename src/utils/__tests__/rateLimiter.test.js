import { checkRateLimit } from "../rateLimiter";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("checkRateLimit", () => {
  test("allows the first request", () => {
    const result = checkRateLimit("test-action-1");
    expect(result.allowed).toBe(true);
    expect(result.waitSec).toBe(0);
  });

  test("allows up to 5 requests within the window", () => {
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit("test-action-2");
      expect(result.allowed).toBe(true);
    }
  });

  test("blocks the 6th request within the window", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("test-action-3");
    }
    const result = checkRateLimit("test-action-3");
    expect(result.allowed).toBe(false);
    expect(result.waitSec).toBeGreaterThan(0);
    expect(result.waitSec).toBeLessThanOrEqual(60);
  });

  test("allows requests again after the window expires", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("test-action-4");
    }
    expect(checkRateLimit("test-action-4").allowed).toBe(false);

    jest.advanceTimersByTime(61000);

    const result = checkRateLimit("test-action-4");
    expect(result.allowed).toBe(true);
  });

  test("tracks different actions independently", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("action-a");
    }
    expect(checkRateLimit("action-a").allowed).toBe(false);
    expect(checkRateLimit("action-b").allowed).toBe(true);
  });

  test("returns correct waitSec when blocked", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("test-action-5");
    }

    jest.advanceTimersByTime(30000);

    const result = checkRateLimit("test-action-5");
    expect(result.allowed).toBe(false);
    expect(result.waitSec).toBeLessThanOrEqual(30);
    expect(result.waitSec).toBeGreaterThan(0);
  });
});
