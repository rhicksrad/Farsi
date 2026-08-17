import { WORDS } from "./data/words.js";

const dictionaryBase = `${import.meta.env.BASE_URL}data/dictionary/`;

let headwordsPromise;
let headwordDeck = [];
let targetDeck = [];

export async function resetDictionaryDecks(_difficulty, random = Math.random) {
  const headwords = await loadJson("game-headwords.json", "headwords");
  headwordDeck = shuffle(headwords, random);
  targetDeck = shuffle(WORDS, random);
  return { headwords: headwords.length, targets: targetDeck.length };
}

export async function createDictionaryRound(difficulty, bankSize, random = Math.random) {
  if (headwordDeck.length === 0 || targetDeck.length === 0) {
    await resetDictionaryDecks(difficulty, random);
  }

  const answer = targetDeck.pop();
  const bank = [answer];
  const used = new Set([answer.english]);

  while (bank.length < bankSize) {
    if (headwordDeck.length === 0) {
      const headwords = await loadJson("game-headwords.json", "headwords");
      headwordDeck = shuffle(headwords, random);
    }
    const english = headwordDeck.pop();
    if (used.has(english)) continue;
    used.add(english);
    bank.push({ english });
  }

  return { answer, bank: shuffle(bank, random) };
}

function loadJson(file, cacheName) {
  if (cacheName === "headwords" && headwordsPromise) return headwordsPromise;

  const promise = fetch(`${dictionaryBase}${file}`).then((response) => {
    if (!response.ok) throw new Error(`${file} returned ${response.status}`);
    return response.json();
  });
  if (cacheName === "headwords") headwordsPromise = promise;
  return promise;
}

function shuffle(values, random) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[otherIndex]] = [shuffled[otherIndex], shuffled[index]];
  }
  return shuffled;
}
