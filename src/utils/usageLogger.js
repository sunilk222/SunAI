const LOG_KEY = "voiceapp_usage_logs";
const MAX_LOGS = 500;
const ERROR_KEY = "sunai_error_logs";
const MAX_ERRORS = 100;

function getLogs() {
  try {
    const data = localStorage.getItem(LOG_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLogs(logs) {
  const trimmed = logs.slice(-MAX_LOGS);
  localStorage.setItem(LOG_KEY, JSON.stringify(trimmed));
}

export function logUsage(user, action, details = {}) {
  const device = user?.device || {};
  const entry = {
    timestamp: new Date().toISOString(),
    userName: user?.name || "Anonymous",
    userEmail: user?.email || "N/A",
    sessionId: user?.sessionId || "N/A",
    action,
    browser: device.browser || "N/A",
    os: device.os || "N/A",
    deviceType: device.device || "N/A",
    screen: device.screen || "N/A",
    timezone: device.timezone || "N/A",
    ...details,
  };

  const logs = getLogs();
  logs.push(entry);
  saveLogs(logs);

  return entry;
}

export function getUsageLogs() {
  return getLogs();
}

export function clearUsageLogs() {
  localStorage.removeItem(LOG_KEY);
}

export function getUsageStats() {
  const logs = getLogs();
  const users = new Set();
  let speak = 0, download = 0, violations = 0;
  for (const log of logs) {
    if (log.action === "SPEAK") speak++;
    if (log.action === "DOWNLOAD_AUDIO") download++;
    if (log.action === "CONTENT_VIOLATION") violations++;
    if (log.userEmail) users.add(log.userEmail);
  }
  return { total: logs.length, speak, download, violations, uniqueUsers: users.size };
}

export function getUserSummary() {
  const logs = getLogs();
  const map = {};
  for (const log of logs) {
    const key = log.userEmail || "N/A";
    if (!map[key]) {
      map[key] = {
        name: log.userName,
        id: key,
        total: 0,
        speak: 0,
        download: 0,
        violations: 0,
        lastActive: log.timestamp,
        browser: log.browser || "N/A",
        os: log.os || "N/A",
        deviceType: log.deviceType || "N/A",
        screen: log.screen || "N/A",
        timezone: log.timezone || "N/A",
      };
    }
    map[key].total++;
    if (log.action === "SPEAK") map[key].speak++;
    if (log.action === "DOWNLOAD_AUDIO") map[key].download++;
    if (log.action === "CONTENT_VIOLATION") map[key].violations++;
    if (log.timestamp > map[key].lastActive) {
      map[key].lastActive = log.timestamp;
      map[key].browser = log.browser || map[key].browser;
      map[key].os = log.os || map[key].os;
      map[key].deviceType = log.deviceType || map[key].deviceType;
      map[key].screen = log.screen || map[key].screen;
      map[key].timezone = log.timezone || map[key].timezone;
    }
  }
  return Object.values(map).sort((a, b) => b.total - a.total);
}

function getErrors() {
  try {
    const data = localStorage.getItem(ERROR_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function logError(message, source, lineno, colno, stack) {
  const entry = {
    timestamp: new Date().toISOString(),
    message: String(message).slice(0, 500),
    source: source || "unknown",
    line: lineno || 0,
    col: colno || 0,
    stack: stack ? String(stack).slice(0, 1000) : "",
  };
  const errors = getErrors();
  errors.push(entry);
  const trimmed = errors.slice(-MAX_ERRORS);
  localStorage.setItem(ERROR_KEY, JSON.stringify(trimmed));
}

export function getErrorLogs() {
  return getErrors();
}

export function clearErrorLogs() {
  localStorage.removeItem(ERROR_KEY);
}

export function initErrorCapture() {
  window.onerror = (message, source, lineno, colno, error) => {
    logError(message, source, lineno, colno, error?.stack);
  };
  window.onunhandledrejection = (event) => {
    const reason = event.reason;
    logError(
      reason?.message || String(reason),
      "UnhandledPromiseRejection",
      0, 0,
      reason?.stack
    );
  };
}

export function exportLogsAsCSV() {
  const logs = getLogs();
  if (logs.length === 0) return null;

  const headers = Object.keys(logs[0]);
  const csvRows = [
    headers.join(","),
    ...logs.map((log) =>
      headers
        .map((h) => {
          const val = String(log[h] ?? "").replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(",")
    ),
  ];

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `SunAI_Logs_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}