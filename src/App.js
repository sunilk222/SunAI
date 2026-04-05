import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import "./App.css";

import {
  DEFAULT_LANGUAGE,
  DEFAULT_VOICE_TYPE,
  VOICE_TYPES,
  VOICE_EFFECTS_DEFAULTS,
  getSampleText,
} from "./constants";
import { useSpeechSynthesis } from "./hooks/useSpeechSynthesis";
import { useVoices } from "./hooks/useVoices";
import { downloadSpeechAudio, speakWithPiper } from "./utils/downloadAudio";
import { hasPiperVoice, preloadLanguageVoices, getPiperVoiceId, isVoiceReady } from "./utils/piperTTS";
import {
  moderateContent,
  getViolationMessage,
} from "./utils/contentModeration";
import { logUsage, exportLogsAsCSV, initErrorCapture } from "./utils/usageLogger";
import { checkRateLimit } from "./utils/rateLimiter";
import { initSecurity } from "./utils/security";
import { sanitizeText } from "./utils/sanitize";
import { getUserForLogging } from "./utils/userIdentity";

import TextInput from "./components/TextInput";
import LanguageSelector from "./components/LanguageSelector";
import VoiceSelector from "./components/VoiceSelector";
import VoiceEffects from "./components/VoiceEffects";
import CaptchaValidator from "./components/CaptchaValidator";
import ActionButtons from "./components/ActionButtons";
import FAQ from "./components/FAQ";
import AdminPanel from "./components/AdminPanel";
import {
  PolicyModal,
  PrivacyPolicyContent,
  TermsOfServiceContent,
} from "./components/LoginGate";

function App() {
  // Use persistent user identity (device fingerprint) instead of guest
  const [user] = useState(() => getUserForLogging());

  // Initialize security and error capture
  useEffect(() => {
    initSecurity();
    initErrorCapture();
  }, []);

  const [text, setText] = useState("");
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [voiceType, setVoiceType] = useState(DEFAULT_VOICE_TYPE);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(null);
  const [rate, setRate] = useState(VOICE_EFFECTS_DEFAULTS.rate);
  const [pitch, setPitch] = useState(VOICE_EFFECTS_DEFAULTS.pitch);
  const [volume, setVolume] = useState(VOICE_EFFECTS_DEFAULTS.volume);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState(null);
  const [contentWarning, setContentWarning] = useState(null);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminGearVisible, setAdminGearVisible] = useState(false);
  const [adminPasswordPrompt, setAdminPasswordPrompt] = useState(false);
  const gearTapCountRef = useRef(0);
  const gearTapTimerRef = useRef(null);
  const secretBufferRef = useRef("");
  const SECRET_HASH = process.env.REACT_APP_SECRET_HASH;

  const [theme, setTheme] = useState(() => localStorage.getItem("va_theme") || "dark");
  const [piperPlaying, setPiperPlaying] = useState(false);
  const piperAudioRef = useRef(null);

  const { voicesByLanguage, availableLanguageCodes } = useVoices();
  const { speak, stop, isSpeaking } = useSpeechSynthesis();

  // Admin secret key listener (Konami‑style code)
  useEffect(() => {
    async function sha256(text) {
      const encoded = new TextEncoder().encode(text);
      const buffer = await crypto.subtle.digest("SHA-256", encoded);
      return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    async function checkBuffer(buf) {
      for (let len = 3; len <= buf.length; len++) {
        const candidate = buf.slice(buf.length - len);
        const hash = await sha256(candidate);
        if (hash === SECRET_HASH) return true;
      }
      return false;
    }

    const handleKeyDown = async (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) return;
      secretBufferRef.current += e.key.toLowerCase();
      if (secretBufferRef.current.length > 20) {
        secretBufferRef.current = secretBufferRef.current.slice(-20);
      }
      const match = await checkBuffer(secretBufferRef.current);
      if (match) {
        setAdminGearVisible(true);
        secretBufferRef.current = "";
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [SECRET_HASH]);

  const handleGearTap = useCallback(() => {
    gearTapCountRef.current += 1;
    if (gearTapTimerRef.current) clearTimeout(gearTapTimerRef.current);
    if (gearTapCountRef.current >= 5) {
      gearTapCountRef.current = 0;
      setAdminPasswordPrompt(true);
    } else {
      gearTapTimerRef.current = setTimeout(() => { gearTapCountRef.current = 0; }, 2000);
    }
  }, []);

  const handleAdminAuthenticated = useCallback(() => {
    setAdminPasswordPrompt(false);
    setShowAdmin(true);
    setAdminGearVisible(false);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("va_theme", theme);
  }, [theme]);

  const availableVoices = useMemo(() => {
    const langVoices = voicesByLanguage[language] || { male: [], female: [] };
    return voiceType === VOICE_TYPES.MALE ? langVoices.male : langVoices.female;
  }, [voicesByLanguage, language, voiceType]);

  useEffect(() => {
    const still = availableVoices.find((v) => v.voiceURI === selectedVoiceURI);
    if (!still && availableVoices.length > 0) {
      setSelectedVoiceURI(availableVoices[0].voiceURI);
    }
  }, [availableVoices, selectedVoiceURI]);

  useEffect(() => {
    if (!text.trim()) { setContentWarning(null); return; }
    const result = moderateContent(text);
    setContentWarning(result.safe ? null : getViolationMessage(result.violations));
  }, [text]);

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  }, []);

  const checkModeration = useCallback(
    (actionName) => {
      const result = moderateContent(text);
      if (!result.safe) {
        showToast(getViolationMessage(result.violations), "error");
        logUsage(user, "CONTENT_VIOLATION", {
          action: actionName,
          categories: result.violations.map((v) => v.label).join(", "),
          textLength: text.length,
        });
        return false;
      }
      return true;
    },
    [text, user, showToast]
  );

  const langHasPiper = hasPiperVoice(language);
  const [modelLoading, setModelLoading] = useState(false);

  useEffect(() => {
    if (langHasPiper) {
      const currentVoiceId = getPiperVoiceId(language, voiceType);
      if (currentVoiceId && !isVoiceReady(currentVoiceId)) {
        setModelLoading(true);
      }
      preloadLanguageVoices(language);
      const check = setInterval(() => {
        const vid = getPiperVoiceId(language, voiceType);
        if (!vid || isVoiceReady(vid)) {
          setModelLoading(false);
          clearInterval(check);
        }
      }, 500);
      return () => clearInterval(check);
    }
  }, [language, langHasPiper, voiceType]);

  const stopAll = useCallback(() => {
    stop();
    if (piperAudioRef.current) {
      piperAudioRef.current.pause();
      piperAudioRef.current.currentTime = 0;
      piperAudioRef.current = null;
    }
    setPiperPlaying(false);
  }, [stop]);

  const fallbackVoiceURI = selectedVoiceURI || (availableVoices.length > 0 ? availableVoices[0].voiceURI : null);

  const playWithPiper = useCallback(async (textToSpeak) => {
    stopAll();
    setIsGenerating(true);
    const vid = getPiperVoiceId(language, voiceType);
    showToast(
      vid && isVoiceReady(vid)
        ? "Generating audio..."
        : "Loading voice model... (first time only)",
      "info"
    );
    try {
      const audio = await speakWithPiper(textToSpeak, language, voiceType);
      if (audio) {
        piperAudioRef.current = audio;
        setPiperPlaying(true);
        audio.onended = () => { piperAudioRef.current = null; setPiperPlaying(false); };
        audio.onpause = () => { setPiperPlaying(false); };
      } else {
        showToast("AI voice unavailable, using browser voice", "info");
        if (fallbackVoiceURI) speak(textToSpeak, fallbackVoiceURI, { rate, pitch, volume });
      }
    } catch (err) {
      console.warn("Piper speak failed:", err);
      showToast("AI voice failed, using browser voice", "info");
      if (fallbackVoiceURI) speak(textToSpeak, fallbackVoiceURI, { rate, pitch, volume });
    } finally {
      setIsGenerating(false);
    }
  }, [stopAll, language, voiceType, showToast, fallbackVoiceURI, speak, rate, pitch, volume]);

  const handleSpeak = useCallback(() => {
    if (!text.trim() || !captchaVerified) return;
    if (!checkModeration("speak")) return;
    const rl = checkRateLimit("speak");
    if (!rl.allowed) { showToast(`Too many requests. Wait ${rl.waitSec}s.`, "error"); return; }
    logUsage(user, "SPEAK", { language, voiceType, textLength: text.length });

    if (langHasPiper) {
      playWithPiper(text);
    } else if (fallbackVoiceURI) {
      speak(text, fallbackVoiceURI, { rate, pitch, volume });
    }
  }, [text, captchaVerified, checkModeration, showToast, user, language, voiceType, langHasPiper, playWithPiper, speak, fallbackVoiceURI, rate, pitch, volume]);

  const handleSampleToggle = useCallback(() => {
    if (isSpeaking || piperPlaying) {
      stopAll();
    } else if (langHasPiper) {
      playWithPiper(getSampleText(language));
    } else if (fallbackVoiceURI) {
      speak(getSampleText(language), fallbackVoiceURI, { rate, pitch, volume });
    }
  }, [isSpeaking, piperPlaying, stopAll, langHasPiper, playWithPiper, language, fallbackVoiceURI, speak, rate, pitch, volume]);

  const handlePreviewVoice = useCallback(
    (voiceURI) => speak(getSampleText(language), voiceURI, { rate, pitch, volume }),
    [language, speak, rate, pitch, volume]
  );

  const resetForm = useCallback(() => {
    setText("");
    setContentWarning(null);
    setCaptchaVerified(false);
    setCaptchaKey((prev) => prev + 1);
  }, []);

  const handleDownloadAudio = useCallback(async () => {
    if (!text.trim() || !captchaVerified) return;
    if (!checkModeration("download_audio")) return;
    const rl = checkRateLimit("download");
    if (!rl.allowed) { showToast(`Too many requests. Wait ${rl.waitSec}s.`, "error"); return; }
    logUsage(user, "DOWNLOAD_AUDIO", { language, voiceType, textLength: text.length });
    setIsDownloading(true);
    try {
      await downloadSpeechAudio(text, language, selectedVoiceURI, { rate, pitch, volume, voiceType }, (status) => {
        const msgs = {
          "piper-generating": "Generating audio with AI voice...",
          "google-generating": "Generating MP3 via Google...",
          "done": "Audio downloaded!",
        };
        if (msgs[status]) showToast(msgs[status], status === "done" ? "success" : "info");
        else if (status.startsWith("downloading")) showToast(status.charAt(0).toUpperCase() + status.slice(1), "info");
      });
      resetForm();
    } catch (err) {
      showToast(err.message || "Download failed", "error");
    } finally {
      setIsDownloading(false);
    }
  }, [text, captchaVerified, checkModeration, user, language, voiceType, selectedVoiceURI, rate, pitch, volume, showToast, resetForm]);

  const handleClear = useCallback(() => {
    stopAll();
    resetForm();
    setRate(VOICE_EFFECTS_DEFAULTS.rate);
    setPitch(VOICE_EFFECTS_DEFAULTS.pitch);
    setVolume(VOICE_EFFECTS_DEFAULTS.volume);
    showToast("Cleared!", "info");
  }, [stopAll, resetForm, showToast]);

  const handleResetEffects = useCallback(() => {
    setRate(VOICE_EFFECTS_DEFAULTS.rate);
    setPitch(VOICE_EFFECTS_DEFAULTS.pitch);
    setVolume(VOICE_EFFECTS_DEFAULTS.volume);
  }, []);

  const anySpeaking = isSpeaking || piperPlaying;
  const isActionDisabled = !text.trim() || !captchaVerified || !!contentWarning;

  return (
    <div className="app">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      {showPrivacy && (
        <PolicyModal title="Privacy Policy" onClose={() => setShowPrivacy(false)}>
          <PrivacyPolicyContent />
        </PolicyModal>
      )}
      {showTerms && (
        <PolicyModal title="Terms of Service" onClose={() => setShowTerms(false)}>
          <TermsOfServiceContent />
        </PolicyModal>
      )}

      {/* ── Original Sun‑Ray Header (as requested) ── */}
      <header className="app-header">
        <div className="header-row">
          <div className="header-left">
            <svg className="app-logo" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="8" stroke="currentColor" strokeWidth="2.5" fill="none" />
              <circle cx="32" cy="32" r="3" fill="currentColor" />
              {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const x1 = 32 + 11 * Math.cos(rad);
                const y1 = 32 + 11 * Math.sin(rad);
                const x2 = 32 + 26 * Math.cos(rad);
                const y2 = 32 + 26 * Math.sin(rad);
                const dx = 32 + 28 * Math.cos(rad);
                const dy = 32 + 28 * Math.sin(rad);
                return (
                  <g key={i}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth={i % 2 === 0 ? "2" : "1.2"} strokeLinecap="round" />
                    <circle cx={dx} cy={dy} r={i % 2 === 0 ? "2" : "1.3"} fill="currentColor" />
                  </g>
                );
              })}
            </svg>
            <h1 className="app-title">SunAI</h1>
          </div>
          <button
            className="theme-toggle"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            type="button"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
        <p className="app-subtitle">100% Free AI Text to Speech</p>
      </header>

      <main className="app-main">
        <div className="row-2col">
          <section className="card compact">
            <TextInput value={text} onChange={(v) => setText(sanitizeText(v))} />
            {contentWarning && (
              <div className="content-warning">
                <span className="warning-icon">{"\u26D4"}</span>
                <p>{contentWarning}</p>
              </div>
            )}
          </section>

          <section className="card compact">
            <LanguageSelector
              value={language}
              onChange={setLanguage}
              availableLanguageCodes={availableLanguageCodes}
            />
            <VoiceSelector
              voiceType={voiceType}
              onVoiceTypeChange={setVoiceType}
              voices={availableVoices}
              selectedVoiceURI={selectedVoiceURI}
              onVoiceSelect={setSelectedVoiceURI}
              onPreview={handlePreviewVoice}
              langHasPiper={langHasPiper}
              language={language}
            />
            <div className="sample-row">
              <button
                className="sample-play-btn"
                onClick={handleSampleToggle}
                disabled={isGenerating}
                type="button"
              >
                {isGenerating ? "\u23F3 Loading..." : anySpeaking ? "\u23F9 Stop" : "\u25B6 Play Sample"}
              </button>
            </div>
          </section>
        </div>

        <div className="row-2col">
          <section className="card compact">
            <VoiceEffects
              rate={rate}
              pitch={pitch}
              volume={volume}
              onRateChange={setRate}
              onPitchChange={setPitch}
              onVolumeChange={setVolume}
              onReset={handleResetEffects}
            />
          </section>

          <section className="card compact">
            <CaptchaValidator key={captchaKey} onVerified={setCaptchaVerified} />
          </section>
        </div>

        <ActionButtons
          onSpeak={handleSpeak}
          onStop={stopAll}
          onDownloadAudio={handleDownloadAudio}
          onClear={handleClear}
          disabled={isActionDisabled}
          isSpeaking={anySpeaking}
          isRecording={isDownloading}
          isGenerating={isGenerating}
        />
        {modelLoading && langHasPiper && (
          <div className="model-loading-bar">
            <div className="model-loading-pulse" />
            <span>Loading voice model in background...</span>
          </div>
        )}

      </main>

      {showFAQ && <FAQ />}

      <footer className="app-footer">
        <div className="footer-links">
          <button className="footer-link" onClick={() => setShowFAQ((f) => !f)} type="button">
            {showFAQ ? "Hide FAQ" : "FAQ"}
          </button>
          <span className="footer-sep">{"\u00B7"}</span>
          <button className="footer-link" onClick={() => setShowPrivacy(true)} type="button">Privacy</button>
          <span className="footer-sep">{"\u00B7"}</span>
          <button className="footer-link" onClick={() => setShowTerms(true)} type="button">Terms</button>
          <span className="footer-sep">{"\u00B7"}</span>
          {adminGearVisible && (
            <>
              <span className="footer-sep">{"\u00B7"}</span>
              <button
                className="footer-link admin-gear-btn"
                onClick={handleGearTap}
                type="button"
                title="Settings"
              >
                {"\u2699"}
              </button>
            </>
          )}
          {showAdmin && (
            <>
              <span className="footer-sep">{"\u00B7"}</span>
              <button className="footer-link" onClick={() => { setShowAdmin(false); setAdminGearVisible(false); }} type="button">
                Hide Admin
              </button>
            </>
          )}
        </div>
      </footer>

      {adminPasswordPrompt && !showAdmin && (
        <AdminPanel mode="login" onAuthenticated={handleAdminAuthenticated} onCancel={() => setAdminPasswordPrompt(false)} />
      )}
      {showAdmin && <AdminPanel mode="dashboard" />}
    </div>
  );
}

export default App;