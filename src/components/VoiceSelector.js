import React from "react";
import { VOICE_TYPES } from "../constants";
import { getPiperVoiceInfo } from "../utils/piperTTS";

function VoiceSelector({
  voiceType,
  onVoiceTypeChange,
  voices,
  selectedVoiceURI,
  onVoiceSelect,
  onPreview,
  langHasPiper,
  language,
}) {
  const piperInfo = langHasPiper ? getPiperVoiceInfo(language) : null;
  const activePiperName = piperInfo
    ? (voiceType === VOICE_TYPES.MALE ? piperInfo.male : piperInfo.female)
    : null;

  return (
    <div className="voice-selector-panel">
      <label className="field-label">Voice</label>

      <div className="gender-tabs">
        <button
          className={`gender-tab ${voiceType === VOICE_TYPES.MALE ? "active" : ""}`}
          onClick={() => onVoiceTypeChange(VOICE_TYPES.MALE)}
          type="button"
        >
          Male{piperInfo ? ` — ${piperInfo.male}` : ""}
        </button>
        <button
          className={`gender-tab ${voiceType === VOICE_TYPES.FEMALE ? "active" : ""}`}
          onClick={() => onVoiceTypeChange(VOICE_TYPES.FEMALE)}
          type="button"
        >
          Female{piperInfo ? ` — ${piperInfo.female}` : ""}
        </button>
      </div>

      {langHasPiper && activePiperName && (
        <div className="piper-voice-badge">
          <span>{activePiperName} ({voiceType === VOICE_TYPES.MALE ? "Male" : "Female"}) — used for Speak & Download</span>
        </div>
      )}

      {!langHasPiper && (
        <div className="voice-list">
          {voices.length === 0 ? (
            <p className="no-voices">
              No browser voices available for this language.
            </p>
          ) : (
            voices.map((voice) => (
              <div
                key={voice.voiceURI}
                className={`voice-card ${selectedVoiceURI === voice.voiceURI ? "selected" : ""}`}
              >
                <button
                  className="voice-card-select"
                  onClick={() => onVoiceSelect(voice.voiceURI)}
                  type="button"
                  title={voice.name}
                >
                  <span className="voice-card-name">{voice.displayName}</span>
                  {!voice.localService && (
                    <span className="voice-card-badge">HD</span>
                  )}
                </button>
                <button
                  className="voice-preview-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview?.(voice.voiceURI);
                  }}
                  type="button"
                  title="Preview this browser voice"
                >
                  {"\u25B6"}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default VoiceSelector;