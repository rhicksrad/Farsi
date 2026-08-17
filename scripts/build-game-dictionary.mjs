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

const pronunciationText = process.env.FARSI_IPA_FILE
  ? await readFile(process.env.FARSI_IPA_FILE, "utf8")
  : await downloadPronunciations();
const englishFrequencyText = process.env.FARSI_ENGLISH_FREQUENCY_FILE
  ? await readFile(process.env.FARSI_ENGLISH_FREQUENCY_FILE, "utf8")
  : await downloadText(englishFrequencySource, "English frequency source");
const commonEnglish = new Set(englishFrequencyText.trim().split(/\s+/));
const pronunciations = new Map();
for (const line of pronunciationText.trim().split("\n")) {
  const [persian, ipa] = line.split("\t");
  if (persian && ipa) pronunciations.set(normalizePersian(persian), ipa.split(",")[0]);
}

const reviewed = new Map(WORDS.map((word) => [word.english, word]));
const pronounced = new Map(WORDS.map((word) => [word.english, word]));
const headwords = [];
const hardWords = [];
const chunkFiles = (await readdir(dictionaryDirectory))
  .filter((file) => /^[a-z_]\.json$/.test(file))
  .sort();

for (const file of chunkFiles) {
  const entries = JSON.parse(await readFile(path.join(dictionaryDirectory, file), "utf8"));
  for (const entry of entries) {
    const compactTranslations = entry.translations.filter(isCompactPersianWord);
    if (isCommonEnglishWord(entry.english)) {
      headwords.push(entry.english);
      if (compactTranslations.length) {
        hardWords.push({
          english: entry.english,
          persian: [...compactTranslations].sort((a, b) => a.length - b.length)[0],
          phonetic: "",
          latin: "",
        });
      }
    }
    if (pronounced.has(entry.english)) continue;

    const translation = compactTranslations.find((value) =>
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
    JSON.stringify(hardWords),
  ),
]);

console.log(
  `Game dictionary built: ${headwords.length.toLocaleString()} clean headwords, ` +
    `${hardWords.length.toLocaleString()} compact translations, ` +
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
  return isStandaloneEnglishWord(value) && commonEnglish.has(value.toLowerCase());
}

function isCompactPersianWord(value) {
  return /^[\u0600-\u06ff\u200c]+$/.test(value) && value.length <= 24;
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
