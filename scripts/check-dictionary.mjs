import { readFile } from "node:fs/promises";

const directory = new URL("../public/data/dictionary/", import.meta.url);
const manifest = await readJson(new URL("manifest.json", directory));

if (manifest.schemaVersion !== 1) {
  throw new Error(`Unsupported dictionary schema ${manifest.schemaVersion}.`);
}

let headwords = 0;
let translationPairs = 0;

for (const [chunkName, expectedHeadwords] of Object.entries(manifest.chunks)) {
  const entries = await readJson(new URL(`${chunkName}.json`, directory));
  if (entries.length !== expectedHeadwords) {
    throw new Error(
      `${chunkName}.json has ${entries.length} entries; expected ${expectedHeadwords}.`,
    );
  }

  for (const entry of entries) {
    if (!entry.english || !Array.isArray(entry.translations) || !entry.translations.length) {
      throw new Error(`Invalid dictionary entry in ${chunkName}.json.`);
    }
    translationPairs += entry.translations.length;
  }

  headwords += entries.length;
}

if (headwords !== manifest.uniqueEnglishHeadwords) {
  throw new Error(`Found ${headwords} headwords; expected ${manifest.uniqueEnglishHeadwords}.`);
}

if (translationPairs !== manifest.uniqueTranslationPairs) {
  throw new Error(
    `Found ${translationPairs} translation pairs; expected ${manifest.uniqueTranslationPairs}.`,
  );
}

const curriculum = await readJson(new URL("../curriculum.json", directory));
if (curriculum.length < 400) {
  throw new Error(`Reviewed curriculum is unexpectedly small: ${curriculum.length}.`);
}
const englishWords = new Set();
const persianWords = new Set();
const levelCounts = new Map();
for (const word of curriculum) {
  if (
    !word.english || !word.persian || !word.phonetic || !word.latin ||
    !word.partOfSpeech || !word.source || !Number.isInteger(word.level)
  ) {
    throw new Error(`Incomplete curriculum entry: ${JSON.stringify(word)}`);
  }
  if (!/^[a-z]+(?:['’-][a-z]+)*$/.test(word.english) || /\s/.test(word.persian)) {
    throw new Error(`Non-compact curriculum entry: ${word.english}=${word.persian}`);
  }
  if (englishWords.has(word.english) || persianWords.has(word.persian)) {
    throw new Error(`Duplicate curriculum entry: ${word.english}=${word.persian}`);
  }
  if (word.frequencyRank !== null &&
      (!Number.isInteger(word.frequencyRank) || word.frequencyRank < 1 || word.frequencyRank > 1_000)) {
    throw new Error(`Invalid frequency rank for ${word.english}.`);
  }
  englishWords.add(word.english);
  persianWords.add(word.persian);
  levelCounts.set(word.level, (levelCounts.get(word.level) ?? 0) + 1);
}
for (const [level, minimum] of [[1, 100], [2, 100], [3, 100]]) {
  if ((levelCounts.get(level) ?? 0) < minimum) {
    throw new Error(`Curriculum level ${level} has too few words.`);
  }
}

const forbiddenEnglish = [
  "revenues", "circumcision", "erection", "penis", "sperm", "terrorism",
  "kremlin", "manganese", "phosphorus", "tuberculosis",
];
for (const english of forbiddenEnglish) {
  if (englishWords.has(english)) throw new Error(`Unsuitable lesson word returned: ${english}`);
}
const forbiddenPersian = ["تالش", "الزم", "اصالح", "طوالنی", "اختالف", "طال"];
for (const persian of forbiddenPersian) {
  if (persianWords.has(persian)) throw new Error(`Uncorrected Persian spelling: ${persian}`);
}
const expectedPairs = new Map([
  ["hello", "سلام"], ["water", "آب"], ["book", "کتاب"], ["family", "خانواده"],
  ["must", "باید"], ["which", "کدام"], ["very", "خیلی"], ["only", "فقط"],
  ["power", "قدرت"], ["security", "امنیت"], ["eye", "چشم"], ["body", "بدن"],
  ["effort", "تلاش"], ["difference", "اختلاف"], ["gold", "طلا"],
]);
for (const [english, persian] of expectedPairs) {
  if (!curriculum.some((word) => word.english === english && word.persian === persian)) {
    throw new Error(`Expected reviewed pair is missing: ${english}=${persian}`);
  }
}

console.log(
  `Dictionary OK: ${headwords.toLocaleString()} reference headwords; ` +
    `${curriculum.length.toLocaleString()} reviewed curriculum words ` +
    `(${[1, 2, 3].map((level) => levelCounts.get(level)).join("/")} by level).`,
);

async function readJson(url) {
  return JSON.parse(await readFile(url, "utf8"));
}
