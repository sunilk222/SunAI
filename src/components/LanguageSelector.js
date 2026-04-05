import React, { useMemo } from "react";
import Select, { components } from "react-select";
import { SUPPORTED_LANGUAGES, getFlagUrl } from "../constants";
import { hasPiperVoice } from "../utils/piperTTS";

const CustomOption = (props) => (
  <components.Option {...props}>
    <div className="lang-option-inner">
      <img
        src={getFlagUrl(props.data.cc)}
        alt={props.data.cc}
        className="lang-flag"
        loading="lazy"
      />
      <span>{props.data.label}</span>
      {props.data.isPiper && <span className="lang-piper-tag">AI</span>}
    </div>
  </components.Option>
);

const CustomSingleValue = (props) => (
  <components.SingleValue {...props}>
    <div className="lang-option-inner">
      <img
        src={getFlagUrl(props.data.cc)}
        alt={props.data.cc}
        className="lang-flag"
        loading="lazy"
      />
      <span>{props.data.label}</span>
      {props.data.isPiper && <span className="lang-piper-tag">AI</span>}
    </div>
  </components.SingleValue>
);

const CustomGroupHeading = (props) => (
  <components.GroupHeading {...props}>
    <span className="lang-group-heading">{props.children}</span>
  </components.GroupHeading>
);

function getSelectStyles(isDark) {
  const bg = isDark ? "#0d0d0d" : "#fff";
  const menuBg = isDark ? "#141414" : "#fff";
  const border = isDark ? "#333" : "#ddd";
  const borderFocus = isDark ? "#555" : "#999";
  const text = isDark ? "#e0e0e0" : "#1a1a1a";
  const placeholder = isDark ? "#555" : "#aaa";
  const hoverBg = isDark ? "#1a1a1a" : "#f5f5f5";
  const groupText = isDark ? "#888" : "#666";

  return {
    control: (base, state) => ({
      ...base,
      borderRadius: 8,
      border: `1px solid ${state.isFocused ? borderFocus : border}`,
      boxShadow: "none",
      padding: "1px 2px",
      fontSize: 13,
      fontFamily: "inherit",
      minHeight: 36,
      backgroundColor: bg,
      "&:hover": { borderColor: borderFocus },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: 8,
      overflow: "hidden",
      border: `1px solid ${border}`,
      backgroundColor: menuBg,
      zIndex: 20,
      maxHeight: "50vh", // Mobile responsive: prevents dropdown overflow
    }),
    menuList: (base) => ({
      ...base,
      maxHeight: "50vh", // Mobile responsive: ensures scrollable list on small screens
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? (isDark ? "#fff" : "#1a1a1a") : state.isFocused ? hoverBg : menuBg,
      color: state.isSelected ? (isDark ? "#000" : "#fff") : text,
      cursor: "pointer",
      padding: "6px 10px",
      fontSize: 12,
    }),
    groupHeading: (base) => ({
      ...base,
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      color: groupText,
      padding: "6px 10px 2px",
      marginBottom: 0,
    }),
    singleValue: (base) => ({ ...base, color: text }),
    placeholder: (base) => ({ ...base, color: placeholder }),
    input: (base) => ({ ...base, color: text }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (base) => ({
      ...base,
      color: placeholder,
      padding: "4px",
      "&:hover": { color: text },
    }),
  };
}

function LanguageSelector({ value, onChange, availableLanguageCodes }) {
  const isDark = document.documentElement.getAttribute("data-theme") !== "light";

  const groupedOptions = useMemo(() => {
    const available = SUPPORTED_LANGUAGES
      .filter((lang) => !availableLanguageCodes || availableLanguageCodes.has(lang.code));

    const primary = [];
    const secondary = [];

    for (const lang of available) {
      const opt = {
        value: lang.code,
        label: lang.label,
        cc: lang.cc,
        isPiper: hasPiperVoice(lang.code),
      };
      if (opt.isPiper) {
        primary.push(opt);
      } else {
        secondary.push(opt);
      }
    }

    return [
      { label: "AI Voices — Same voice for Speak & Download", options: primary },
      { label: "Browser Voices — Download voice may differ", options: secondary },
    ];
  }, [availableLanguageCodes]);

  const allOptions = useMemo(
    () => groupedOptions.flatMap((g) => g.options),
    [groupedOptions]
  );
  const selectedOption = allOptions.find((o) => o.value === value) || null;
  const styles = useMemo(() => getSelectStyles(isDark), [isDark]);

  return (
    <div className="language-selector-wrapper">
      <label className="field-label">Language</label>
      <Select
        options={groupedOptions}
        value={selectedOption}
        onChange={(opt) => onChange(opt.value)}
        styles={styles}
        components={{
          Option: CustomOption,
          SingleValue: CustomSingleValue,
          GroupHeading: CustomGroupHeading,
        }}
        isSearchable
        placeholder="Search language..."
      />
    </div>
  );
}

export default LanguageSelector;