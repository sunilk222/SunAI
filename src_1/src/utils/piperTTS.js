import { TtsSession } from "@mintplex-labs/piper-tts-web";

const LOCAL_WASM_PATHS = {
  onnxWasm: "/ort/",
  piperData: "/piper/piper_phonemize.data",
  piperWasm: "/piper/piper_phonemize.wasm",
};

// Patch the library's DEFAULT_WASM_PATHS via the exposed WASM_LOCATIONS
// reference so that init() uses local files even before wasmPaths is set
// in the constructor (library bug: wasmPaths is assigned after init starts).
if (TtsSession.WASM_LOCATIONS) {
  TtsSession.WASM_LOCATIONS.onnxWasm = LOCAL_WASM_PATHS.onnxWasm;
  TtsSession.WASM_LOCATIONS.piperData = LOCAL_WASM_PATHS.piperData;
  TtsSession.WASM_LOCATIONS.piperWasm = LOCAL_WASM_PATHS.piperWasm;
}

const VOICE_MAP = {
  "en-US": {
    male:   { id: "en_US-hfc_male-medium",   name: "James" },
    female: { id: "en_US-hfc_female-medium",  name: "Emily" },
  },
  "en-GB": {
    male:   { id: "en_GB-alan-medium",        name: "Alan" },
    female: { id: "en_GB-jenny_dioco-medium", name: "Jenny" },
  },
  "en-AU": {
    male:   { id: "en_US-ryan-medium",        name: "Ryan" },
    female: { id: "en_US-amy-medium",         name: "Amy" },
  },
  "en-IN": {
    male:   { id: "en_US-kusal-medium",       name: "Kusal" },
    female: { id: "en_US-kristin-medium",     name: "Kristin" },
  },
  "de-DE": {
    male:   { id: "de_DE-thorsten-medium",    name: "Thorsten" },
    female: { id: "de_DE-eva_k-x_low",       name: "Eva" },
  },
  "fr-FR": {
    male:   { id: "fr_FR-tom-medium",         name: "Tom" },
    female: { id: "fr_FR-siwis-medium",       name: "Siwis" },
  },
  "es-ES": {
    male:   { id: "es_ES-davefx-medium",      name: "Dave" },
    female: { id: "es_ES-sharvard-medium",    name: "Sharvard" },
  },
  "es-MX": {
    male:   { id: "es_MX-ald-medium",         name: "Aldo" },
    female: { id: "es_MX-claude-high",        name: "Claude" },
  },
  "ru-RU": {
    male:   { id: "ru_RU-ruslan-medium",      name: "Ruslan" },
    female: { id: "ru_RU-irina-medium",       name: "Irina" },
  },
  "nl-NL": {
    male:   { id: "nl_NL-mls_7432-low",      name: "Willem" },
    female: { id: "nl_NL-mls-medium",         name: "Fenna" },
  },
  "nl-BE": {
    male:   { id: "nl_BE-rdh-medium",         name: "Ruben" },
    female: { id: "nl_BE-nathalie-medium",    name: "Nathalie" },
  },
  "pl-PL": {
    male:   { id: "pl_PL-darkman-medium",     name: "Marek" },
    female: { id: "pl_PL-gosia-medium",       name: "Gosia" },
  },
  "uk-UA": {
    male:   { id: "uk_UA-ukrainian_tts-medium", name: "Taras" },
    female: { id: "uk_UA-lada-x_low",         name: "Lada" },
  },
  "hu-HU": {
    male:   { id: "hu_HU-imre-medium",        name: "Imre" },
    female: { id: "hu_HU-anna-medium",        name: "Anna" },
  },
  "ca-ES": {
    male:   { id: "ca_ES-upc_pau-x_low",     name: "Pau" },
    female: { id: "ca_ES-upc_ona-medium",     name: "Ona" },
  },
  "is-IS": {
    male:   { id: "is_IS-steinn-medium",      name: "Steinn" },
    female: { id: "is_IS-ugla-medium",        name: "Ugla" },
  },
  "fa-IR": {
    male:   { id: "fa_IR-amir-medium",        name: "Amir" },
    female: { id: "fa_IR-gyro-medium",        name: "Gyro" },
  },
  "kk-KZ": {
    male:   { id: "kk_KZ-issai-high",        name: "Issai" },
    female: { id: "kk_KZ-raya-x_low",        name: "Raya" },
  },
};

// ─── Per-voiceId session cache ──────────────────────────────────
const sessionCache = {};
const loadingPromises = {};

async function getSession(voiceId, onProgress) {
  if (sessionCache[voiceId]) return sessionCache[voiceId];
  if (loadingPromises[voiceId]) return loadingPromises[voiceId];

  loadingPromises[voiceId] = (async () => {
    TtsSession._instance = null;

    const session = await TtsSession.create({
      voiceId,
      progress: onProgress,
      wasmPaths: LOCAL_WASM_PATHS,
    });

    TtsSession._instance = null;

    sessionCache[voiceId] = session;
    delete loadingPromises[voiceId];
    return session;
  })();

  try {
    return await loadingPromises[voiceId];
  } catch (err) {
    delete loadingPromises[voiceId];
    throw err;
  }
}

// ─── WAV result cache (reuse speak result for download) ─────────
let lastResult = { voiceId: null, text: null, blob: null };

// ─── Public API ─────────────────────────────────────────────────

export function getPiperVoiceId(langCode, voiceType) {
  const entry = VOICE_MAP[langCode];
  if (!entry) return null;
  const voice = entry[voiceType];
  return voice ? voice.id : null;
}

export function hasPiperVoice(langCode) {
  return !!VOICE_MAP[langCode];
}

export function getPiperLanguages() {
  return Object.keys(VOICE_MAP);
}

export function getPiperVoiceInfo(langCode) {
  const entry = VOICE_MAP[langCode];
  if (!entry) return null;
  return {
    male: entry.male ? entry.male.name : null,
    female: entry.female ? entry.female.name : null,
  };
}

export async function generateSpeech(text, voiceId, onProgress) {
  if (lastResult.voiceId === voiceId && lastResult.text === text && lastResult.blob) {
    return lastResult.blob;
  }
  const session = await getSession(voiceId, onProgress);
  const blob = await session.predict(text);
  lastResult = { voiceId, text, blob };
  return blob;
}

export function preloadVoice(voiceId) {
  if (!voiceId || sessionCache[voiceId] || loadingPromises[voiceId]) return;
  getSession(voiceId).catch(() => {});
}

export function preloadLanguageVoices(langCode) {
  const entry = VOICE_MAP[langCode];
  if (!entry) return;
  if (entry.male) preloadVoice(entry.male.id);
  if (entry.female) preloadVoice(entry.female.id);
}

export function isVoiceReady(voiceId) {
  return !!sessionCache[voiceId];
}

export function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
}

export function playBlob(blob) {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.onended = () => URL.revokeObjectURL(url);
  audio.onerror = () => URL.revokeObjectURL(url);
  return audio;
}
