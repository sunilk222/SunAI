import React from "react";

function ActionButtons({
  onSpeak,
  onStop,
  onDownloadAudio,
  onClear,
  disabled,
  isSpeaking,
  isRecording,
  isGenerating,
}) {
  return (
    <div className="action-buttons">
      <div className="action-row">
        {isSpeaking ? (
          <button className="btn stop-btn" onClick={onStop} type="button">
            {"\u23F9"} Stop
          </button>
        ) : (
          <button
            className="btn speak-btn"
            onClick={onSpeak}
            disabled={disabled || isGenerating}
            type="button"
          >
            {isGenerating ? "\u23F3 Generating..." : "\u25B6 Speak"}
          </button>
        )}

        <button
          className="btn audio-btn"
          onClick={onDownloadAudio}
          disabled={disabled || isRecording}
          type="button"
        >
          {isRecording ? "Downloading..." : "\u2B07 Download Audio"}
        </button>

        <button className="btn clear-btn" onClick={onClear} type="button">
          {"\u2715"} Clear
        </button>
      </div>
    </div>
  );
}

export default ActionButtons;
