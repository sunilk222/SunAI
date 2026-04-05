import { useState, useEffect, useCallback, useMemo } from "react";
import { SUPPORTED_LANGUAGES } from "../constants";
import { getPiperLanguages } from "../utils/piperTTS";

const FEMALE_INDICATORS = [
  "female", "woman",
  // Windows (Microsoft) voices
  "zira", "hazel", "susan", "samantha", "victoria", "karen", "moira",
  "tessa", "fiona", "alice", "jenny", "aria", "sara", "linda", "emily",
  "catherine", "natasha", "clara", "elsa", "hortense", "tracy", "huihui",
  "hanhan", "yating", "zhiwei", "ayumi", "haruka", "heami",
  // macOS / iOS voices
  "allison", "ava", "joana", "kathy", "princess", "vicki", "ellen",
  "mariska", "yelda", "melina", "milena", "damayanti", "lekha",
  "linh", "luciana", "maged", "meijia", "mei-jia", "sin-ji", "sinji",
  "ting-ting", "tingting", "yuna", "satu", "tünde", "montse", "nora",
  // Google Chrome voices
  "google us english female", "google uk english female",
  "google deutsch female", "google français female",
  "google español female", "google italiano female",
  "google日本語 female", "google female",
  // Hindi / Indian
  "heera", "sabina", "kalpana", "priya", "neerja", "swara",
  "ananya", "sneha", "pooja", "riya", "kavya",
  // Tamil voices (female)
  "pallavi", "kani", "venba", "saranya",
  // French
  "marie", "chloe", "camille", "lina", "sarah", "denise", "sylvie",
  "virginie", "brigitte", "celeste", "aurelie", "isabelle",
  // German
  "anna", "mia", "lea", "lena", "sophie", "katja", "hedda", "petra",
  "ingrid", "amala", "vicki",
  // Spanish
  "lucia", "sofia", "martina", "elena", "paula", "elvira", "dalia",
  "abril", "ximena", "carmen", "conchita", "penelope", "lupe",
  // Italian
  "isabella", "federica", "ginevra", "valentina", "cosima", "bianca",
  // Portuguese
  "francisca", "raquel", "fernanda", "leila", "brenda", "vitoria",
  // Russian
  "irina", "ekaterina", "svetlana", "dariya", "tatiana",
  // Japanese
  "nanami", "shiori", "keiko", "yuriko", "mayu", "o-ren",
  // Korean
  "sora", "jihye", "minji", "sunhi", "hyeri", "heami",
  // Chinese
  "yaoyao", "xiaoxiao", "xiaoyi", "liling", "meiling",
  // Arabic / Farsi / Turkish
  "salma", "zariyah", "amina", "fatima", "layla", "hala",
  "emel", "beren", "seda",
  // Dutch
  "colette", "fenna", "fleur",
  // Polish
  "agnieszka", "zofia", "paulina",
  // Swedish / Nordic
  "hillevi", "sofie", "astrid",
  // Romanian
  "ioana", "alina",
  // Common across platforms
  "helena", "laura", "emma", "olivia", "nuria", "joana",
  "charlotte", "cora", "nicole", "monica", "rosa", "rebecca",
  "jennifer", "jessica", "amanda", "rachel", "natalie", "andrea",
];

const MALE_INDICATORS = [
  "male",
  // Windows (Microsoft) voices
  "david", "mark", "james", "daniel", "thomas", "alex", "george",
  "richard", "ryan", "christopher", "guy", "sean", "brian", "andrew",
  "eric", "roger", "steffan", "adam", "tony", "frank", "sam",
  "kangkang", "yating", "ichiro", "naayf", "hamed", "fahed",
  // macOS / iOS voices
  "tom", "fred", "ralph", "albert", "bruce", "junior", "bahh",
  "bells", "boing", "bubbles", "eddy", "grandpa", "reed", "rocko",
  "sandy", "shelley", "trinoids", "whisper", "wobble", "zarvox",
  "rishi", "luca", "thomas", "xander", "jacques", "majed",
  // Google Chrome voices
  "google us english male", "google uk english male",
  "google deutsch male", "google français male",
  "google español male", "google italiano male",
  "google male",
  // Hindi / Indian
  "ravi", "hemant", "amit", "raj", "vikram", "arjun", "karan",
  "madhur", "prabhat", "venkat", "mohan", "sagar", "arun",
  "suresh", "ganesh", "rohit",
  // Tamil voices (male)
  "valluvar", "surya", "anbu", "kumar",
  // French
  "pierre", "louis", "lucas", "hugo", "gabriel", "claude",
  "yannick", "henri", "alain", "jerome", "mathieu",
  // German
  "hans", "lukas", "jonas", "felix", "max", "stefan", "conrad",
  "bernd", "killian", "markus",
  // Spanish
  "carlos", "juan", "miguel", "luis", "diego", "pablo", "raul",
  "jorge", "alvaro", "arnau", "enrique", "andres",
  // Italian
  "giorgio", "giuseppe", "benigno", "calisto", "cosimo",
  // Portuguese
  "antonio", "duarte", "nicolau", "valerio", "cristiano",
  // Russian
  "pavel", "dmitry", "maxim", "boris", "ivan", "alexander",
  // Japanese
  "keitaro", "takumi", "keita", "daichi", "naoki", "otoya",
  // Korean
  "inwoo", "junhyeok", "hyunsu", "bong", "gook",
  // Chinese
  "yunjian", "yunxi", "yunfan", "yunhao",
  // Arabic / Turkish
  "omar", "khalid", "tarik",
  "ahmet", "tolga",
  // Dutch
  "maarten", "willem",
  // Polish
  "marek", "jan",
  // Swedish
  "mattias",
  // Common across platforms
  "robert", "michael", "william", "john", "joseph", "charles",
  "kevin", "jason", "matthew", "timothy", "gregory", "kenneth",
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
      } else if (gender === "male") {
        result[langMatch.code].male.push(entry);
      } else {
        result[langMatch.code].male.push(entry);
        result[langMatch.code].female.push({ ...entry, gender: "female" });
      }
    }

    for (const lang of SUPPORTED_LANGUAGES) {
      const data = result[lang.code];
      data.male = data.male
        .sort((a, b) => Number(a.localService) - Number(b.localService))
        .slice(0, 8);
      data.female = data.female
        .sort((a, b) => Number(a.localService) - Number(b.localService))
        .slice(0, 8);

      if (data.male.length === 0 && data.female.length > 0) {
        data.male = data.female.slice(0, 4).map((v) => ({ ...v, gender: "male" }));
      }
      if (data.female.length === 0 && data.male.length > 0) {
        data.female = data.male.slice(0, 4).map((v) => ({ ...v, gender: "female" }));
      }
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