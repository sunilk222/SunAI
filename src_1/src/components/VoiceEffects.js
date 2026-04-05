import React from "react";

function VoiceEffects({
  rate,
  pitch,
  volume,
  onRateChange,
  onPitchChange,
  onVolumeChange,
  onReset,
}) {
  return (
    <div className="voice-effects">
      <div className="effects-header">
        <h3>{"\u{1F39B}"} Voice Effects</h3>
        <button className="reset-btn" onClick={onReset} type="button">
          {"\u21BA"} Reset
        </button>
      </div>

      <div className="effect-control">
        <div className="effect-label-row">
          <label>{"\u{1F3CE}"} Speed</label>
          <span className="effect-value">{rate.toFixed(1)}x</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={rate}
          onChange={(e) => onRateChange(parseFloat(e.target.value))}
        />
        <div className="effect-range-labels">
          <span>Slow</span>
          <span>Fast</span>
        </div>
      </div>

      <div className="effect-control">
        <div className="effect-label-row">
          <label>{"\u{1F3B6}"} Pitch</label>
          <span className="effect-value">{pitch.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={pitch}
          onChange={(e) => onPitchChange(parseFloat(e.target.value))}
        />
        <div className="effect-range-labels">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      <div className="effect-control">
        <div className="effect-label-row">
          <label>{"\u{1F509}"} Volume</label>
          <span className="effect-value">{Math.round(volume * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        />
        <div className="effect-range-labels">
          <span>Quiet</span>
          <span>Loud</span>
        </div>
      </div>
    </div>
  );
}

export default VoiceEffects;
