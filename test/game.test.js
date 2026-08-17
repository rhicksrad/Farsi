import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { WORDS } from "../src/data/words.js";
import {
  DIFFICULTIES,
  BANK_EXPOSURE_RATIO,
  buildWordBank,
  createWordDeck,
  drawWordBankFromDeck,
  findTerrainContactX,
  groundImpactProfile,
  pickNextWord,
  shortcutLabel,
  streakMultiplier,
  visibleClues,
  wordNumberFromShortcut,
} from "../src/game.js";
import { carveCrater, createTerrainProfile } from "../src/terrain-model.js";

const CURRICULUM = JSON.parse(
  await readFile(new URL("../public/data/curriculum.json", import.meta.url), "utf8"),
);

test("difficulty modes use the requested bank sizes", () => {
  assert.equal(DIFFICULTIES.beginner.bankSize, 4);
  assert.equal(DIFFICULTIES.medium.bankSize, 8);
  assert.equal(DIFFICULTIES.hard.bankSize, 20);
});

test("difficulty modes progressively expand the reviewed curriculum", () => {
  assert.equal(DIFFICULTIES.beginner.curriculumLevel, 1);
  assert.equal(DIFFICULTIES.medium.curriculumLevel, 2);
  assert.equal(DIFFICULTIES.hard.curriculumLevel, 3);
  const poolSizes = Object.values(DIFFICULTIES).map(
    ({ curriculumLevel }) => CURRICULUM.filter((word) => word.level <= curriculumLevel).length,
  );
  assert.ok(poolSizes[0] >= 100);
  assert.ok(poolSizes[0] < poolSizes[1]);
  assert.ok(poolSizes[1] < poolSizes[2]);
});

test("the scored curriculum contains only unique compact reviewed entries", () => {
  assert.ok(CURRICULUM.length >= 400);
  assert.equal(new Set(CURRICULUM.map((word) => word.english)).size, CURRICULUM.length);
  assert.equal(new Set(CURRICULUM.map((word) => word.persian)).size, CURRICULUM.length);
  for (const word of CURRICULUM) {
    assert.match(word.english, /^[a-z]+(?:['’-][a-z]+)*$/);
    assert.doesNotMatch(word.persian, /\s/);
    assert.ok(word.phonetic && word.latin && word.source);
  }
});

test("terrain must be deeply excavated before the word bank is exposed", () => {
  assert.ok(BANK_EXPOSURE_RATIO > 0.7);
  assert.ok(BANK_EXPOSURE_RATIO < 0.9);
});

test("successive ground impacts grow larger and launch debris harder", () => {
  const first = groundImpactProfile(1_000, 1, () => 0.5);
  const third = groundImpactProfile(1_000, 3, () => 0.5);
  const sixth = groundImpactProfile(1_000, 6, () => 0.5);

  assert.ok(first.radius >= 60);
  assert.ok(first.radius < third.radius);
  assert.ok(third.radius < sixth.radius);
  assert.ok(first.power < third.power);
  assert.ok(third.power < sixth.power);
});

test("a falling word collides across its full rendered width", () => {
  const surfaceYAt = (x) => (x < 80 ? 70 : 140);
  const word = { centerX: 100, centerY: 65, width: 60, height: 20 };

  assert.equal(findTerrainContactX(word, surfaceYAt), 70);
  assert.equal(
    findTerrainContactX({ ...word, centerX: 120, centerY: 55 }, surfaceYAt),
    null,
  );
});

test("difficulty modes progressively remove clues", () => {
  assert.deepEqual(visibleClues("beginner"), {
    phonetic: true,
    latin: true,
    english: false,
    persian: true,
  });
  assert.deepEqual(visibleClues("medium"), {
    phonetic: false,
    latin: true,
    english: false,
    persian: true,
  });
  assert.deepEqual(visibleClues("hard"), {
    phonetic: false,
    latin: false,
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

test("each game deck contains every lesson word exactly once", () => {
  const deck = createWordDeck(WORDS, () => 0.42);
  assert.equal(deck.length, WORDS.length);
  assert.equal(new Set(deck.map((word) => word.english)).size, WORDS.length);
});

test("successive beginner banks rotate distractors without repeats", () => {
  const deck = createWordDeck(WORDS, () => 0.42);
  const first = drawWordBankFromDeck(deck, WORDS, WORDS[0], 4, () => 0.42);
  const second = drawWordBankFromDeck(deck, WORDS, WORDS[1], 4, () => 0.42);
  const firstDistractors = new Set(
    first.filter((word) => word !== WORDS[0] && word !== WORDS[1]).map((word) => word.english),
  );
  const secondDistractors = second
    .filter((word) => word !== WORDS[1])
    .map((word) => word.english);

  assert.equal(secondDistractors.some((word) => firstDistractors.has(word)), false);
});

test("consecutive hits increase the streak multiplier", () => {
  assert.equal(streakMultiplier(0), 1);
  assert.equal(streakMultiplier(1), 1);
  assert.equal(streakMultiplier(2), 2);
  assert.equal(streakMultiplier(7), 7);
});

test("number shortcuts cover all twenty bank positions", () => {
  assert.equal(wordNumberFromShortcut("Digit1"), 1);
  assert.equal(wordNumberFromShortcut("Numpad9"), 9);
  assert.equal(wordNumberFromShortcut("Digit0"), 10);
  assert.equal(wordNumberFromShortcut("Digit1", true), 11);
  assert.equal(wordNumberFromShortcut("Numpad9", true), 19);
  assert.equal(wordNumberFromShortcut("Digit0", true), 20);
  assert.equal(shortcutLabel(9), "0");
  assert.equal(shortcutLabel(19), "Control+0");
});

test("reviewed vocabulary has unique complete entries", () => {
  assert.ok(WORDS.length >= DIFFICULTIES.hard.bankSize);
  assert.equal(new Set(WORDS.map((word) => word.english)).size, WORDS.length);
  assert.equal(new Set(WORDS.map((word) => word.persian)).size, WORDS.length);
  for (const word of WORDS) {
    assert.ok(word.english && word.persian && word.phonetic && word.latin);
  }
});

test("terrain starts as one broad earth-filled battlefield", () => {
  const profile = createTerrainProfile(1000, 600);
  assert.ok(Math.min(...profile) < 200);
  assert.ok(Math.max(...profile) < 275);
  assert.ok(Math.max(...profile) - Math.min(...profile) > 60);
});

test("portrait terrain leaves a clear sky band on mobile", () => {
  const height = 800;
  const profile = createTerrainProfile(390, height);

  assert.ok(Math.min(...profile) > height * 0.4);
  assert.ok(Math.max(...profile) < height * 0.6);
});

test("landscape terrain keeps the mobile sky visible", () => {
  const height = 340;
  const profile = createTerrainProfile(844, height);

  assert.ok(Math.min(...profile) > height * 0.33);
  assert.ok(Math.max(...profile) < height * 0.52);
});

test("an explosion permanently carves only its local terrain", () => {
  const profile = createTerrainProfile(1000, 600);
  const untouched = profile[300];
  const impactY = profile[800];
  const before = profile[800];

  assert.equal(carveCrater(profile, 800, impactY, 42, 600), true);
  assert.ok(profile[800] > before + 25);
  assert.equal(profile[300], untouched);
});

test("the earth takes several direct hits before the bank is exposed", () => {
  const height = 600;
  const centerX = 500;
  const profile = createTerrainProfile(1000, height);
  let hits = 0;

  while (profile[centerX] < height * BANK_EXPOSURE_RATIO && hits < 20) {
    carveCrater(profile, centerX, profile[centerX], 54, height);
    hits += 1;
  }

  assert.ok(hits >= 5);
  assert.ok(hits <= 10);
});
