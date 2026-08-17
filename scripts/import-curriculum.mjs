import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { WORDS } from "../src/data/words.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputFile = path.join(root, "public/data/curriculum.json");
const page =
  "Wiktionary:Frequency lists/Persian/Miller Aghajanian-Stewart 2009/1-1000";
const api = "https://en.wiktionary.org/w/api.php";

// This is intentionally an allowlist, not a clever filter. Every gloss below was
// selected for usefulness and checked as a single, teachable sense. The source
// rank keeps the selection auditable while the ordering defines learning tiers.
const LEVELS = [
  [
    "and", "be", "from", "to", "which", "this", "in", "with", "become", "for",
    "self", "that", "want", "until", "have", "do", "must", "first", "on", "year",
    "arrive", "then", "work", "more", "other", "but", "we", "country", "take",
    "before", "say", "large", "city", "or", "give", "also", "between", "face",
    "very", "opinion", "people", "only", "every", "important", "close", "hand",
    "several", "group", "if", "past", "time", "problem", "know", "better", "result",
    "person", "find", "different", "i", "world", "new", "what", "bring", "young",
    "second", "reason", "name", "some", "thousand", "even", "end", "place", "possible",
    "right", "future", "type", "main", "action", "life", "shape", "together", "today",
    "special", "inside", "woman", "still", "change", "number",
  ],
  [
    "million", "third", "service", "news", "complete", "free", "source", "line", "power",
    "need", "responsible", "rate", "growth", "conversation", "successful",
    "newspaper", "pass", "during", "war", "way", "decrease", "recent", "week", "beginning",
    "stage", "industry", "collaboration", "add", "read", "point", "production", "help", "now",
    "importance", "thought", "province", "defense", "letter", "human", "public", "serious",
    "visit", "opportunity", "university", "emphasis", "write", "build", "order", "freedom",
    "situation", "whether", "flow", "effort", "necessary", "protection", "thing", "continuation",
    "history", "scientific", "level", "social", "professor", "image", "specific", "opposite",
    "travel", "culture", "proposal", "meaning", "beside", "vote", "security", "population",
    "religion", "possibility", "science", "waiting", "short", "market", "meeting", "doctor",
    "question", "space", "film", "office", "competition", "minute", "expression", "unit", "death",
    "speech", "hope", "method", "oil", "print", "network", "when", "obstacle", "sign",
    "appropriate", "process", "ready", "money", "reply", "route", "reality", "pressure",
    "correction", "long", "try", "start", "length", "fresh", "article", "man", "real", "child",
    "cost", "air", "transfer", "research", "heavy", "risk", "severe", "related",
  ],
  [
    "soccer",
    "sufficient", "teaching", "control", "look", "stay", "struggle", "sample", "good", "always",
    "success", "consumption", "statistics", "decision", "experience", "price", "attack", "distance",
    "economy", "spread", "solution", "step", "feeling", "contract", "border", "finally",
    "introduction", "because", "sound", "blood", "hard", "bunch", "fire", "speed", "duty",
    "active", "half", "north", "memory", "product", "eye", "twenty", "police", "sale", "south",
    "illness", "collection", "basic", "previous", "base", "position", "belief", "poetry", "respect",
    "difference", "sea", "building", "reporter", "entry", "against", "progress", "ability",
    "available", "behavior", "prevention", "former", "legal", "subject", "income", "expert", "art",
    "village", "natural", "positive", "project", "age", "land", "accept", "message", "private",
    "invitation", "package", "root", "fate", "account", "abundant", "complex", "rescue", "gas",
    "next", "prison", "court", "picture", "improvement", "request", "file", "present", "weight",
    "lack", "there", "knowledge", "energy", "enemy", "street", "again", "road", "mistake", "how",
    "here", "agriculture", "player", "treatment", "east", "story", "beautiful", "busy", "event",
    "size", "permit", "study", "army", "weakness", "honor", "television", "factory", "total",
    "kill", "local", "normal", "heart", "tradition", "justice", "morning", "profit", "simple",
    "able", "escape", "healthy", "peace", "gold", "yesterday", "identity", "body", "color",
    "quality", "back", "sport", "trust", "anxiety", "effective", "similar", "persian", "satisfaction",
    "century", "car", "amount",
  ],
];

const REVIEWED_OVERRIDES = new Map(Object.entries({
  must: { persian: "باید", phonetic: "bɒːjæd", latin: "bâyad", partOfSpeech: "modal verb" },
  which: { persian: "کدام", phonetic: "kodɒːm", latin: "kodâm", partOfSpeech: "pronoun" },
  very: { persian: "خیلی", phonetic: "xejli", latin: "kheyli", partOfSpeech: "adverb" },
  only: { persian: "فقط", phonetic: "fæɣæt", latin: "faghat", partOfSpeech: "adverb" },
  person: { persian: "شخص", phonetic: "ʃæxs", latin: "shakhs", partOfSpeech: "noun" },
  some: { persian: "بعضی", phonetic: "bæʔzi", latin: "ba'zi", partOfSpeech: "pronoun" },
  power: { persian: "قدرت", phonetic: "ɣodræt", latin: "ghodrat", partOfSpeech: "noun" },
  security: { persian: "امنیت", phonetic: "æmniːjæt", latin: "amniyat", partOfSpeech: "noun" },
  active: { persian: "فعال", phonetic: "fæʔɒːl", latin: "fa'âl", partOfSpeech: "adjective" },
  eye: { persian: "چشم", phonetic: "t͡ʃeʃm", latin: "cheshm", partOfSpeech: "noun" },
  building: { persian: "ساختمان", phonetic: "sɒːxtemɒːn", latin: "sâkhtemân", partOfSpeech: "noun" },
  body: { persian: "بدن", phonetic: "bædæn", latin: "badan", partOfSpeech: "noun" },
}));

const SPELLING_CORRECTIONS = new Map(Object.entries({
  "تالش": "تلاش",
  "الزم": "لازم",
  "اصالح": "اصلاح",
  "طوالنی": "طولانی",
  "اختالف": "اختلاف",
  "طال": "طلا",
}));

const sourceText = process.env.FARSI_FREQUENCY_WIKITEXT
  ? await readFile(process.env.FARSI_FREQUENCY_WIKITEXT, "utf8")
  : await downloadWikitext();
const sourceEntries = parseFrequencyTable(sourceText);
const byEnglish = new Map();
for (const entry of sourceEntries) {
  // If a gloss occurs more than once, the highest-frequency Persian entry is
  // the default sense learners should meet first.
  if (!byEnglish.has(entry.english)) byEnglish.set(entry.english, entry);
}
const supplements = new Map(
  WORDS.map((word) => [word.english, {
    ...word,
    level: 1,
    partOfSpeech: "reviewed",
    frequencyRank: null,
    source: "project-reviewed",
  }]),
);

const curriculum = [];
const usedEnglish = new Set();
const usedPersian = new Set();

// The compact hand-reviewed starter set takes precedence for conversational
// essentials that the corpus under-ranks, such as greetings, food, and colors.
for (const word of supplements.values()) addUnique(word);

for (const [levelIndex, selected] of LEVELS.entries()) {
  for (const english of selected) {
    if (usedEnglish.has(english)) continue;
    const entry = byEnglish.get(english);
    if (!entry) throw new Error(`Selected curriculum gloss not found: ${english}`);
    const override = REVIEWED_OVERRIDES.get(english);
    addUnique({
      ...entry,
      ...override,
      level: levelIndex + 1,
      source: override ? `${entry.source}+project-review` : entry.source,
    });
  }
}

await mkdir(path.dirname(outputFile), { recursive: true });
await writeFile(outputFile, `${JSON.stringify(curriculum, null, 2)}\n`);
console.log(
  `Curriculum built: ${curriculum.length} reviewed words ` +
  `(${countLevel(1)} essential, ${countLevel(2)} everyday, ` +
    `${countLevel(3)} extended).`,
);

function addUnique(word) {
  const english = word.english.toLowerCase();
  const persian = normalizePersian(word.persian);
  if (usedEnglish.has(english) || usedPersian.has(persian)) return;
  usedEnglish.add(english);
  usedPersian.add(persian);
  curriculum.push({
    english,
    persian,
    phonetic: word.phonetic,
    latin: word.latin,
    level: word.level,
    partOfSpeech: word.partOfSpeech,
    frequencyRank: word.frequencyRank,
    source: word.source,
  });
}

function countLevel(level) {
  return curriculum.filter((word) => word.level === level).length;
}

async function downloadWikitext() {
  const url = new URL(api);
  url.search = new URLSearchParams({
    action: "parse",
    page,
    prop: "wikitext",
    format: "json",
    formatversion: "2",
  });
  const response = await fetch(url, {
    headers: { "User-Agent": "Vazheh-Baran curriculum importer/1.0" },
  });
  if (!response.ok) throw new Error(`Wiktionary API returned ${response.status}`);
  const payload = await response.json();
  if (!payload.parse?.wikitext) throw new Error("Wiktionary response had no wikitext.");
  return payload.parse.wikitext;
}

function parseFrequencyTable(value) {
  const parsed = [];
  for (const row of value.split(/\n\|-\n/).slice(1)) {
    const columns = row.split(" || ");
    if (columns.length < 5) continue;
    const frequencyRank = Number(columns[0].replace(/^\|\s*/, ""));
    const word = columns[1].match(
      /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]<\/span>\s*\(([^)]+)\)/,
    );
    if (!word || !Number.isInteger(frequencyRank)) continue;
    // Multi-sense rows are eligible only through their first dictionary sense;
    // the explicit allowlist below still decides whether that sense is taught.
    const english = stripMarkup(columns[3]).toLowerCase().split(/[,/]/)[0].trim();
    const partOfSpeech = columns[4].replace(/[\n|}].*$/s, "").trim();
    const persian = normalizePersian(word[1]);
    if (!/^[a-z]+(?:['’-][a-z]+)*$/.test(english)) continue;
    if (/\s/.test(persian) || partOfSpeech === "proper noun") continue;
    const ipa = word[2].split(",")[0].trim();
    parsed.push({
      english,
      persian,
      phonetic: ipa,
      latin: ipaToLatin(ipa),
      partOfSpeech,
      frequencyRank,
      source: "miller-2009-via-wiktionary",
    });
  }
  return parsed;
}

function stripMarkup(value) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, label) => label ?? target)
    .trim();
}

function normalizePersian(value) {
  const normalized = value
    .normalize("NFC")
    .replaceAll("ي", "ی")
    .replaceAll("ك", "ک")
    .replace(/[ًٌٍَُِّْ]/g, "")
    .trim();
  return SPELLING_CORRECTIONS.get(normalized) ?? normalized;
}

function ipaToLatin(value) {
  return value
    .normalize("NFD")
    .replaceAll("t͡ʃ", "CH")
    .replaceAll("d͡ʒ", "J")
    .replaceAll("ʧ", "CH")
    .replaceAll("ʤ", "J")
    .replaceAll("ɒː", "â")
    .replaceAll("ɑː", "â")
    .replaceAll("ɒ", "â")
    .replaceAll("ɑ", "â")
    .replaceAll("æ", "a")
    .replaceAll("ə", "e")
    .replaceAll("ɪ", "i")
    .replaceAll("ʊ", "u")
    .replaceAll("ɾ", "r")
    .replaceAll("ʃ", "sh")
    .replaceAll("ʒ", "zh")
    .replaceAll("x", "kh")
    .replaceAll("ɣ", "gh")
    .replaceAll("q", "gh")
    .replaceAll("j", "y")
    .replaceAll("ʔ", "'")
    .replaceAll("CH", "ch")
    .replaceAll("J", "j")
    .replace(/[ːʰʲʱ̥̪́.]/g, "")
    .trim();
}
