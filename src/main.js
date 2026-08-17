import "./style.css";
import { WORDS } from "./data/words.js";
import {
  DIFFICULTIES,
  BANK_EXPOSURE_RATIO,
  createWordDeck,
  drawWordBankFromDeck,
  findTerrainContactX,
  groundImpactProfile,
  missFeedback,
  shortcutLabel,
  streakMultiplier,
  visibleClues,
  wordTextForBank,
  wordNumberFromShortcut,
} from "./game.js";
import { createDictionaryRound, resetDictionaryDecks } from "./dictionary.js";
import { setupTerrain } from "./terrain.js";

const elements = {
  arena: document.querySelector("[data-arena]"),
  answerPanel: document.querySelector("[data-answer-panel]"),
  bank: document.querySelector("[data-word-bank]"),
  bankCount: document.querySelector("[data-bank-count]"),
  best: document.querySelector("[data-best]"),
  difficulty: document.querySelector("[data-difficulty]"),
  dictionaryStatus: document.querySelector("[data-dictionary-status]"),
  directionLabel: document.querySelector("[data-direction-label]"),
  directionToggle: document.querySelector("[data-direction-toggle]"),
  finalScore: document.querySelector("[data-final-score]"),
  english: document.querySelector("[data-english]"),
  instructions: document.querySelector("[data-instructions]"),
  latin: document.querySelector("[data-latin]"),
  lives: document.querySelector("[data-lives]"),
  message: document.querySelector("[data-message]"),
  multiplier: document.querySelector("[data-multiplier]"),
  overlay: document.querySelector("[data-overlay]"),
  persian: document.querySelector("[data-persian]"),
  phonetic: document.querySelector("[data-phonetic]"),
  restart: document.querySelector("[data-restart]"),
  score: document.querySelector("[data-score]"),
  streak: document.querySelector("[data-streak]"),
  target: document.querySelector("[data-target]"),
  textSize: document.querySelector("[data-text-size]"),
  trajectories: document.querySelector("[data-trajectories]"),
};

const state = {
  answerLocked: false,
  bankBreachRatio: null,
  bankDeck: [],
  bankStatus: "shielded",
  currentWord: null,
  difficulty: "beginner",
  direction: "fa-en",
  incomingAnimation: null,
  incomingEnd: null,
  gameId: 0,
  groundImpacts: 0,
  nextRoundTimer: null,
  score: 0,
  streak: 0,
  wordDeck: [],
};

const savedBest = Number.parseInt(localStorage.getItem("wordfall-best") ?? "0", 10);
elements.best.textContent = Number.isNaN(savedBest) ? "0" : savedBest.toString();

const textSizes = new Set(["small", "medium", "large", "huge", "ancient"]);
const savedTextSize = localStorage.getItem("wordfall-text-size");
applyTextSize(textSizes.has(savedTextSize) ? savedTextSize : "medium", false);

elements.difficulty.addEventListener("change", () => {
  state.difficulty = elements.difficulty.value;
  void startGame();
});
elements.directionToggle.addEventListener("click", () => {
  state.direction = state.direction === "fa-en" ? "en-fa" : "fa-en";
  void startGame();
});
elements.textSize.addEventListener("change", () => {
  applyTextSize(elements.textSize.value);
});
elements.restart.addEventListener("click", () => void startGame());
document.addEventListener("keydown", handleWordShortcut, true);

const terrain = setupTerrain(elements.arena);
void startGame();
void showDictionaryStatus();

function applyTextSize(textSize, persist = true) {
  const nextSize = textSizes.has(textSize) ? textSize : "medium";
  document.documentElement.dataset.textSize = nextSize;
  elements.textSize.value = nextSize;
  if (persist) localStorage.setItem("wordfall-text-size", nextSize);
}

async function startGame() {
  state.gameId += 1;
  const gameId = state.gameId;
  clearTimeout(state.nextRoundTimer);
  state.nextRoundTimer = null;
  cancelIncoming();
  elements.trajectories.replaceChildren();
  terrain.reset();
  state.answerLocked = true;
  state.currentWord = null;
  state.bankStatus = "shielded";
  state.bankBreachRatio = null;
  state.score = 0;
  state.streak = 0;
  state.groundImpacts = 0;
  state.wordDeck = createWordDeck(WORDS);
  state.bankDeck = createWordDeck(WORDS);
  elements.overlay.hidden = true;
  elements.answerPanel.classList.remove("exposed", "hit");
  elements.target.className = "incoming-word";
  elements.target.style.opacity = "0";
  elements.message.textContent = "Loading dictionary…";
  renderBank([]);
  updateScoreboard();
  updateDirectionControl();
  updateDifficultyCopy();
  try {
    await resetDictionaryDecks(state.difficulty);
  } catch (error) {
    console.error(error);
  }
  if (gameId !== state.gameId) return;
  await spawnWord();
}

async function spawnWord() {
  const gameId = state.gameId;
  state.answerLocked = true;
  const settings = DIFFICULTIES[state.difficulty];
  let round;
  try {
    round = await createDictionaryRound(state.difficulty, settings.bankSize);
  } catch (error) {
    console.error(error);
    if (state.wordDeck.length === 0) state.wordDeck = createWordDeck(WORDS);
    const answer = state.wordDeck.pop();
    round = {
      answer,
      bank: drawWordBankFromDeck(state.bankDeck, WORDS, answer, settings.bankSize),
    };
  }
  if (gameId !== state.gameId) return;

  state.currentWord = round.answer;
  state.answerLocked = false;

  elements.target.className = "incoming-word";
  elements.target.style.opacity = "";
  elements.phonetic.textContent = state.currentWord.phonetic;
  elements.latin.textContent = state.currentWord.latin;
  elements.english.textContent = state.currentWord.english;
  elements.persian.textContent = state.currentWord.persian;
  const clues = visibleClues(state.difficulty, state.direction);
  elements.phonetic.hidden = !clues.phonetic;
  elements.latin.hidden = !clues.latin;
  elements.english.hidden = !clues.english;
  elements.persian.hidden = !clues.persian;
  elements.message.textContent = "";
  renderBank(round.bank);

  startIncomingFlight(settings.fallDuration);
}

function startIncomingFlight(duration) {
  cancelIncoming();
  const width = elements.arena.clientWidth;
  const targetWidth = elements.target.offsetWidth;
  const targetHeight = elements.target.offsetHeight;
  const endX = state.bankStatus === "exposed" && state.bankBreachRatio !== null
    ? width * state.bankBreachRatio
    : width * (0.08 + Math.random() * 0.84);
  const direction = Math.random() > 0.5 ? 1 : -1;
  const horizontalOffset = width * (0.2 + Math.random() * 0.28);
  const start = {
    x: Math.max(
      width * 0.03,
      Math.min(width * 0.97, endX + direction * horizontalOffset),
    ),
    y: targetHeight * 0.7,
  };
  const impactY = state.bankStatus === "exposed"
    ? elements.arena.clientHeight * 0.86
    : terrain.getSurfaceY(endX);
  const end = {
    x: endX,
    y: impactY - targetHeight * 0.44,
  };
  const control = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
  state.incomingEnd = end;

  positionOnCurve(elements.target, start, control, end, 0);

  let frameId;
  let canceled = false;
  let paused = false;
  let previousFrameAt = performance.now();
  let elapsed = 0;
  let speedMultiplier = 1;

  const tick = (now) => {
    if (canceled || paused) return;
    elapsed += (now - previousFrameAt) * speedMultiplier;
    previousFrameAt = now;
    const progress = Math.min(1, elapsed / duration);
    const point = positionOnCurve(elements.target, start, control, end, progress);
    const terrainContactX = findTerrainContactX(
      {
        centerX: point.x,
        centerY: point.y,
        width: targetWidth,
        height: targetHeight,
      },
      terrain.getSurfaceY,
    );

    if (terrainContactX !== null) {
      state.incomingAnimation = null;
      state.incomingEnd = { x: terrainContactX, y: terrain.getSurfaceY(terrainContactX) };
      handleImpact(true);
      return;
    }

    if (progress === 1) {
      state.incomingAnimation = null;
      handleImpact(state.bankStatus !== "exposed");
      return;
    }
    frameId = requestAnimationFrame(tick);
  };

  frameId = requestAnimationFrame(tick);
  state.incomingAnimation = {
    pause() {
      paused = true;
      cancelAnimationFrame(frameId);
    },
    accelerate(multiplier = 1.8) {
      speedMultiplier = Math.max(speedMultiplier, multiplier);
    },
    cancel() {
      canceled = true;
      cancelAnimationFrame(frameId);
    },
  };
}

function addTrajectory(start, control, end, className) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("class", `trajectory ${className}`);
  path.setAttribute(
    "d",
    `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} Q ${control.x.toFixed(1)} ${control.y.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`,
  );
  elements.trajectories.append(path);

  const paths = elements.trajectories.querySelectorAll("path");
  if (paths.length > 14) paths[0].remove();
  return path;
}

function fadeTrajectory(path) {
  path.classList.add("fading");
  path.addEventListener("animationend", () => path.remove(), { once: true });
}

function positionOnCurve(element, start, control, end, progress) {
  const point = pointOnCurve(start, control, end, progress);
  element.style.left = `${point.x}px`;
  element.style.top = `${point.y}px`;
  element.style.transform = `translate(-50%, -50%) rotate(${(progress - 0.5) * 3}deg)`;
  return point;
}

function animateAlongCurve(element, start, control, end, duration) {
  return new Promise((resolve) => {
    const startedAt = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const point = pointOnCurve(start, control, end, progress);
      element.style.left = `${point.x}px`;
      element.style.top = `${point.y}px`;
      element.style.transform = "translate(-50%, -50%)";

      if (progress === 1) {
        element.remove();
        resolve();
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });
}

function pointOnCurve(start, control, end, progress) {
  const inverse = 1 - progress;
  return {
    x:
      inverse * inverse * start.x +
      2 * inverse * progress * control.x +
      progress * progress * end.x,
    y:
      inverse * inverse * start.y +
      2 * inverse * progress * control.y +
      progress * progress * end.y,
  };
}

function renderBank(words) {
  elements.bank.replaceChildren();
  for (const [index, word] of words.entries()) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "word-shell";
    button.dataset.answer = word.english;
    button.setAttribute("aria-keyshortcuts", shortcutLabel(index));
    button.title = `Fire with ${shortcutLabel(index)}`;

    const number = document.createElement("span");
    number.className = "shortcut-number";
    number.textContent = (index + 1).toString();
    const label = document.createElement("span");
    label.className = "word-label";
    label.textContent = wordTextForBank(word, state.direction);
    if (state.direction === "en-fa") {
      button.classList.add("persian-bank");
      label.lang = "fa";
      label.dir = "rtl";
    }
    button.append(number, label);
    button.addEventListener("click", () => fireAnswer(button, word));
    elements.bank.append(button);
  }
}

function handleWordShortcut(event) {
  if (event.repeat || event.altKey || event.metaKey || event.shiftKey) return;

  const number = wordNumberFromShortcut(event.code, event.ctrlKey);
  if (number === null) return;
  const button = elements.bank.querySelectorAll("button")[number - 1];
  if (!button || button.disabled || !elements.overlay.hidden) return;

  event.preventDefault();
  button.click();
}

async function fireAnswer(button, word) {
  if (state.answerLocked || button.disabled) return;

  button.blur();
  button.disabled = true;
  button.classList.add("spent");

  if (word.english !== state.currentWord.english) {
    state.streak = 0;
    state.score = Math.max(0, state.score - 15);
    setBankDisabled(true);
    state.incomingAnimation?.accelerate();
    button.classList.remove("miss");
    void button.offsetWidth;
    button.classList.add("miss");
    void animateShot(false);
    showMissMessage();
    updateScoreboard();
    return;
  }

  state.answerLocked = true;
  const gameId = state.gameId;
  setBankDisabled(true);
  state.incomingAnimation?.pause();
  await animateShot(true);
  if (gameId !== state.gameId) return;

  state.incomingAnimation?.cancel();
  state.streak += 1;
  state.score += 100 * streakMultiplier(state.streak);
  elements.target.classList.add("destroyed");
  showMessage("Hit!", "hit");
  updateScoreboard();
  scheduleNextRound(650);
}

async function animateShot(isHit) {
  const arenaRect = elements.arena.getBoundingClientRect();
  const targetRect = elements.target.getBoundingClientRect();
  const launchX = arenaRect.width * 0.5;
  const start = {
    x: launchX,
    y: terrain.getSurfaceY(launchX) - 2,
  };
  const target = {
    x: targetRect.left + targetRect.width / 2 - arenaRect.left,
    y: targetRect.top + targetRect.height / 2 - arenaRect.top,
  };
  const end = isHit
    ? target
    : {
        x: Math.max(20, Math.min(arenaRect.width - 20, target.x + (Math.random() > 0.5 ? 72 : -72))),
        y: Math.max(20, target.y - 36),
      };
  const control = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };

  const shotPath = addTrajectory(start, control, end, isHit ? "player-trail" : "miss-trail");

  const shot = document.createElement("span");
  shot.className = "shot";
  shot.setAttribute("aria-hidden", "true");
  elements.arena.append(shot);
  await animateAlongCurve(shot, start, control, end, isHit ? 430 : 520);
  fadeTrajectory(shotPath);
  showAirburst(end, isHit);
}

function handleImpact(hitGround) {
  if (state.answerLocked) return;
  state.answerLocked = true;
  const arenaRect = elements.arena.getBoundingClientRect();
  const impactX = state.incomingEnd?.x ?? arenaRect.width * 0.5;

  if (state.bankStatus === "exposed" && !hitGround) {
    state.bankStatus = "hit";
    elements.answerPanel.classList.remove("exposed");
    elements.answerPanel.classList.add("hit");
    showAirburst({ x: impactX, y: arenaRect.height * 0.86 }, false);
    elements.target.classList.add("impact");
    showMissMessage();
    updateScoreboard();
    state.nextRoundTimer = setTimeout(endGame, 750);
    return;
  }

  state.groundImpacts += 1;
  const impact = groundImpactProfile(arenaRect.width, state.groundImpacts);
  terrain.explode(
    impactX,
    terrain.getSurfaceY(impactX),
    impact.radius,
    impact.power,
  );
  state.streak = 0;
  elements.target.classList.add("impact");

  const coverDepth = terrain.getSurfaceY(impactX);
  if (coverDepth >= arenaRect.height * BANK_EXPOSURE_RATIO) {
    state.bankStatus = "exposed";
    state.bankBreachRatio = impactX / arenaRect.width;
    elements.answerPanel.classList.add("exposed");
  }
  showMissMessage();
  updateScoreboard();
  scheduleNextRound(950);
}

function showAirburst(point, isHit) {
  const burst = document.createElement("span");
  burst.className = `airburst ${isHit ? "hit" : "miss"}`;
  burst.style.left = `${point.x}px`;
  burst.style.top = `${point.y}px`;
  burst.setAttribute("aria-hidden", "true");
  elements.arena.append(burst);
  burst.addEventListener("animationend", () => burst.remove(), { once: true });
}

function scheduleNextRound(delay) {
  clearTimeout(state.nextRoundTimer);
  state.nextRoundTimer = setTimeout(() => {
    state.nextRoundTimer = null;
    void spawnWord();
  }, delay);
}

function endGame() {
  cancelIncoming();
  setBankDisabled(true);
  elements.finalScore.textContent = state.score.toLocaleString();
  elements.overlay.hidden = false;
}

function cancelIncoming() {
  if (state.incomingAnimation) {
    state.incomingAnimation.cancel();
    state.incomingAnimation = null;
  }
}

function updateScoreboard() {
  elements.score.textContent = state.score.toLocaleString();
  elements.streak.textContent = state.streak.toString();
  elements.multiplier.textContent = `×${streakMultiplier(state.streak)}`;
  elements.lives.textContent = state.bankStatus.toUpperCase();
  elements.lives.dataset.status = state.bankStatus;
  elements.lives.setAttribute(
    "aria-label",
    `Word bank ${state.bankStatus}`,
  );

  const previousBest = Number.parseInt(elements.best.textContent.replaceAll(",", ""), 10);
  if (state.score > previousBest) {
    elements.best.textContent = state.score.toLocaleString();
    localStorage.setItem("wordfall-best", state.score.toString());
  }
}

function updateDifficultyCopy() {
  const settings = DIFFICULTIES[state.difficulty];
  if (state.direction === "en-fa") {
    elements.instructions.textContent = `${capitalize(state.difficulty)} mode: English inbound, Persian word bank.`;
    elements.bankCount.textContent = `${settings.bankSize} words`;
    return;
  }
  const clues = settings.showPhonetic
    ? "pronunciation, Latin spelling, and Persian script"
    : settings.showLatin
      ? "Latin spelling and Persian script"
      : "Persian script only";
  elements.instructions.textContent = `${capitalize(state.difficulty)} mode: ${clues}.`;
  elements.bankCount.textContent = `${settings.bankSize} words`;
}

function updateDirectionControl() {
  const reversed = state.direction === "en-fa";
  elements.directionLabel.textContent = reversed ? "EN→FA" : "FA→EN";
  elements.directionToggle.setAttribute("aria-pressed", reversed.toString());
  elements.directionToggle.setAttribute(
    "aria-label",
    reversed
      ? "Switch to Persian inbound and English word bank"
      : "Switch to English inbound and Persian word bank",
  );
}

function setBankDisabled(disabled) {
  for (const button of elements.bank.querySelectorAll("button")) {
    button.disabled = disabled;
  }
}

function showMessage(message, result) {
  elements.message.textContent = message;
  elements.message.dataset.result = result;
}

function showMissMessage() {
  showMessage(missFeedback(state.currentWord, state.direction), "miss");
}

async function showDictionaryStatus() {
  try {
    const response = await fetch("./data/dictionary/manifest.json");
    if (!response.ok) throw new Error(`Dictionary manifest returned ${response.status}`);
    const manifest = await response.json();
    elements.dictionaryStatus.textContent = `${manifest.uniqueEnglishHeadwords.toLocaleString()}-word reference dictionary connected; reviewed lesson targets active.`;
  } catch (error) {
    console.error(error);
    elements.dictionaryStatus.textContent = `${WORDS.length} reviewed lesson words loaded.`;
  }
}

function capitalize(value) {
  return value[0].toUpperCase() + value.slice(1);
}
