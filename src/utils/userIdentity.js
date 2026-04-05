const USER_KEY = "sunai_user_identity";

function detectBrowser(ua) {
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("OPR") || ua.includes("Opera")) return "Opera";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  return "Unknown";
}

function detectOS(ua) {
  if (/Windows NT 10/i.test(ua)) return "Windows 10/11";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS X/i.test(ua)) return "macOS";
  if (/Android/i.test(ua)) {
    const m = ua.match(/Android\s([\d.]+)/);
    return m ? `Android ${m[1]}` : "Android";
  }
  if (/iPhone|iPad|iPod/i.test(ua)) {
    const m = ua.match(/OS\s([\d_]+)/);
    return m ? `iOS ${m[1].replace(/_/g, ".")}` : "iOS";
  }
  if (/Linux/i.test(ua)) return "Linux";
  return "Unknown OS";
}

function detectDevice(ua) {
  if (/iPad/i.test(ua)) return "Tablet";
  if (/Mobi|Android.*Mobile|iPhone|iPod/i.test(ua)) return "Mobile";
  return "Desktop";
}

function generateShortId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().split("-")[0];
  }
  return Math.random().toString(36).slice(2, 10);
}

function buildDeviceFingerprint() {
  const ua = navigator.userAgent;
  return {
    browser: detectBrowser(ua),
    os: detectOS(ua),
    device: detectDevice(ua),
    screen: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language || "unknown",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown",
    cores: navigator.hardwareConcurrency || 0,
    memory: navigator.deviceMemory || 0,
    touchSupport: "ontouchstart" in window || navigator.maxTouchPoints > 0,
  };
}

export function getUserIdentity() {
  try {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      const identity = JSON.parse(stored);
      const currentDevice = buildDeviceFingerprint();
      identity.device = currentDevice;
      identity.lastSeen = new Date().toISOString();
      localStorage.setItem(USER_KEY, JSON.stringify(identity));
      return identity;
    }
  } catch { /* ignore corrupt data */ }

  const device = buildDeviceFingerprint();
  const identity = {
    id: generateShortId(),
    name: `${device.device}_${device.browser}_${generateShortId().slice(0, 4)}`,
    createdAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    device,
  };

  try {
    localStorage.setItem(USER_KEY, JSON.stringify(identity));
  } catch { /* localStorage full */ }

  return identity;
}

export function getUserForLogging() {
  const identity = getUserIdentity();
  return {
    name: identity.name,
    email: identity.id,
    sessionId: sessionStorage.getItem("sunai_session") || createSession(),
    device: identity.device,
  };
}

function createSession() {
  const sid = `s_${generateShortId()}`;
  sessionStorage.setItem("sunai_session", sid);
  return sid;
}