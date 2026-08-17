import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { WORDS } from "../src/data/words.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dictionaryDirectory = path.join(root, "public/data/dictionary");
const pronunciationSource =
  "https://cdn.jsdelivr.net/gh/open-dict-data/ipa-dict@master/data/fa.txt";
const englishFrequencySource =
  "https://raw.githubusercontent.com/david47k/top-english-wordlists/master/top_english_words_lower_20000.txt";
const mixedEnglishFrequencySource =
  "https://raw.githubusercontent.com/david47k/top-english-wordlists/master/top_english_words_mixed_20000.txt";
const cleanLexiconSource =
  "https://raw.githubusercontent.com/JakesMD/Re-Enable/main/re-enable.txt";
const verificationSource =
  "https://gist.githubusercontent.com/Jalalx/20cfd9610ef0267a9b36c2b2fc8fb803/raw/english-persian-dict.csv";
const englishNamesSource =
  "https://raw.githubusercontent.com/ELI-Data-Mining-Group/PELIC-spelling/master/all_names.txt";

const pronunciationText = process.env.FARSI_IPA_FILE
  ? await readFile(process.env.FARSI_IPA_FILE, "utf8")
  : await downloadPronunciations();
const englishFrequencyText = process.env.FARSI_ENGLISH_FREQUENCY_FILE
  ? await readFile(process.env.FARSI_ENGLISH_FREQUENCY_FILE, "utf8")
  : await downloadText(englishFrequencySource, "English frequency source");
const rankedEnglish = englishFrequencyText.trim().split(/\s+/);
const commonEnglish = new Set(rankedEnglish);
const bankEnglish = new Set(rankedEnglish.slice(0, 5_000));
const mixedEnglishFrequencyText = process.env.FARSI_ENGLISH_MIXED_FREQUENCY_FILE
  ? await readFile(process.env.FARSI_ENGLISH_MIXED_FREQUENCY_FILE, "utf8")
  : await downloadText(mixedEnglishFrequencySource, "Mixed-case English frequency source");
const capitalizedEnglish = new Set(
  mixedEnglishFrequencyText
    .trim()
    .split(/\s+/)
    .filter((word) => /^[A-Z]/.test(word))
    .map((word) => word.toLowerCase()),
);
const cleanLexiconText = process.env.FARSI_CLEAN_ENGLISH_FILE
  ? await readFile(process.env.FARSI_CLEAN_ENGLISH_FILE, "utf8")
  : await downloadText(cleanLexiconSource, "Clean English lexicon");
const cleanEnglish = new Set(cleanLexiconText.trim().split(/\s+/).map((word) => word.toLowerCase()));
const englishNamesText = process.env.FARSI_ENGLISH_NAMES_FILE
  ? await readFile(process.env.FARSI_ENGLISH_NAMES_FILE, "utf8")
  : await downloadText(englishNamesSource, "English names source");
const englishNames = new Set(englishNamesText.trim().split(/\s+/).map((word) => word.toLowerCase()));
const verificationText = process.env.FARSI_VERIFICATION_DICTIONARY_FILE
  ? await readFile(process.env.FARSI_VERIFICATION_DICTIONARY_FILE, "utf8")
  : await downloadText(verificationSource, "Verification dictionary");
const { pairs: verifiedPairs, englishByPersian: verifiedEnglishByPersian } =
  buildVerifiedPairs(verificationText);
const pronunciations = new Map();
for (const line of pronunciationText.trim().split("\n")) {
  const [persian, ipa] = line.split("\t");
  if (persian && ipa) pronunciations.set(normalizePersian(persian), ipa.split(",")[0]);
}

const reviewed = new Map(WORDS.map((word) => [word.english, word]));
const pronounced = new Map(WORDS.map((word) => [word.english, word]));
const headwords = [];
const hardWords = new Map(WORDS.map((word) => [word.english, word]));
const chunkFiles = (await readdir(dictionaryDirectory))
  .filter((file) => /^[a-z_]\.json$/.test(file))
  .sort();

for (const file of chunkFiles) {
  const entries = JSON.parse(await readFile(path.join(dictionaryDirectory, file), "utf8"));
  for (const entry of entries) {
    const compactTranslations = entry.translations.filter(isCompactPersianWord);
    const verifiedTranslations = compactTranslations.filter((translation) =>
      verifiedPairs.get(entry.english.toLowerCase())?.has(normalizeForMatch(translation)) &&
      verifiedEnglishByPersian.get(normalizeForMatch(translation))?.size === 1,
    );
    if (isBankEnglishWord(entry.english)) {
      headwords.push(entry.english);
    }
    if (isCommonEnglishWord(entry.english)) {
      if (verifiedTranslations.length && !hardWords.has(entry.english)) {
        hardWords.set(entry.english, {
          english: entry.english,
          persian: verifiedTranslations[0],
          phonetic: "",
          latin: "",
        });
      }
    }
    if (!isCommonEnglishWord(entry.english)) continue;
    if (pronounced.has(entry.english)) continue;

    const translation = verifiedTranslations.find((value) =>
      pronunciations.has(normalizePersian(value)),
    );
    if (!translation) continue;

    const ipa = pronunciations.get(normalizePersian(translation));
    pronounced.set(entry.english, {
      english: entry.english,
      persian: translation,
      phonetic: ipa.replaceAll("/", ""),
      latin: ipaToLatin(ipa),
    });
  }
}

for (const [english, word] of reviewed) pronounced.set(english, word);
const cleanPronounced = [...pronounced.values()].filter(
  (word) => isCommonEnglishWord(word.english) && isCompactPersianWord(word.persian),
);

await mkdir(dictionaryDirectory, { recursive: true });
await Promise.all([
  writeFile(
    path.join(dictionaryDirectory, "game-headwords.json"),
    JSON.stringify(headwords),
  ),
  writeFile(
    path.join(dictionaryDirectory, "game-pronounced.json"),
    JSON.stringify(cleanPronounced),
  ),
  writeFile(
    path.join(dictionaryDirectory, "game-hard.json"),
    JSON.stringify([...hardWords.values()]),
  ),
]);

console.log(
  `Game dictionary built: ${headwords.length.toLocaleString()} clean headwords, ` +
    `${hardWords.size.toLocaleString()} verified translations, ` +
    `${cleanPronounced.length.toLocaleString()} pronunciation-linked entries.`,
);

async function downloadPronunciations() {
  return downloadText(pronunciationSource, "Pronunciation source");
}

async function downloadText(source, label) {
  const response = await fetch(source);
  if (!response.ok) {
    throw new Error(`${label} returned ${response.status}`);
  }
  return response.text();
}

function normalizePersian(value) {
  return value
    .normalize("NFC")
    .replaceAll("ي", "ی")
    .replaceAll("ك", "ک")
    .trim();
}

function isStandaloneEnglishWord(value) {
  return /^[A-Za-z]+(?:['’-][A-Za-z]+)*$/.test(value);
}

function isCommonEnglishWord(value) {
  const normalized = value.toLowerCase();
  return isStandaloneEnglishWord(value) &&
    commonEnglish.has(normalized) &&
    cleanEnglish.has(normalized) &&
    !englishNames.has(normalized) &&
    !capitalizedEnglish.has(normalized) &&
    normalized.length >= 3;
}

function isBankEnglishWord(value) {
  return isCommonEnglishWord(value) && bankEnglish.has(value.toLowerCase());
}

function isCompactPersianWord(value) {
  return /^[\u0600-\u06ff\u200c]+$/.test(value) && value.length <= 24;
}

function normalizeForMatch(value) {
  return normalizePersian(value).replaceAll("‌", "").replaceAll(" ", "");
}

function buildVerifiedPairs(value) {
  const pairs = new Map();
  const englishByPersian = new Map();
  for (const line of value.split("\n").slice(1)) {
    const separator = line.indexOf(",");
    if (separator < 1) continue;
    const english = line.slice(0, separator).trim().toLowerCase();
    const persian = normalizeForMatch(line.slice(separator + 1));
    if (!english || !persian) continue;
    if (!pairs.has(english)) pairs.set(english, new Set());
    pairs.get(english).add(persian);
    if (isCommonEnglishWord(english)) {
      if (!englishByPersian.has(persian)) englishByPersian.set(persian, new Set());
      englishByPersian.get(persian).add(english);
    }
  }
  return { pairs, englishByPersian };
}

function ipaToLatin(value) {
  return value
    .split(",")[0]
    .replaceAll("/", "")
    .replaceAll("t͡ʃ", "ch")
    .replaceAll("d͡ʒ", "j")
    .replaceAll("ɒː", "â")
    .replaceAll("ɑː", "â")
    .replaceAll("iː", "i")
    .replaceAll("uː", "u")
    .replaceAll("oʊ", "ow")
    .replaceAll("æ", "a")
    .replaceAll("ə", "e")
    .replaceAll("ɾ", "r")
    .replaceAll("x", "kh")
    .replaceAll("ɣ", "gh")
    .replaceAll("q", "gh")
    .replaceAll("ʃ", "sh")
    .replaceAll("ʒ", "zh")
    .replaceAll("j", "y")
    .replaceAll("ʔ", "'")
    .replaceAll("ː", "")
    .replaceAll(".", "")
    .trim();
}
