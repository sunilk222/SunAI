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
import { logUsage, exportLogsAsCSV } from "./utils/usageLogger";
import { checkRateLimit } from "./utils/rateLimiter";
import { initSecurity } from "./utils/security";
import { sanitizeText } from "./utils/sanitize";

import TextInput from "./components/TextInput";
import LanguageSelector from "./components/LanguageSelector";
import VoiceSelector from "./components/VoiceSelector";
import VoiceEffects from "./components/VoiceEffects";
import CaptchaValidator from "./components/CaptchaValidator";
import ActionButtons from "./components/ActionButtons";
import FAQ from "./components/FAQ";
import {
  PolicyModal,
  PrivacyPolicyContent,
  TermsOfServiceContent,
} from "./components/LoginGate";

const GUEST_USER = { name: "Guest", email: "guest@voiceapp.free" };

function App() {
  const user = GUEST_USER;

  useEffect(() => { initSecurity(); }, []);

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
  const [theme, setTheme] = useState(() => localStorage.getItem("va_theme") || "dark");
  const [piperPlaying, setPiperPlaying] = useState(false);
  const piperAudioRef = useRef(null);

  const { voicesByLanguage, availableLanguageCodes } = useVoices();
  const { speak, stop, isSpeaking } = useSpeechSynthesis();

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

  // Preload both male+female voice models when language changes
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
        if (selectedVoiceURI) speak(textToSpeak, selectedVoiceURI, { rate, pitch, volume });
      }
    } catch (err) {
      console.warn("Piper speak failed:", err);
      showToast("AI voice failed, using browser voice", "info");
      if (selectedVoiceURI) speak(textToSpeak, selectedVoiceURI, { rate, pitch, volume });
    } finally {
      setIsGenerating(false);
    }
  }, [stopAll, language, voiceType, showToast, selectedVoiceURI, speak, rate, pitch, volume]);

  const handleSpeak = useCallback(() => {
    if (!text.trim() || !captchaVerified) return;
    if (!checkModeration("speak")) return;
    const rl = checkRateLimit("speak");
    if (!rl.allowed) { showToast(`Too many requests. Wait ${rl.waitSec}s.`, "error"); return; }
    logUsage(user, "SPEAK", { language, voiceType, textLength: text.length });

    if (langHasPiper) {
      playWithPiper(text);
    } else if (selectedVoiceURI) {
      speak(text, selectedVoiceURI, { rate, pitch, volume });
    }
  }, [text, captchaVerified, checkModeration, showToast, user, language, voiceType, langHasPiper, playWithPiper, speak, selectedVoiceURI, rate, pitch, volume]);

  const handleSampleToggle = useCallback(() => {
    if (isSpeaking || piperPlaying) {
      stopAll();
    } else if (langHasPiper) {
      playWithPiper(getSampleText(language));
    } else if (selectedVoiceURI) {
      speak(getSampleText(language), selectedVoiceURI, { rate, pitch, volume });
    }
  }, [isSpeaking, piperPlaying, stopAll, langHasPiper, playWithPiper, language, selectedVoiceURI, speak, rate, pitch, volume]);

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

      <header className="app-header">
        <div className="header-row">
          <h1 className="app-title">Voice App</h1>
          <button
            className="theme-toggle"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            type="button"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? "\u2600" : "\u263D"}
          </button>
        </div>
        <p className="app-subtitle">100% Free Text to Speech</p>
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
        <p className="download-note">
          {langHasPiper
            ? "Speak & Download use the same AI voice (Piper TTS) \u2014 100% free."
            : "Speak uses browser voice. Download uses Google TTS \u2014 voice may differ."}
        </p>
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
          <button className="footer-link" onClick={exportLogsAsCSV} type="button">Logs</button>
        </div>
      </footer>
    </div>
  );
}

export default App;
