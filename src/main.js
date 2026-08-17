import "./style.css";
import { WORDS } from "./data/words.js";
import { DIFFICULTIES, buildWordBank, pickNextWord } from "./game.js";
import { setupTerrain } from "./terrain.js";

const elements = {
  arena: document.querySelector("[data-arena]"),
  bank: document.querySelector("[data-word-bank]"),
  bankCount: document.querySelector("[data-bank-count]"),
  best: document.querySelector("[data-best]"),
  cannon: document.querySelector("[data-cannon]"),
  difficulty: document.querySelector("[data-difficulty]"),
  dictionaryStatus: document.querySelector("[data-dictionary-status]"),
  finalScore: document.querySelector("[data-final-score]"),
  instructions: document.querySelector("[data-instructions]"),
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
  currentWord: null,
  difficulty: "beginner",
  incomingAnimation: null,
  incomingProgress: 0,
  gameId: 0,
  lives: 3,
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
import("./scene.js")
  .then(({ setupArtilleryScene }) => setupArtilleryScene(elements.arena))
  .catch((error) => {
    console.error("Could not load the 3D artillery scene.", error);
  });

function startGame() {
  state.gameId += 1;
  clearTimeout(state.nextRoundTimer);
  state.nextRoundTimer = null;
  cancelIncoming();
  elements.trajectories.replaceChildren();
  terrain.reset();
  state.answerLocked = false;
  state.currentWord = null;
  state.lives = 3;
  state.score = 0;
  state.streak = 0;
  elements.overlay.hidden = true;
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
  elements.persian.textContent = state.currentWord.persian;
  elements.phonetic.hidden = !settings.showPhonetic;
  elements.message.textContent = "";
  renderBank(bank);

  startIncomingFlight(settings.fallDuration);
}

function startIncomingFlight(duration) {
  cancelIncoming();
  state.incomingProgress = 0;
  const width = elements.arena.clientWidth;
  const height = elements.arena.clientHeight;
  const start = { x: width * 0.84, y: height * 0.27 };
  const control = {
    x: width * (0.5 + (Math.random() - 0.5) * 0.12),
    y: height * (0.04 + Math.random() * 0.07),
  };
  const endX = width * 0.17;
  const end = {
    x: endX,
    y: terrain.getSurfaceY(endX) - elements.target.offsetHeight * 0.46,
  };

  addTrajectory(start, control, end, "incoming-trail");
  positionOnCurve(elements.target, start, control, end, 0);

  let frameId;
  let canceled = false;
  let paused = false;
  const startedAt = performance.now();

  const tick = (now) => {
    if (canceled || paused) return;
    const progress = Math.min(1, (now - startedAt) / duration);
    state.incomingProgress = progress;
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
  const cannonRect = elements.cannon.getBoundingClientRect();
  const targetRect = elements.target.getBoundingClientRect();
  const start = {
    x: cannonRect.left + cannonRect.width / 2 - arenaRect.left,
    y: cannonRect.top - arenaRect.top,
  };
  const missX = arenaRect.width * (0.5 + Math.random() * 0.38);
  const end = isHit
    ? {
        x: targetRect.left + targetRect.width / 2 - arenaRect.left,
        y: targetRect.top + targetRect.height / 2 - arenaRect.top,
      }
    : { x: missX, y: terrain.getSurfaceY(missX) - 3 };
  const control = {
    x: (start.x + end.x) / 2,
    y: Math.max(22, Math.min(start.y, end.y) - arenaRect.height * 0.28),
  };

  addTrajectory(start, control, end, isHit ? "player-trail" : "miss-trail");
  elements.cannon.classList.remove("recoil");
  void elements.cannon.offsetWidth;
  elements.cannon.classList.add("recoil");

  const shot = document.createElement("span");
  shot.className = "shot";
  shot.setAttribute("aria-hidden", "true");
  elements.arena.append(shot);
  await animateAlongCurve(shot, start, control, end, isHit ? 540 : 700);
  if (!isHit) terrain.explode(end.x, end.y, Math.min(38, arenaRect.width * 0.048));
}

function handleImpact() {
  if (state.answerLocked) return;
  state.answerLocked = true;
  const arenaRect = elements.arena.getBoundingClientRect();
  const targetRect = elements.target.getBoundingClientRect();
  const impactX = targetRect.left + targetRect.width / 2 - arenaRect.left;
  terrain.explode(
    impactX,
    terrain.getSurfaceY(impactX),
    Math.min(54, arenaRect.width * 0.065),
  );
  state.lives -= 1;
  state.streak = 0;
  elements.target.classList.add("impact");
  showMessage(`Impact! ${state.currentWord.persian} means “${state.currentWord.english}.”`, "miss");
  updateScoreboard();

  if (state.lives === 0) {
    state.nextRoundTimer = setTimeout(endGame, 750);
  } else {
    scheduleNextRound(950);
  }
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
  elements.lives.textContent = ["♥", "♥", "♥"]
    .map((heart, index) => (index < state.lives ? heart : "♡"))
    .join(" ");
  elements.lives.setAttribute("aria-label", `${state.lives} lives`);

  const previousBest = Number.parseInt(elements.best.textContent.replaceAll(",", ""), 10);
  if (state.score > previousBest) {
    elements.best.textContent = state.score.toLocaleString();
    localStorage.setItem("wordfall-best", state.score.toString());
  }
}

function updateDifficultyCopy() {
  const settings = DIFFICULTIES[state.difficulty];
  const clues = settings.showPhonetic
    ? "phonetic and Persian clues"
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
