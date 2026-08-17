import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_COMMIT = "224f15d42d145c59b5dc2c6890c4736693613cc2";
const SOURCE_DIRECTORY = `https://raw.githubusercontent.com/VahidN/EnglishToPersianDictionaries/${SOURCE_COMMIT}/Dictionaries/generic-13`;
const SOURCE_FILES = [
  "-",
  ".",
  "=",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "7",
  "8",
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
];
const OUTPUT_DIRECTORY = fileURLToPath(
  new URL("../public/data/dictionary/", import.meta.url),
);

const entries = new Map();
let sourceRows = 0;

const sourceGroups = await Promise.all(SOURCE_FILES.map(downloadSourceGroup));
for (const sourceGroup of sourceGroups) {
  for (const sourceEntry of sourceGroup.Words) {
    sourceRows += 1;
    const english = normalizeEnglish(sourceEntry.EnglishWord);
    if (!english) continue;

    const lookupKey = english.toLocaleLowerCase("en");
    const entry = entries.get(lookupKey) ?? {
      english,
      translations: new Set(),
    };

    for (const meaning of sourceEntry.Meanings) {
      const persian = normalizePersian(meaning);
      if (persian) entry.translations.add(persian);
    }

    if (entry.translations.size) entries.set(lookupKey, entry);
  }
}

if (sourceRows < 241_000) {
  throw new Error(`Expected at least 241,000 source rows; parsed ${sourceRows}.`);
}

const chunks = new Map();
for (const entry of entries.values()) {
  const chunkName = /^[a-z]/i.test(entry.english) ? entry.english[0].toLowerCase() : "_";
  const chunk = chunks.get(chunkName) ?? [];
  chunk.push({
    english: entry.english,
    translations: [...entry.translations].sort((a, b) => a.localeCompare(b, "fa")),
  });
  chunks.set(chunkName, chunk);
}

await mkdir(OUTPUT_DIRECTORY, { recursive: true });

const chunkManifest = {};
let translationPairs = 0;
for (const [chunkName, chunk] of [...chunks].sort(([a], [b]) => a.localeCompare(b))) {
  chunk.sort((a, b) => a.english.localeCompare(b.english, "en"));
  translationPairs += chunk.reduce((total, entry) => total + entry.translations.length, 0);
  chunkManifest[chunkName] = chunk.length;
  await writeJson(path.join(OUTPUT_DIRECTORY, `${chunkName}.json`), chunk);
}

const manifest = {
  schemaVersion: 1,
  source: {
    name: "EnglishToPersianDictionaries / generic-13",
    url: "https://github.com/VahidN/EnglishToPersianDictionaries/tree/master/Dictionaries/generic-13",
    commit: SOURCE_COMMIT,
    license: "Apache-2.0",
  },
  sourceRows,
  uniqueEnglishHeadwords: entries.size,
  uniqueTranslationPairs: translationPairs,
  chunks: chunkManifest,
};

await writeJson(path.join(OUTPUT_DIRECTORY, "manifest.json"), manifest);
console.log(
  `Imported ${manifest.uniqueEnglishHeadwords.toLocaleString()} headwords and ${manifest.uniqueTranslationPairs.toLocaleString()} unique translation pairs.`,
);

function normalizeEnglish(value) {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim();
}

function normalizePersian(value) {
  return value
    .normalize("NFC")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ـ/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function writeJson(filename, value) {
  await writeFile(filename, `${JSON.stringify(value)}\n`, "utf8");
}

async function downloadSourceGroup(groupName) {
  const filename = encodeURIComponent(`${groupName}.json`);
  const response = await fetch(`${SOURCE_DIRECTORY}/${filename}`);
  if (!response.ok) {
    throw new Error(`Could not download dictionary group ${groupName} (${response.status}).`);
  }

  const text = (await response.text()).replace(/^\uFEFF/, "");
  const sourceGroup = JSON.parse(text);
  if (!Array.isArray(sourceGroup.Words) || sourceGroup.Words.length !== sourceGroup.Entries) {
    throw new Error(`Dictionary group ${groupName} failed its entry-count check.`);
  }
  return sourceGroup;
}
