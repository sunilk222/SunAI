import { TTS_LANG_MAP } from "../constants";
import { generateSpeech, getPiperVoiceId, triggerBlobDownload, playBlob } from "./piperTTS";

// ─── Google TTS fallback ──────────────────────────────────────────

const CORS_PROXIES = [
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
];

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

function buildGoogleTTSUrl(text, langCode) {
  const ttsLang = TTS_LANG_MAP[langCode] || langCode.split("-")[0];
  return `https://translate.google.com/translate_tts?ie=UTF-8&tl=${ttsLang}&client=tw-ob&q=${encodeURIComponent(text)}&textlen=${text.length}`;
}

async function fetchAudioBlob(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: "audio/mpeg, */*" } });
    clearTimeout(timer);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (blob.size < 500 || blob.type.includes("text/html")) return null;
    const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
    const isMP3 = header[0] === 0xFF && (header[1] & 0xE0) === 0xE0;
    const isID3 = header[0] === 0x49 && header[1] === 0x44 && header[2] === 0x33;
    if (isMP3 || isID3) return blob;
    if (blob.type.includes("audio") || blob.type.includes("octet-stream") || blob.type === "") return blob;
    return null;
  } catch { clearTimeout(timer); return null; }
}

async function fetchWithProxies(directUrl) {
  for (const makeProxy of CORS_PROXIES) {
    const blob = await fetchAudioBlob(makeProxy(directUrl));
    if (blob) return blob;
  }
  return null;
}

async function downloadGoogleTTS(text, language, onStatus) {
  const chunks = splitTextIntoChunks(text, 200);
  const blobs = [];
  for (let i = 0; i < chunks.length; i++) {
    onStatus?.(`downloading chunk ${i + 1} of ${chunks.length}`);
    const blob = await fetchWithProxies(buildGoogleTTSUrl(chunks[i], language));
    if (!blob) {
      const url = buildGoogleTTSUrl(text.substring(0, 200), language);
      window.open(url, "_blank", "noopener,noreferrer");
      onStatus?.("done");
      return;
    }
    blobs.push(blob);
  }
  triggerBlobDownload(
    new Blob(blobs, { type: "audio/mpeg" }),
    `VoiceApp_Speech_${Date.now()}.mp3`
  );
  onStatus?.("done");
}

// ─── Piper TTS: generate WAV blob ────────────────────────────────

async function generatePiperWav(text, language, voiceType) {
  const piperVoiceId = getPiperVoiceId(language, voiceType || "male");
  console.log("[VoiceApp] generatePiperWav:", { language, voiceType, piperVoiceId });
  if (!piperVoiceId) return null;
  const wav = await generateSpeech(text, piperVoiceId);
  if (!wav || wav.size < 100) return null;
  return wav;
}

// ─── Speak with Piper (returns Audio element for control) ────────

export async function speakWithPiper(text, language, voiceType) {
  console.log("[VoiceApp] speakWithPiper called:", { language, voiceType });
  const wav = await generatePiperWav(text, language, voiceType);
  if (!wav) return null;
  const audio = playBlob(wav);
  await audio.play();
  return audio;
}

// ─── Download (Piper primary, Google TTS fallback) ───────────────

export async function downloadSpeechAudio(text, language, voiceURI, voiceOptions, onStatus) {
  const voiceType = voiceOptions?.voiceType || "male";
  const piperVoiceId = getPiperVoiceId(language, voiceType);
  console.log("[VoiceApp] downloadSpeechAudio called:", { language, voiceType, piperVoiceId });

  if (piperVoiceId) {
    try {
      onStatus?.("piper-generating");
      const wav = await generatePiperWav(text, language, voiceType);
      if (wav) {
        triggerBlobDownload(wav, `VoiceApp_Speech_${Date.now()}.wav`);
        onStatus?.("done");
        return;
      }
    } catch (err) {
      console.warn("Piper TTS failed, falling back to Google TTS:", err.message);
    }
  }

  onStatus?.("google-generating");
  await downloadGoogleTTS(text, language, onStatus);
}
