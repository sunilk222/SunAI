const CATEGORIES = {
  HATE_SPEECH: {
    label: "Hate Speech",
    words: [
      "nigger", "nigga", "kike", "spic", "wetback", "chink", "gook",
      "raghead", "towelhead", "camel jockey", "white supremacy",
      "white power", "heil hitler", "ethnic cleansing", "genocide",
      "race war", "subhuman", "untermensch", "go back to your country",
      "all muslims", "all jews", "all blacks", "all whites",
      "death to", "gas the", "lynch",
    ],
  },
  ABUSIVE_LANGUAGE: {
    label: "Abusive Language",
    words: [
      "fuck you", "fuck off", "motherfucker", "son of a bitch",
      "piece of shit", "dumbass", "asshole", "dickhead", "bastard",
      "stupid bitch", "go to hell", "eat shit", "suck my",
      "i will kill you", "i hope you die", "kill yourself",
      "you deserve to die", "worthless", "retard", "retarded",
      "cunt", "slut", "whore", "shut the fuck",
    ],
  },
  SEXUAL_CONTENT: {
    label: "Sexual Content",
    words: [
      "porn", "pornography", "xxx", "orgasm", "erotic", "nude",
      "naked", "strip tease", "blowjob", "handjob", "anal sex",
      "oral sex", "gang bang", "threesome", "fetish", "bdsm",
      "sex slave", "sexual assault", "molestation", "pedophil",
      "incest", "rape", "molest", "grope",
    ],
  },
  RELIGIOUS_INSULTS: {
    label: "Religious Insults",
    words: [
      "god is fake", "god is dead", "religion is cancer",
      "burn the quran", "burn the bible", "burn the torah",
      "islam is evil", "christianity is evil", "hinduism is evil",
      "judaism is evil", "buddhism is evil", "false prophet",
      "curse god", "damn your god", "blasphemy against",
      "infidels must die", "kafir", "destroy all churches",
      "destroy all mosques", "destroy all temples",
    ],
  },
  VIOLENCE: {
    label: "Violence Encouragement",
    words: [
      "how to kill", "how to murder", "how to stab",
      "how to poison", "how to strangle", "how to shoot someone",
      "mass shooting", "school shooting", "bomb threat",
      "plant a bomb", "make a bomb", "make explosives",
      "terrorist attack", "assassination", "hit list",
      "torture someone", "beat them up", "commit arson",
      "burn down", "set fire to", "acid attack",
    ],
  },
  ILLEGAL_INSTRUCTIONS: {
    label: "Illegal Instructions",
    words: [
      "how to hack", "how to steal", "how to rob",
      "how to forge", "how to counterfeit", "credit card fraud",
      "identity theft", "how to make drugs", "how to make meth",
      "how to grow weed", "how to cook crack",
      "how to launder money", "money laundering",
      "tax evasion", "how to pick a lock", "break into a house",
      "how to hotwire", "how to shoplift", "drug trafficking",
      "human trafficking", "child exploitation",
    ],
  },
};

export function moderateContent(text) {
  if (!text || typeof text !== "string") {
    return { safe: true, violations: [] };
  }

  const lower = text.toLowerCase().trim();
  const violations = [];

  for (const [category, { label, words }] of Object.entries(CATEGORIES)) {
    for (const phrase of words) {
      if (lower.includes(phrase)) {
        violations.push({
          category,
          label,
          matched: phrase,
        });
        break;
      }
    }
  }

  return {
    safe: violations.length === 0,
    violations,
  };
}

export function getViolationMessage(violations) {
  if (violations.length === 0) return "";

  const labels = [...new Set(violations.map((v) => v.label))];

  if (labels.length === 1) {
    return `Your text contains ${labels[0].toLowerCase()}. This type of content is not allowed.`;
  }

  const last = labels.pop();
  return `Your text contains ${labels.join(", ")} and ${last.toLowerCase()}. This type of content is not allowed.`;
}
