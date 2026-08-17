import assert from "node:assert/strict";
import test from "node:test";

import { WORDS } from "../src/data/words.js";
import {
  DIFFICULTIES,
  buildWordBank,
  pickNextWord,
  visibleClues,
} from "../src/game.js";

test("difficulty modes use the requested bank sizes", () => {
  assert.equal(DIFFICULTIES.beginner.bankSize, 4);
  assert.equal(DIFFICULTIES.medium.bankSize, 8);
  assert.equal(DIFFICULTIES.hard.bankSize, 20);
});

test("difficulty modes progressively remove clues", () => {
  assert.deepEqual(visibleClues("beginner"), {
    phonetic: true,
    english: true,
    persian: true,
  });
  assert.deepEqual(visibleClues("medium"), {
    phonetic: false,
    english: true,
    persian: true,
  });
  assert.deepEqual(visibleClues("hard"), {
    phonetic: false,
    english: false,
    persian: true,
  });
});

for (const [difficulty, settings] of Object.entries(DIFFICULTIES)) {
  test(`${difficulty} bank contains one correct answer and unique choices`, () => {
    const answer = WORDS[0];
    const bank = buildWordBank(WORDS, answer, settings.bankSize, () => 0.42);
    assert.equal(bank.length, settings.bankSize);
    assert.equal(bank.filter((word) => word.english === answer.english).length, 1);
    assert.equal(new Set(bank.map((word) => word.english)).size, settings.bankSize);
  });
}

test("the next word does not immediately repeat", () => {
  const previous = WORDS[0];
  assert.notEqual(pickNextWord(WORDS, previous, () => 0).english, previous.english);
});

test("reviewed vocabulary has unique complete entries", () => {
  assert.ok(WORDS.length >= DIFFICULTIES.hard.bankSize);
  assert.equal(new Set(WORDS.map((word) => word.english)).size, WORDS.length);
  assert.equal(new Set(WORDS.map((word) => word.persian)).size, WORDS.length);
  for (const word of WORDS) {
    assert.ok(word.english && word.persian && word.phonetic);
  }
});

