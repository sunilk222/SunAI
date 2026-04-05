const LOG_KEY = "voiceapp_usage_logs";
const MAX_LOGS = 500;

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
  const entry = {
    timestamp: new Date().toISOString(),
    userName: user?.name || "Anonymous",
    userEmail: user?.email || "N/A",
    sessionId: user?.sessionId || "N/A",
    action,
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
  a.download = `VoiceApp_Logs_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
