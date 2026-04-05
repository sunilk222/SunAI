const isTouchDevice = () =>
  typeof window !== "undefined" &&
  ("ontouchstart" in window || navigator.maxTouchPoints > 0);

export function initSecurity() {
  if (process.env.NODE_ENV === "production") {
    disableConsoleLogs();
  }
  disableDevTools();
  disableContextMenu();
  if (!isTouchDevice()) {
    disableTextSelection();
  }
  startAntiDebug();
}

function disableConsoleLogs() {
  const noop = () => {};
  ["log", "debug", "info", "warn", "table", "dir", "trace", "group", "groupEnd"].forEach((m) => {
    window.console[m] = noop;
  });
}

function disableDevTools() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "F12") { e.preventDefault(); return false; }
    if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) { e.preventDefault(); return false; }
    if (e.ctrlKey && e.key === "u") { e.preventDefault(); return false; }
    if (e.ctrlKey && e.key === "s") { e.preventDefault(); return false; }
  });
}

function disableContextMenu() {
  document.addEventListener("contextmenu", (e) => e.preventDefault());
}

function disableTextSelection() {
  const style = document.createElement("style");
  style.textContent = `
    body, body * {
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      user-select: none !important;
    }
    textarea, input[type="text"], input[type="number"], input[type="email"],
    input[type="password"], input[type="search"], input[type="url"],
    [contenteditable="true"] {
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
      user-select: text !important;
    }
  `;
  document.head.appendChild(style);
}

function startAntiDebug() {
  const threshold = 100;
  setInterval(() => {
    const start = performance.now();
    // eslint-disable-next-line no-debugger
    debugger;
    const elapsed = performance.now() - start;
    if (elapsed > threshold) {
      document.body.innerHTML = "";
    }
  }, 3000);
}