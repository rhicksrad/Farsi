import "./style.css";
import { WORDS } from "./data/words.js";
import {
  DIFFICULTIES,
  BANK_EXPOSURE_RATIO,
  buildWordBank,
  pickNextWord,
} from "./game.js";
import { setupTerrain } from "./terrain.js";

const elements = {
  arena: document.querySelector("[data-arena]"),
  answerPanel: document.querySelector("[data-answer-panel]"),
  bank: document.querySelector("[data-word-bank]"),
  bankCount: document.querySelector("[data-bank-count]"),
  best: document.querySelector("[data-best]"),
  difficulty: document.querySelector("[data-difficulty]"),
  dictionaryStatus: document.querySelector("[data-dictionary-status]"),
  finalScore: document.querySelector("[data-final-score]"),
  instructions: document.querySelector("[data-instructions]"),
  latin: document.querySelector("[data-latin]"),
  lives: document.querySelector("[data-lives]"),
  message: document.querySelector("[data-message]"),
  overlay: document.querySelector("[data-overlay]"),
  persian: document.querySelector("[data-persian]"),
  phonetic: document.querySelector("[data-phonetic]"),
  restart: document.querySelector("[data-restart]"),
  score: document.querySelector("[data-score]"),
  streak: document.querySelector("[data-streak]"),
  target: document.querySelector("[data-target]"),
  trajectories: document.querySelector("[data-trajectories]"),
};

const state = {
  answerLocked: false,
  bankStatus: "shielded",
  currentWord: null,
  difficulty: "beginner",
  incomingAnimation: null,
  incomingEnd: null,
  gameId: 0,
  nextRoundTimer: null,
  score: 0,
  streak: 0,
};

const savedBest = Number.parseInt(localStorage.getItem("wordfall-best") ?? "0", 10);
elements.best.textContent = Number.isNaN(savedBest) ? "0" : savedBest.toString();

elements.difficulty.addEventListener("change", () => {
  state.difficulty = elements.difficulty.value;
  startGame();
});
elements.restart.addEventListener("click", startGame);

const terrain = setupTerrain(elements.arena);
startGame();
showDictionaryStatus();

function startGame() {
  state.gameId += 1;
  clearTimeout(state.nextRoundTimer);
  state.nextRoundTimer = null;
  cancelIncoming();
  elements.trajectories.replaceChildren();
  terrain.reset();
  state.answerLocked = false;
  state.currentWord = null;
  state.bankStatus = "shielded";
  state.score = 0;
  state.streak = 0;
  elements.overlay.hidden = true;
  elements.answerPanel.classList.remove("exposed", "hit");
  elements.message.textContent = "";
  updateScoreboard();
  updateDifficultyCopy();
  spawnWord();
}

function spawnWord() {
  state.answerLocked = false;
  state.currentWord = pickNextWord(WORDS, state.currentWord);
  const settings = DIFFICULTIES[state.difficulty];
  const bank = buildWordBank(WORDS, state.currentWord, settings.bankSize);

  elements.target.className = "incoming-word";
  elements.phonetic.textContent = state.currentWord.phonetic;
  elements.latin.textContent = state.currentWord.latin;
  elements.persian.textContent = state.currentWord.persian;
  elements.phonetic.hidden = !settings.showPhonetic;
  elements.latin.hidden = !settings.showLatin;
  elements.message.textContent = "";
  renderBank(bank);

  startIncomingFlight(settings.fallDuration);
}

function startIncomingFlight(duration) {
  cancelIncoming();
  const width = elements.arena.clientWidth;
  const endX = width * (0.46 + Math.random() * 0.08);
  const direction = Math.random() > 0.5 ? 1 : -1;
  const horizontalOffset = width * (0.2 + Math.random() * 0.28);
  const start = {
    x: Math.max(
      width * 0.03,
      Math.min(width * 0.97, endX + direction * horizontalOffset),
    ),
    y: -elements.target.offsetHeight * 0.55,
  };
  const impactY = state.bankStatus === "exposed"
    ? elements.arena.clientHeight * 0.86
    : terrain.getSurfaceY(endX);
  const end = {
    x: endX,
    y: impactY - elements.target.offsetHeight * 0.44,
  };
  const control = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
  state.incomingEnd = end;

  addTrajectory(start, control, end, "incoming-trail");
  positionOnCurve(elements.target, start, control, end, 0);

  let frameId;
  let canceled = false;
  let paused = false;
  const startedAt = performance.now();

  const tick = (now) => {
    if (canceled || paused) return;
    const progress = Math.min(1, (now - startedAt) / duration);
    positionOnCurve(elements.target, start, control, end, progress);

    if (progress === 1) {
      state.incomingAnimation = null;
      handleImpact();
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

function positionOnCurve(element, start, control, end, progress) {
  const point = pointOnCurve(start, control, end, progress);
  element.style.left = `${point.x}px`;
  element.style.top = `${point.y}px`;
  element.style.transform = `translate(-50%, -50%) rotate(${(progress - 0.5) * 3}deg)`;
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

    const number = document.createElement("span");
    number.textContent = (index + 1).toString();
    button.append(number, document.createTextNode(word.english));
    button.addEventListener("click", () => fireAnswer(button, word));
    elements.bank.append(button);
  }
}

async function fireAnswer(button, word) {
  if (state.answerLocked) return;

  if (word.english !== state.currentWord.english) {
    state.streak = 0;
    state.score = Math.max(0, state.score - 15);
    button.classList.remove("miss");
    void button.offsetWidth;
    button.classList.add("miss");
    void animateShot(false);
    showMessage("Miss! Try another shell.", "miss");
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
  state.score += 100 + Math.max(0, state.streak - 1) * 20;
  elements.target.classList.add("destroyed");
  showMessage(`Direct hit — ${state.currentWord.phonetic}!`, "hit");
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

  addTrajectory(start, control, end, isHit ? "player-trail" : "miss-trail");

  const shot = document.createElement("span");
  shot.className = "shot";
  shot.setAttribute("aria-hidden", "true");
  elements.arena.append(shot);
  await animateAlongCurve(shot, start, control, end, isHit ? 430 : 520);
  showAirburst(end, isHit);
}

function handleImpact() {
  if (state.answerLocked) return;
  state.answerLocked = true;
  const arenaRect = elements.arena.getBoundingClientRect();
  const impactX = state.incomingEnd?.x ?? arenaRect.width * 0.5;

  if (state.bankStatus === "exposed") {
    state.bankStatus = "hit";
    elements.answerPanel.classList.remove("exposed");
    elements.answerPanel.classList.add("hit");
    showAirburst({ x: impactX, y: arenaRect.height * 0.86 }, false);
    elements.target.classList.add("impact");
    showMessage(
      `Word bank hit! ${state.currentWord.persian} means “${state.currentWord.english}.”`,
      "miss",
    );
    updateScoreboard();
    state.nextRoundTimer = setTimeout(endGame, 750);
    return;
  }

  terrain.explode(
    impactX,
    terrain.getSurfaceY(impactX),
    Math.min(54, arenaRect.width * 0.065),
  );
  state.streak = 0;
  elements.target.classList.add("impact");

  const coverDepth = terrain.getSurfaceY(arenaRect.width * 0.5);
  if (coverDepth >= arenaRect.height * BANK_EXPOSURE_RATIO) {
    state.bankStatus = "exposed";
    elements.answerPanel.classList.add("exposed");
    showMessage("Ground breached — the next missile can hit the word bank!", "miss");
  } else {
    showMessage(
      `Ground hit — ${state.currentWord.persian} means “${state.currentWord.english}.”`,
      "miss",
    );
  }
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
    spawnWord();
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
  const clues = settings.showPhonetic
    ? "pronunciation, Latin spelling, and Persian script"
    : settings.showLatin
      ? "Latin spelling and Persian script"
      : "Persian script only";
  elements.instructions.textContent = `${capitalize(state.difficulty)} mode: ${clues}.`;
  elements.bankCount.textContent = `${settings.bankSize} shells`;
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

async function showDictionaryStatus() {
  try {
    const response = await fetch("./data/dictionary/manifest.json");
    if (!response.ok) throw new Error(`Dictionary manifest returned ${response.status}`);
    const manifest = await response.json();
    elements.dictionaryStatus.textContent = `${manifest.uniqueEnglishHeadwords.toLocaleString()}-word reference dictionary connected.`;
  } catch (error) {
    console.error(error);
    elements.dictionaryStatus.textContent = `${WORDS.length} reviewed lesson words loaded.`;
  }
}

function capitalize(value) {
  return value[0].toUpperCase() + value.slice(1);
}
