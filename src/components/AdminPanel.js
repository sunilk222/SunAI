import React, { useState, useMemo } from "react";
import {
  getUsageLogs,
  getUsageStats,
  getUserSummary,
  clearUsageLogs,
  exportLogsAsCSV,
  getErrorLogs,
  clearErrorLogs,
} from "../utils/usageLogger";

const ADMIN_HASH = process.env.REACT_APP_ADMIN_HASH;
const AUTH_KEY = "sunai_admin_auth";

async function sha256(text) {
  const encoded = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function AdminPanel({ mode = "dashboard", onAuthenticated, onCancel }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === "1");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [tab, setTab] = useState("usage");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogin = async (e) => {
    e.preventDefault();
    setVerifying(true);
    try {
      const hash = await sha256(password);
      if (hash === ADMIN_HASH) {
        sessionStorage.setItem(AUTH_KEY, "1");
        setAuthed(true);
        setAuthError(false);
        if (onAuthenticated) onAuthenticated();
      } else {
        setAuthError(true);
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
    setPassword("");
  };

  const refresh = () => setRefreshKey((k) => k + 1);

  if (mode === "login" || !authed) {
    return (
      <div className="admin-panel">
        <div className="admin-login">
          <h3 className="admin-section-title">{"\u{1F512}"} Admin Access</h3>
          <form onSubmit={handleLogin} className="admin-login-form">
            <input
              type="password"
              className={`admin-password-input ${authError ? "invalid" : ""}`}
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setAuthError(false); }}
              autoComplete="off"
              autoFocus
            />
            <div className="admin-login-actions">
              <button type="submit" className="admin-login-btn" disabled={verifying}>{verifying ? "Verifying..." : "Unlock"}</button>
              {onCancel && <button type="button" className="admin-login-btn admin-cancel-btn" onClick={onCancel}>Cancel</button>}
            </div>
          </form>
          {authError && <span className="admin-auth-error">Incorrect password</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel" key={refreshKey}>
      <div className="admin-header">
        <h3 className="admin-section-title">{"\u{1F6E0}"} Admin Dashboard</h3>
        <div className="admin-header-actions">
          <button className="admin-sm-btn" onClick={refresh} type="button">{"\u21BB"} Refresh</button>
          <button className="admin-sm-btn admin-logout-btn" onClick={handleLogout} type="button">{"\u2715"} Logout</button>
        </div>
      </div>

      <div className="admin-tabs">
        {["usage", "errors", "system"].map((t) => (
          <button
            key={t}
            className={`admin-tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
            type="button"
          >
            {t === "usage" && "\u{1F4CA} Usage"}
            {t === "errors" && "\u{1F6A8} Errors"}
            {t === "system" && "\u{1F4BB} System"}
          </button>
        ))}
      </div>

      {tab === "usage" && <UsageTab onRefresh={refresh} />}
      {tab === "errors" && <ErrorsTab onRefresh={refresh} />}
      {tab === "system" && <SystemTab />}
    </div>
  );
}

function UsageTab({ onRefresh }) {
  const stats = useMemo(() => getUsageStats(), []);
  const userSummary = useMemo(() => getUserSummary(), []);
  const logs = useMemo(() => getUsageLogs().slice().reverse(), []);
  const [showAllUsers, setShowAllUsers] = useState(false);

  const visibleUsers = showAllUsers ? userSummary : userSummary.slice(0, 5);

  const handleClear = () => {
    if (window.confirm("Clear all usage logs? This cannot be undone.")) {
      clearUsageLogs();
      onRefresh();
    }
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-summary">
        <StatCard label="Total Actions" value={stats.total} color="var(--text)" />
        <StatCard label="Speak" value={stats.speak} color="var(--green)" />
        <StatCard label="Downloads" value={stats.download} color="var(--blue)" />
        <StatCard label="Violations" value={stats.violations} color="var(--red)" />
        <StatCard label="Unique Users" value={stats.uniqueUsers} color="var(--text2)" />
      </div>

      {userSummary.length > 0 && (
        <div className="admin-user-summary">
          <h4 className="admin-subsection-title">{"\u{1F465}"} User Summary</h4>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Device</th>
                  <th>Browser / OS</th>
                  <th>Timezone</th>
                  <th>Total</th>
                  <th>Speak</th>
                  <th>DL</th>
                  <th>Violations</th>
                  <th>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((u, i) => (
                  <tr key={i}>
                    <td className="admin-cell-user" title={u.id}>{u.name}</td>
                    <td className="admin-cell-device">
                      <span className="device-badge">{u.deviceType === "Mobile" ? "\u{1F4F1}" : u.deviceType === "Tablet" ? "\u{1F4F1}" : "\u{1F4BB}"} {u.deviceType}</span>
                      <span className="device-screen">{u.screen}</span>
                    </td>
                    <td className="admin-cell-browser">{u.browser} / {u.os}</td>
                    <td className="admin-cell-tz">{u.timezone}</td>
                    <td><strong>{u.total}</strong></td>
                    <td>{u.speak}</td>
                    <td>{u.download}</td>
                    <td>{u.violations > 0 ? <span className="admin-badge badge-red">{u.violations}</span> : "0"}</td>
                    <td className="admin-cell-time">{formatTime(u.lastActive)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {userSummary.length > 5 && (
            <button className="admin-sm-btn admin-show-more" onClick={() => setShowAllUsers((s) => !s)} type="button">
              {showAllUsers ? "Show less" : `Show all ${userSummary.length} users`}
            </button>
          )}
        </div>
      )}

      <div className="admin-actions-row">
        <button className="admin-sm-btn" onClick={exportLogsAsCSV} type="button">{"\u2B07"} Export CSV</button>
        <button className="admin-sm-btn admin-danger-btn" onClick={handleClear} type="button">{"\u{1F5D1}"} Clear Logs</button>
      </div>

      <h4 className="admin-subsection-title">{"\u{1F4DD}"} Activity Log</h4>
      {logs.length === 0 ? (
        <p className="admin-empty">No usage logs yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Device</th>
                <th>Action</th>
                <th>Language</th>
                <th>Chars</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i}>
                  <td className="admin-cell-time">{formatTime(log.timestamp)}</td>
                  <td className="admin-cell-user" title={log.userEmail}>{log.userName}</td>
                  <td className="admin-cell-device-sm">{log.deviceType === "Mobile" ? "\u{1F4F1}" : "\u{1F4BB}"} {log.browser || "-"}</td>
                  <td><ActionBadge action={log.action} /></td>
                  <td>{log.language || "-"}</td>
                  <td>{log.textLength || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ErrorsTab({ onRefresh }) {
  const errors = useMemo(() => getErrorLogs().slice().reverse(), []);
  const [expandedIdx, setExpandedIdx] = useState(null);

  const handleClear = () => {
    if (window.confirm("Clear all error logs?")) {
      clearErrorLogs();
      onRefresh();
    }
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-actions-row">
        <span className="admin-count">{errors.length} error{errors.length !== 1 ? "s" : ""} captured</span>
        <button className="admin-sm-btn admin-danger-btn" onClick={handleClear} type="button">{"\u{1F5D1}"} Clear</button>
      </div>

      {errors.length === 0 ? (
        <p className="admin-empty">No errors captured. The app is running smoothly.</p>
      ) : (
        <div className="admin-error-list">
          {errors.map((err, i) => (
            <div key={i} className="admin-error-item" onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}>
              <div className="admin-error-header">
                <span className="admin-error-badge">ERROR</span>
                <span className="admin-error-msg">{err.message}</span>
                <span className="admin-error-time">{formatTime(err.timestamp)}</span>
              </div>
              {expandedIdx === i && (
                <div className="admin-error-details">
                  <p><strong>Source:</strong> {err.source}:{err.line}:{err.col}</p>
                  {err.stack && <pre className="admin-stack">{err.stack}</pre>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SystemTab() {
  const info = useMemo(() => {
    const ua = navigator.userAgent;
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
    let browser = "Unknown";
    if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
    else if (ua.includes("Edg")) browser = "Edge";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";

    let lsUsed = 0;
    try {
      for (const key of Object.keys(localStorage)) {
        lsUsed += (localStorage.getItem(key) || "").length * 2;
      }
    } catch { /* ignore */ }

    return {
      browser,
      device: isMobile ? "Mobile" : "Desktop",
      screen: `${window.screen.width} x ${window.screen.height}`,
      pixelRatio: window.devicePixelRatio,
      language: navigator.language,
      online: navigator.onLine ? "Yes" : "No",
      cores: navigator.hardwareConcurrency || "N/A",
      memory: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : "N/A",
      wasmSupport: typeof WebAssembly === "object" ? "Supported" : "Not supported",
      opfsSupport: typeof navigator.storage?.getDirectory === "function" ? "Supported" : "Not supported",
      lsUsed: `${(lsUsed / 1024).toFixed(1)} KB`,
      platform: navigator.platform || "N/A",
      cookiesEnabled: navigator.cookieEnabled ? "Yes" : "No",
    };
  }, []);

  const entries = [
    ["Browser", info.browser],
    ["Device Type", info.device],
    ["Platform", info.platform],
    ["Screen", info.screen],
    ["Pixel Ratio", info.pixelRatio],
    ["Language", info.language],
    ["Online", info.online],
    ["CPU Cores", info.cores],
    ["Device Memory", info.memory],
    ["WebAssembly", info.wasmSupport],
    ["OPFS Storage", info.opfsSupport],
    ["LocalStorage Used", info.lsUsed],
    ["Cookies Enabled", info.cookiesEnabled],
  ];

  return (
    <div className="admin-tab-content">
      <div className="admin-system-grid">
        {entries.map(([label, value]) => (
          <div key={label} className="admin-system-row">
            <span className="admin-system-label">{label}</span>
            <span className="admin-system-value">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="admin-stat-card">
      <span className="admin-stat-value" style={{ color }}>{value}</span>
      <span className="admin-stat-label">{label}</span>
    </div>
  );
}

function ActionBadge({ action }) {
  const map = {
    SPEAK: { label: "Speak", cls: "badge-green" },
    DOWNLOAD_AUDIO: { label: "Download", cls: "badge-blue" },
    CONTENT_VIOLATION: { label: "Violation", cls: "badge-red" },
  };
  const info = map[action] || { label: action, cls: "" };
  return <span className={`admin-badge ${info.cls}`}>{info.label}</span>;
}

function formatTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export default AdminPanel;