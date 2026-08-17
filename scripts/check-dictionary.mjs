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

console.log(
  `Dictionary OK: ${headwords.toLocaleString()} headwords, ${translationPairs.toLocaleString()} translation pairs.`,
);

async function readJson(url) {
  return JSON.parse(await readFile(url, "utf8"));
}

