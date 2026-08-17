import "./style.css";
import { WORDS } from "./data/words.js";
import { DIFFICULTIES, buildWordBank, pickNextWord } from "./game.js";

const elements = {
  arena: document.querySelector("[data-arena]"),
  bank: document.querySelector("[data-word-bank]"),
  bankCount: document.querySelector("[data-bank-count]"),
  best: document.querySelector("[data-best]"),
  cannon: document.querySelector("[data-cannon]"),
  difficulty: document.querySelector("[data-difficulty]"),
  dictionaryStatus: document.querySelector("[data-dictionary-status]"),
  english: document.querySelector("[data-english]"),
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
};

const state = {
  answerLocked: false,
  currentWord: null,
  difficulty: "beginner",
  fallAnimation: null,
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

startGame();
showDictionaryStatus();

function startGame() {
  state.gameId += 1;
  clearTimeout(state.nextRoundTimer);
  state.nextRoundTimer = null;
  cancelFall();
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
  elements.english.textContent = state.currentWord.english;
  elements.persian.textContent = state.currentWord.persian;
  elements.phonetic.hidden = !settings.showPhonetic;
  elements.english.hidden = !settings.showEnglish;
  elements.message.textContent = "";
  renderBank(bank);

  const safeMargin = Math.max(88, elements.target.offsetWidth / 2 + 12);
  const horizontalRange = Math.max(0, elements.arena.clientWidth - safeMargin * 2);
  elements.target.style.left = `${safeMargin + Math.random() * horizontalRange}px`;

  const endTop = Math.max(180, elements.arena.clientHeight - 178);
  state.fallAnimation = elements.target.animate(
    [
      { transform: "translate(-50%, -120px) rotate(-1deg)" },
      { transform: `translate(-50%, ${endTop}px) rotate(1deg)` },
    ],
    {
      duration: settings.fallDuration,
      easing: "linear",
      fill: "forwards",
    },
  );
  state.fallAnimation.onfinish = handleImpact;
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
    showMessage("Miss! Try another shell.", "miss");
    updateScoreboard();
    return;
  }

  state.answerLocked = true;
  const gameId = state.gameId;
  setBankDisabled(true);
  state.fallAnimation?.pause();
  await animateShot();
  if (gameId !== state.gameId) return;

  state.fallAnimation?.cancel();
  state.streak += 1;
  state.score += 100 + Math.max(0, state.streak - 1) * 20;
  elements.target.classList.add("destroyed");
  showMessage(`Direct hit — ${state.currentWord.phonetic}!`, "hit");
  updateScoreboard();
  scheduleNextRound(650);
}

function animateShot() {
  const arenaRect = elements.arena.getBoundingClientRect();
  const cannonRect = elements.cannon.getBoundingClientRect();
  const targetRect = elements.target.getBoundingClientRect();
  const shot = document.createElement("span");
  shot.className = "shot";
  shot.setAttribute("aria-hidden", "true");
  elements.arena.append(shot);

  const startX = cannonRect.left + cannonRect.width / 2 - arenaRect.left;
  const startY = cannonRect.top - arenaRect.top;
  const targetX = targetRect.left + targetRect.width / 2 - arenaRect.left;
  const targetY = targetRect.top + targetRect.height / 2 - arenaRect.top;
  shot.style.left = `${startX}px`;
  shot.style.top = `${startY}px`;

  const animation = shot.animate(
    [
      { transform: "translate(-50%, -50%) scale(0.7)", opacity: 1 },
      {
        transform: `translate(${targetX - startX - 4}px, ${targetY - startY - 4}px) scale(1.35)`,
        opacity: 1,
      },
    ],
    { duration: 360, easing: "cubic-bezier(.3,.8,.4,1)" },
  );
  return animation.finished.finally(() => shot.remove());
}

function handleImpact() {
  if (state.answerLocked) return;
  state.answerLocked = true;
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
  cancelFall();
  setBankDisabled(true);
  elements.finalScore.textContent = state.score.toLocaleString();
  elements.overlay.hidden = false;
}

function cancelFall() {
  if (state.fallAnimation) {
    state.fallAnimation.onfinish = null;
    state.fallAnimation.cancel();
    state.fallAnimation = null;
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
    ? "phonetic, English, and Persian clues"
    : settings.showEnglish
      ? "English and Persian clues"
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
