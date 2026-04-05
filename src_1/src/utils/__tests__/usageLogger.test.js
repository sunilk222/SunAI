import { logUsage, getUsageLogs, clearUsageLogs, exportLogsAsCSV } from "../usageLogger";

beforeEach(() => {
  localStorage.clear();
});

describe("logUsage", () => {
  test("creates a log entry with correct fields", () => {
    const user = { name: "Test User", email: "test@example.com" };
    const entry = logUsage(user, "SPEAK", { language: "en-US" });

    expect(entry.userName).toBe("Test User");
    expect(entry.userEmail).toBe("test@example.com");
    expect(entry.action).toBe("SPEAK");
    expect(entry.language).toBe("en-US");
    expect(entry.timestamp).toBeDefined();
  });

  test("uses Anonymous for missing user", () => {
    const entry = logUsage(null, "SPEAK");
    expect(entry.userName).toBe("Anonymous");
    expect(entry.userEmail).toBe("N/A");
  });

  test("persists logs to localStorage", () => {
    logUsage({ name: "A" }, "ACTION_1");
    logUsage({ name: "B" }, "ACTION_2");

    const logs = getUsageLogs();
    expect(logs).toHaveLength(2);
    expect(logs[0].action).toBe("ACTION_1");
    expect(logs[1].action).toBe("ACTION_2");
  });

  test("trims logs to max 500 entries", () => {
    for (let i = 0; i < 510; i++) {
      logUsage({ name: "Test" }, `ACTION_${i}`);
    }
    const logs = getUsageLogs();
    expect(logs.length).toBeLessThanOrEqual(500);
  });
});

describe("getUsageLogs", () => {
  test("returns empty array when no logs exist", () => {
    expect(getUsageLogs()).toEqual([]);
  });
});

describe("clearUsageLogs", () => {
  test("removes all logs from localStorage", () => {
    logUsage({ name: "Test" }, "ACTION");
    expect(getUsageLogs()).toHaveLength(1);

    clearUsageLogs();
    expect(getUsageLogs()).toEqual([]);
  });
});

describe("exportLogsAsCSV", () => {
  test("returns null when no logs exist", () => {
    const result = exportLogsAsCSV();
    expect(result).toBeNull();
  });

  test("triggers download when logs exist", () => {
    logUsage({ name: "Test" }, "SPEAK");

    const mockClick = jest.fn();
    const mockAppendChild = jest.spyOn(document.body, "appendChild").mockImplementation(() => {});
    const mockRemoveChild = jest.spyOn(document.body, "removeChild").mockImplementation(() => {});

    const createElementOrig = document.createElement.bind(document);
    jest.spyOn(document, "createElement").mockImplementation((tag) => {
      const el = createElementOrig(tag);
      if (tag === "a") {
        el.click = mockClick;
      }
      return el;
    });

    global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = jest.fn();

    exportLogsAsCSV();

    expect(mockClick).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();

    mockAppendChild.mockRestore();
    mockRemoveChild.mockRestore();
    document.createElement.mockRestore();
    delete global.URL.createObjectURL;
    delete global.URL.revokeObjectURL;
  });
});
