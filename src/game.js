export const DIFFICULTIES = {
  beginner: {
    bankSize: 4,
    curriculumLevel: 1,
    fallDuration: 12_000,
    showPhonetic: true,
    showLatin: true,
  },
  medium: {
    bankSize: 8,
    curriculumLevel: 2,
    fallDuration: 10_000,
    showPhonetic: false,
    showLatin: true,
  },
  hard: {
    bankSize: 20,
    curriculumLevel: 3,
    fallDuration: 8_000,
    showPhonetic: false,
    showLatin: false,
  },
};

export const BANK_EXPOSURE_RATIO = 0.78;

export function streakMultiplier(streak) {
  return Math.max(1, Math.trunc(streak));
}

export function wordNumberFromShortcut(code, controlKey = false) {
  const match = /^(?:Digit|Numpad)(\d)$/.exec(code);
  if (!match) return null;
  const digit = Number(match[1]);
  if (controlKey) return digit === 0 ? 20 : digit + 10;
  return digit === 0 ? 10 : digit;
}

export function shortcutLabel(index) {
  const number = index + 1;
  if (number < 10) return number.toString();
  if (number === 10) return "0";
  return `Control+${number === 20 ? 0 : number - 10}`;
}

export function createWordDeck(words, random = Math.random) {
  return shuffle(words, random);
}

export function drawWordBankFromDeck(deck, words, answer, size, random = Math.random) {
  if (size > words.length) {
    throw new RangeError(`Cannot build a ${size}-word bank from ${words.length} words.`);
  }

  const choices = [answer];
  const used = new Set([answer.english]);
  const deferred = [];

  while (choices.length < size) {
    if (deck.length === 0) {
      deck.push(...createWordDeck(words, random));
    }

    const candidate = deck.pop();
    if (used.has(candidate.english)) {
      deferred.push(candidate);
      continue;
    }

    used.add(candidate.english);
    choices.push(candidate);
  }

  deck.unshift(...deferred);
  return shuffle(choices, random);
}

export function buildWordBank(words, answer, size, random = Math.random) {
  if (size > words.length) {
    throw new RangeError(`Cannot build a ${size}-word bank from ${words.length} words.`);
  }

  const distractors = shuffle(
    words.filter((word) => word.english !== answer.english),
    random,
  ).slice(0, size - 1);

  return shuffle([answer, ...distractors], random);
}

export function pickNextWord(words, previousWord, random = Math.random) {
  const candidates = previousWord
    ? words.filter((word) => word.english !== previousWord.english)
    : words;
  return candidates[Math.floor(random() * candidates.length)];
}

export function visibleClues(difficulty) {
  const settings = DIFFICULTIES[difficulty];
  if (!settings) throw new RangeError(`Unknown difficulty: ${difficulty}`);
  return {
    phonetic: settings.showPhonetic,
    latin: settings.showLatin,
    english: false,
    persian: true,
  };
}

function shuffle(values, random) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const otherIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[otherIndex]] = [
      shuffled[otherIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}
