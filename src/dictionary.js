const curriculumUrl = `${import.meta.env.BASE_URL}data/curriculum.json`;

let curriculumPromise;
let bankDeck = [];
let targetDeck = [];
let activeDifficulty;

export async function resetDictionaryDecks(difficulty, random = browserRandom) {
  const targets = await loadCurriculum();
  const maxLevel = curriculumLevel(difficulty);
  const available = targets.filter((word) => word.level <= maxLevel);
  activeDifficulty = difficulty;
  bankDeck = shuffle(available, random);
  targetDeck = shuffle(available, random);
  return { targets: targetDeck.length };
}

export async function createDictionaryRound(difficulty, bankSize, random = browserRandom) {
  if (activeDifficulty !== difficulty || bankDeck.length === 0 || targetDeck.length === 0) {
    await resetDictionaryDecks(difficulty, random);
  }

  const answer = targetDeck.pop();
  const bank = [answer];
  const used = new Set([answer.english]);

  while (bank.length < bankSize) {
    if (bankDeck.length === 0) {
      const curriculum = await loadCurriculum();
      const maxLevel = curriculumLevel(difficulty);
      bankDeck = shuffle(
        curriculum.filter((word) => word.level <= maxLevel),
        random,
      );
    }
    const candidate = bankDeck.pop();
    if (used.has(candidate.english)) continue;
    used.add(candidate.english);
    bank.push(candidate);
  }

  return { answer, bank: shuffle(bank, random) };
}

function loadCurriculum() {
  if (curriculumPromise) return curriculumPromise;
  curriculumPromise = fetch(curriculumUrl).then((response) => {
    if (!response.ok) throw new Error(`curriculum.json returned ${response.status}`);
    return response.json();
  });
  return curriculumPromise;
}

function curriculumLevel(difficulty) {
  const levels = { beginner: 1, medium: 2, hard: 3 };
  const level = levels[difficulty];
  if (!level) throw new RangeError(`Unknown difficulty: ${difficulty}`);
  return level;
}

function browserRandom() {
  if (!globalThis.crypto?.getRandomValues) return Math.random();
  const value = new Uint32Array(1);
  globalThis.crypto.getRandomValues(value);
  return value[0] / 0x1_0000_0000;
}

function shuffle(values, random) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[otherIndex]] = [shuffled[otherIndex], shuffled[index]];
  }
  return shuffled;
}
