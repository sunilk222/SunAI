import React from "react";

function TextInput({ value, onChange }) {
  const charCount = value.length;

  return (
    <div className="text-input-wrapper">
      <label className="field-label" htmlFor="text-input">
        {"\u{270D}"} Your Text
      </label>
      <textarea
        id="text-input"
        className="text-input"
        rows="6"
        placeholder="Type or paste your text here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={5000}
      />
      <span className="char-count">{charCount} / 5,000</span>
    </div>
  );
}

export default TextInput;
