import { useState, useEffect, useCallback, useMemo } from "react";
import { SUPPORTED_LANGUAGES } from "../constants";
import { getPiperLanguages } from "../utils/piperTTS";

const FEMALE_INDICATORS = [
  "female", "woman",
  "zira", "hazel", "susan", "samantha", "victoria", "karen", "moira",
  "tessa", "fiona", "alice", "jenny", "aria", "sara", "linda", "emily",
  "catherine", "natasha",
  "heera", "sabina", "kalpana", "priya", "neerja", "swara", "lekha",
  "ananya", "sneha", "pooja", "riya",
  "marie", "chloe", "camille", "lina", "sarah", "denise", "sylvie",
  "virginie", "brigitte", "celeste",
  "anna", "mia", "lea", "lena", "sophie", "katja", "hedda", "petra",
  "ingrid", "amala",
  "lucia", "sofia", "martina", "elena", "paula", "elvira", "dalia",
  "abril", "ximena",
  "isabella", "elsa", "federica", "ginevra", "valentina",
  "francisca", "raquel", "fernanda", "leila", "brenda", "vitoria",
  "irina", "ekaterina", "svetlana", "dariya", "milena", "tatiana",
  "nanami", "ayumi", "haruka", "shiori", "keiko", "yuriko", "mayu",
  "yuna", "sora", "jihye", "minji", "sunhi", "hyeri",
  "yaoyao", "xiaoxiao", "xiaoyi", "huihui", "liling", "meiling",
  "salma", "zariyah", "amina", "fatima", "layla",
  "colette", "fenna", "fleur",
  "emel", "beren",
  "agnieszka", "zofia", "paulina",
  "hillevi", "sofie",
  "ioana", "alina",
  "helena", "laura", "emma", "olivia", "ava", "nuria", "joana",
];

const MALE_INDICATORS = [
  "male",
  "david", "mark", "james", "daniel", "thomas", "alex", "george",
  "richard", "ryan", "christopher", "guy", "sean", "brian", "andrew",
  "eric", "roger", "steffan",
  "ravi", "hemant", "amit", "raj", "vikram", "arjun", "karan",
  "madhur", "prabhat", "venkat", "mohan", "sagar", "arun",
  "pierre", "louis", "lucas", "hugo", "gabriel", "claude", "frank",
  "yannick", "henri", "alain", "jerome",
  "hans", "lukas", "jonas", "felix", "max", "stefan", "conrad",
  "bernd", "killian",
  "carlos", "juan", "miguel", "luis", "diego", "pablo", "raul",
  "jorge", "alvaro", "arnau",
  "giorgio", "giuseppe", "luca", "benigno", "calisto",
  "antonio", "duarte", "nicolau", "valerio",
  "pavel", "dmitry", "maxim", "boris", "ivan",
  "ichiro", "keitaro", "takumi", "keita", "daichi", "naoki",
  "inwoo", "junhyeok", "hyunsu", "bong", "gook",
  "yunjian", "yunxi", "kangkang", "yunfan", "yunhao",
  "hamed", "fahed", "naayf", "omar", "khalid",
  "maarten", "willem",
  "ahmet", "tolga",
  "marek", "jan",
  "mattias",
  "robert", "michael",
];

function detectGender(voiceName) {
  const lower = voiceName.toLowerCase();
  if (lower.includes("female") || lower.includes("woman")) return "female";
  if (lower.includes(" male") || lower.includes("(male")) return "male";
  for (const ind of FEMALE_INDICATORS) { if (lower.includes(ind)) return "female"; }
  for (const ind of MALE_INDICATORS) { if (lower.includes(ind)) return "male"; }
  return "unknown";
}

function cleanDisplayName(fullName) {
  return fullName
    .replace(/Microsoft\s*/i, "")
    .replace(/Google\s*/i, "")
    .replace(/\s*Desktop\s*/i, "")
    .replace(/\s*Online\s*/i, " ")
    .replace(/\s*-\s*.+$/, "")
    .replace(/\s*\(.+\)\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function matchLanguage(voiceLang, supportedLangs) {
  const norm = voiceLang.replace("_", "-").toLowerCase();
  const normBase = norm.split("-")[0];

  // Exact match first
  const exact = supportedLangs.find(
    (l) => norm === l.code.toLowerCase()
  );
  if (exact) return exact;

  // Match region (en-US voice → en-US lang)
  const regionMatch = supportedLangs.find((l) => {
    const lNorm = l.code.toLowerCase();
    return lNorm.split("-")[0] === normBase && norm.split("-")[1] === lNorm.split("-")[1];
  });
  if (regionMatch) return regionMatch;

  // Base language match (voice "hi" → "hi-IN", voice "ar" → "ar-SA")
  const baseMatch = supportedLangs.find(
    (l) => l.code.toLowerCase().split("-")[0] === normBase
  );
  return baseMatch || null;
}

export function useVoices() {
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadVoices = useCallback(() => {
    const available = window.speechSynthesis.getVoices();
    if (available.length > 0) {
      setVoices(available);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, [loadVoices]);

  const voicesByLanguage = useMemo(() => {
    const result = {};
    for (const lang of SUPPORTED_LANGUAGES) {
      result[lang.code] = { male: [], female: [] };
    }

    for (const voice of voices) {
      const langMatch = matchLanguage(voice.lang, SUPPORTED_LANGUAGES);
      if (!langMatch) continue;

      const gender = detectGender(voice.name);
      const entry = {
        name: voice.name,
        displayName: cleanDisplayName(voice.name),
        voiceURI: voice.voiceURI,
        lang: voice.lang,
        localService: voice.localService,
        gender,
      };

      if (gender === "female") {
        result[langMatch.code].female.push(entry);
      } else {
        result[langMatch.code].male.push(entry);
      }
    }

    for (const lang of SUPPORTED_LANGUAGES) {
      const data = result[lang.code];
      data.male = data.male
        .sort((a, b) => Number(a.localService) - Number(b.localService))
        .slice(0, 6);
      data.female = data.female
        .sort((a, b) => Number(a.localService) - Number(b.localService))
        .slice(0, 6);
    }

    return result;
  }, [voices]);

  const availableLanguageCodes = useMemo(() => {
    const codes = new Set();
    for (const [code, data] of Object.entries(voicesByLanguage)) {
      if (data.male.length > 0 || data.female.length > 0) {
        codes.add(code);
      }
    }
    for (const code of getPiperLanguages()) {
      codes.add(code);
    }
    return codes;
  }, [voicesByLanguage]);

  return { voicesByLanguage, availableLanguageCodes, loading };
}
