export const DIFFICULTIES = {
  beginner: {
    bankSize: 4,
    fallDuration: 12_000,
    showPhonetic: true,
  },
  medium: {
    bankSize: 8,
    fallDuration: 10_000,
    showPhonetic: false,
  },
  hard: {
    bankSize: 20,
    fallDuration: 8_000,
    showPhonetic: false,
  },
};

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
