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

const gameHeadwords = await readJson(new URL("game-headwords.json", directory));
if (gameHeadwords.length < 15_000) {
  throw new Error(`Clean gameplay index is unexpectedly small: ${gameHeadwords.length}.`);
}
for (const english of gameHeadwords) {
  if (!/^[A-Za-z]+(?:['’-][A-Za-z]+)*$/.test(english)) {
    throw new Error(`Unclean gameplay headword: ${english}`);
  }
}

const hardWords = await readJson(new URL("game-hard.json", directory));
if (hardWords.length < 11_000) {
  throw new Error(`Compact translation pool is unexpectedly small: ${hardWords.length}.`);
}
const pronounced = await readJson(new URL("game-pronounced.json", directory));
if (pronounced.length < 2_800) {
  throw new Error(`Gameplay pronunciation pool is unexpectedly small: ${pronounced.length}.`);
}
for (const [poolName, words] of [["hard", hardWords], ["pronounced", pronounced]]) {
  for (const word of words) {
    if (!word.english || !word.persian || /\s/.test(word.english) || /\s/.test(word.persian)) {
      throw new Error(`Invalid ${poolName} gameplay entry.`);
    }
    if (poolName === "pronounced" && (!word.phonetic || !word.latin)) {
      throw new Error("Pronunciation-linked entry is missing a pronunciation.");
    }
  }
}

console.log(
  `Dictionary OK: ${headwords.toLocaleString()} source headwords; ${gameHeadwords.length.toLocaleString()} clean bank words, ${hardWords.length.toLocaleString()} compact translations, ${pronounced.length.toLocaleString()} pronunciation-linked entries.`,
);

async function readJson(url) {
  return JSON.parse(await readFile(url, "utf8"));
}
