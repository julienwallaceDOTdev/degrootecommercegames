(function () {
  "use strict";

  // EDITION CONTENT: Change ANSWER and add any permitted guesses to ACCEPTED_WORDS.
  const ANSWER = "PITCH";
  const ACCEPTED_WORDS = new Set([
    "ADMIT", "AGENT", "AGILE", "ALIGN", "ALLOW", "APPLY", "AUDIT", "AWARE",
    "BOARD", "BONUS", "BRAIN", "BRAND", "BRIEF", "BUILD", "BUYER", "CAUSE",
    "CHART", "CLAIM", "CLERK", "CLICK", "CLOSE", "COACH", "COUNT", "COURT",
    "CYCLE", "DAILY", "DEALS", "DEBIT", "DELTA", "DRIVE", "EARLY", "EQUIP",
    "EVENT", "FIELD", "FINAL", "FIRST", "FOCUS", "FORUM", "FOUND", "FUNDS",
    "GOALS", "GRANT", "GROUP", "GUIDE", "HABIT", "IDEAS", "IMAGE",
    "INPUT", "ISSUE", "LABOR", "LEADS", "LEARN", "LEGAL", "LEVEL", "LIMIT",
    "LOANS", "LOGIC", "MAKER", "MEDIA", "MERGE", "MODEL", "MONEY",
    "NEEDS", "OFFER", "ORDER", "OWNER", "PANEL", "PAPER", "PITCH", "PLANS",
    "PRICE", "PRIME", "PROOF", "RALLY", "RATIO", "REACH", "RISKS",
    "ROUND", "SCALE", "SCORE", "SHARE", "SHIFT", "SKILL", "SPEND", "STAGE",
    "STOCK", "STORE", "STUDY", "SURGE", "TEAMS", "TERMS", "TRADE", "TREND",
    "TRUST", "VALUE", "VOICE", "WAGES", "WRITE", "YIELD"
  ]);

  const MAX_ATTEMPTS = 6;
  const grid = document.querySelector("#guess-grid");
  const keyboard = document.querySelector("#keyboard");
  const message = document.querySelector("#game-message");
  const counter = document.querySelector("#attempt-counter");
  const copyButton = document.querySelector("#copy-results");
  const guesses = [];
  let currentGuess = "";
  let finished = false;

  function buildGrid() {
    grid.innerHTML = "";
    for (let row = 0; row < MAX_ATTEMPTS; row += 1) {
      const rowElement = document.createElement("div");
      rowElement.className = "guess-row";
      rowElement.setAttribute("role", "group");
      rowElement.setAttribute("aria-label", `Guess ${row + 1}`);
      for (let column = 0; column < 5; column += 1) {
        const tile = document.createElement("div");
        tile.className = "letter-tile";
        tile.id = `tile-${row}-${column}`;
        rowElement.append(tile);
      }
      grid.append(rowElement);
    }
  }

  function buildKeyboard() {
    ["QWERTYUIOP", "ASDFGHJKL", "↵ZXCVBNM⌫"].forEach((letters) => {
      const row = document.createElement("div");
      row.className = "keyboard-row";
      [...letters].forEach((letter) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `key${letter === "↵" || letter === "⌫" ? " wide" : ""}`;
        button.textContent = letter === "↵" ? "Enter" : letter === "⌫" ? "Delete" : letter;
        button.dataset.key = letter === "↵" ? "ENTER" : letter === "⌫" ? "BACKSPACE" : letter;
        button.setAttribute("aria-label", button.textContent);
        button.addEventListener("click", () => handleKey(button.dataset.key));
        row.append(button);
      });
      keyboard.append(row);
    });
  }

  function getEvaluation(guess) {
    const result = Array(5).fill("absent");
    const remaining = ANSWER.split("");
    [...guess].forEach((letter, index) => {
      if (letter === ANSWER[index]) {
        result[index] = "correct";
        remaining[index] = null;
      }
    });
    [...guess].forEach((letter, index) => {
      if (result[index] === "correct") return;
      const match = remaining.indexOf(letter);
      if (match >= 0) {
        result[index] = "present";
        remaining[match] = null;
      }
    });
    return result;
  }

  function updateCurrentRow() {
    const row = guesses.length;
    for (let column = 0; column < 5; column += 1) {
      const tile = document.querySelector(`#tile-${row}-${column}`);
      tile.textContent = currentGuess[column] || "";
      tile.className = `letter-tile${currentGuess[column] ? " filled" : ""}`;
      tile.setAttribute("aria-label", currentGuess[column] || "empty");
    }
  }

  function updateKey(letter, state) {
    const key = keyboard.querySelector(`[data-key="${letter}"]`);
    if (!key) return;
    const rank = { absent: 1, present: 2, correct: 3 };
    const prior = [...key.classList].find((name) => rank[name]);
    if (!prior || rank[state] > rank[prior]) {
      key.classList.remove("absent", "present", "correct");
      key.classList.add(state);
      key.setAttribute("aria-label", `${letter}, ${state === "correct" ? "right place" : state === "present" ? "wrong place" : "not in word"}`);
    }
  }

  function submitGuess() {
    if (currentGuess.length !== 5) {
      ClubGames.setMessage(message, `Enter ${5 - currentGuess.length} more letter${currentGuess.length === 4 ? "" : "s"}.`, "error");
      return;
    }
    if (!ACCEPTED_WORDS.has(currentGuess)) {
      ClubGames.setMessage(message, "That word is not in this edition’s accepted list.", "error");
      return;
    }

    const evaluation = getEvaluation(currentGuess);
    const row = guesses.length;
    evaluation.forEach((state, column) => {
      const tile = document.querySelector(`#tile-${row}-${column}`);
      tile.className = `letter-tile ${state}`;
      tile.setAttribute("aria-label", `${currentGuess[column]}, ${state === "correct" ? "right place" : state === "present" ? "wrong place" : "not in word"}`);
      updateKey(currentGuess[column], state);
    });
    guesses.push({ word: currentGuess, evaluation });

    if (currentGuess === ANSWER) {
      finished = true;
      ClubGames.setMessage(message, `Sharp thinking — solved in ${guesses.length}!`, "success");
    } else if (guesses.length === MAX_ATTEMPTS) {
      finished = true;
      ClubGames.setMessage(message, `The answer was ${ANSWER}. Better luck next edition!`, "error");
    } else {
      currentGuess = "";
      counter.textContent = `Attempt ${guesses.length + 1} of ${MAX_ATTEMPTS}`;
      ClubGames.setMessage(message, "Keep going — use the clues from your last guess.");
    }
    if (finished) {
      counter.textContent = `${guesses.length} of ${MAX_ATTEMPTS} attempts used`;
      copyButton.disabled = false;
      keyboard.querySelectorAll("button").forEach((button) => { button.disabled = true; });
    }
  }

  function handleKey(key) {
    if (finished) return;
    if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
      currentGuess += key;
      updateCurrentRow();
    } else if (key === "BACKSPACE") {
      currentGuess = currentGuess.slice(0, -1);
      updateCurrentRow();
    } else if (key === "ENTER") {
      submitGuess();
    }
  }

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toUpperCase();
    if (/^[A-Z]$/.test(key) || key === "ENTER" || key === "BACKSPACE") {
      event.preventDefault();
      handleKey(key);
    }
  });
  copyButton.addEventListener("click", () => {
    const rows = guesses.map(({ evaluation }) => evaluation.map((state) =>
      state === "correct" ? "🟩" : state === "present" ? "🟨" : "⬛").join(""));
    const score = guesses.at(-1)?.word === ANSWER ? `${guesses.length}/${MAX_ATTEMPTS}` : `X/${MAX_ATTEMPTS}`;
    ClubGames.copyText(`Five by Five — Sample 01 ${score}\n${rows.join("\n")}\nDeGroote Commerce Society`, copyButton);
  });

  buildGrid();
  buildKeyboard();
  updateCurrentRow();
}());
