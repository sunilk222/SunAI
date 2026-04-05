import React, { useState, useMemo } from "react";
import { CAPTCHA_LENGTH } from "../constants";

function generateCaptcha() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < CAPTCHA_LENGTH; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function CaptchaValidator({ onVerified }) {
  const [captcha, setCaptcha] = useState(() => generateCaptcha());
  const [input, setInput] = useState("");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(false);

  const charStyles = useMemo(
    () =>
      captcha.split("").map((_, i) => ({
        transform: `rotate(${Math.floor(Math.random() * 20) - 10}deg) translateY(${Math.floor(Math.random() * 6) - 3}px)`,
        color: `hsl(${220 + i * 30}, 55%, ${30 + i * 6}%)`,
      })),
    [captcha]
  );

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setInput("");
    setVerified(false);
    setError(false);
    onVerified(false);
  };

  const handleVerify = () => {
    if (input.toUpperCase() === captcha) {
      setVerified(true);
      setError(false);
      onVerified(true);
    } else {
      setError(true);
      setVerified(false);
      onVerified(false);
    }
  };

  return (
    <div className="captcha-container">
      <label className="field-label">
        {"\u{1F512}"} Verify you're human
      </label>

      <div className="captcha-display">
        <div className="captcha-code-box">
          {captcha.split("").map((char, i) => (
            <span key={i} className="captcha-char" style={charStyles[i]}>
              {char}
            </span>
          ))}
          <div className="captcha-noise" />
        </div>
        <button
          className="captcha-refresh"
          onClick={refreshCaptcha}
          title="Get new code"
          type="button"
        >
          &#8635;
        </button>
      </div>

      <div className="captcha-input-group">
        <input
          type="text"
          className={`captcha-input ${verified ? "valid" : ""} ${error ? "invalid" : ""}`}
          placeholder="Enter code"
          value={input}
          onChange={(e) => {
            setInput(e.target.value.toUpperCase());
            setError(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          disabled={verified}
          maxLength={CAPTCHA_LENGTH}
          autoComplete="off"
        />
        {!verified && (
          <button
            className="captcha-verify-btn"
            onClick={handleVerify}
            type="button"
            disabled={input.length < CAPTCHA_LENGTH}
          >
            {"\u2713"} Verify
          </button>
        )}
        {verified && (
          <span className="captcha-verified-badge">
            {"\u2705"} Verified
          </span>
        )}
      </div>

      {error && (
        <span className="captcha-error">
          {"\u26A0"} Code doesn't match. Try again or refresh.
        </span>
      )}
    </div>
  );
}

export default CaptchaValidator;
