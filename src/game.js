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

export function groundImpactProfile(width, hitNumber, random = Math.random) {
  const impact = Math.max(1, Math.trunc(hitNumber));
  const growth = 1 + (impact - 1) * 0.14;
  const baseRadius = Math.max(
    36,
    Math.min(86, width * (0.04 + random() * 0.045)),
  );
  return {
    radius: Math.min(width * 0.14, baseRadius * growth),
    power: Math.min(2.4, 1 + (impact - 1) * 0.12),
  };
}

export function findTerrainContactX(
  { centerX, centerY, width, height },
  surfaceYAt,
  sampleSpacing = 4,
) {
  const left = centerX - width / 2;
  const right = centerX + width / 2;
  const bottom = centerY + height / 2;
  const sampleCount = Math.max(1, Math.ceil(width / sampleSpacing));

  for (let index = 0; index <= sampleCount; index += 1) {
    const x = left + (right - left) * (index / sampleCount);
    if (bottom >= surfaceYAt(x)) return x;
  }

  return null;
}

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

export function visibleClues(difficulty, direction = "fa-en") {
  const settings = DIFFICULTIES[difficulty];
  if (!settings) throw new RangeError(`Unknown difficulty: ${difficulty}`);
  if (direction === "en-fa") {
    return {
      phonetic: false,
      latin: false,
      english: true,
      persian: false,
    };
  }
  if (direction !== "fa-en") throw new RangeError(`Unknown direction: ${direction}`);
  return {
    phonetic: settings.showPhonetic,
    latin: settings.showLatin,
    english: false,
    persian: true,
  };
}

export function wordTextForBank(word, direction = "fa-en") {
  if (direction === "fa-en") return word.english;
  if (direction === "en-fa") return word.persian;
  throw new RangeError(`Unknown direction: ${direction}`);
}

export function missFeedback(word, direction = "fa-en") {
  if (direction === "fa-en") return `Miss — ${word.persian} means “${word.english}.”`;
  if (direction === "en-fa") return `Miss — “${word.english}” means ${word.persian}.`;
  throw new RangeError(`Unknown direction: ${direction}`);
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
