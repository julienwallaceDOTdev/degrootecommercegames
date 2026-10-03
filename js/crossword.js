(function () {
  "use strict";

  // EDITION CONTENT: Each answer is placed from its starting row/column.
  // Rows and columns are zero-based; answers must agree wherever they cross.
  const PUZZLE = {
    edition: "Sample 01",
    size: 7,
    entries: [
      { answer: "MARKET", row: 0, col: 0, direction: "across", clue: "Where buyers and sellers meet" },
      { answer: "SCALE", row: 2, col: 1, direction: "across", clue: "Grow a venture efficiently" },
      { answer: "MODEL", row: 5, col: 2, direction: "across", clue: "Framework for how a company creates value" },
      { answer: "MARGIN", row: 0, col: 0, direction: "down", clue: "Difference between revenue and cost" },
      { answer: "ASSET", row: 0, col: 1, direction: "down", clue: "Resource with economic value" },
      { answer: "LEADS", row: 2, col: 4, direction: "down", clue: "Potential customers for a sales team" }
    ]
  };

  const gridElement = document.querySelector("#crossword-grid");
  const acrossList = document.querySelector("#across-clues");
  const downList = document.querySelector("#down-clues");
  const activeClueElement = document.querySelector("#active-clue");
  const message = document.querySelector("#game-message");
  const checkButton = document.querySelector("#check");
  const revealButton = document.querySelector("#reveal");
  const copyButton = document.querySelector("#copy-results");
  const cells = new Map();
  const entryById = new Map();
  let activeCell = null;
  let activeDirection = "across";
  let finished = false;
  let revealed = false;

  function key(row, col) { return `${row}-${col}`; }

  PUZZLE.entries.forEach((entry, entryIndex) => {
    entry.id = `${entry.direction}-${entryIndex}`;
    entry.cells = [];
    entryById.set(entry.id, entry);
    [...entry.answer].forEach((letter, offset) => {
      const row = entry.row + (entry.direction === "down" ? offset : 0);
      const col = entry.col + (entry.direction === "across" ? offset : 0);
      const cellKey = key(row, col);
      if (!cells.has(cellKey)) cells.set(cellKey, { row, col, answer: letter, value: "", entries: [] });
      const cell = cells.get(cellKey);
      if (cell.answer !== letter) throw new Error(`Crossword conflict at ${cellKey}`);
      cell.entries.push(entry.id);
      entry.cells.push(cellKey);
    });
  });

  const starts = [...new Set(PUZZLE.entries.map((entry) => key(entry.row, entry.col)))].sort((a, b) => {
    const [ar, ac] = a.split("-").map(Number);
    const [br, bc] = b.split("-").map(Number);
    return ar - br || ac - bc;
  });
  starts.forEach((cellKey, index) => {
    cells.get(cellKey).number = index + 1;
  });
  PUZZLE.entries.forEach((entry) => { entry.number = cells.get(key(entry.row, entry.col)).number; });

  function renderGrid() {
    gridElement.innerHTML = "";
    for (let row = 0; row < PUZZLE.size; row += 1) {
      for (let col = 0; col < PUZZLE.size; col += 1) {
        const cell = cells.get(key(row, col));
        if (!cell) {
          const block = document.createElement("div");
          block.className = "crossword-cell block";
          block.setAttribute("role", "gridcell");
          block.setAttribute("aria-label", "blocked square");
          gridElement.append(block);
          continue;
        }
        const button = document.createElement("button");
        button.type = "button";
        button.className = "crossword-cell";
        button.dataset.cell = key(row, col);
        button.setAttribute("role", "gridcell");
        button.setAttribute("aria-label", `row ${row + 1}, column ${col + 1}${cell.value ? `, ${cell.value}` : ", empty"}`);
        if (cell.number) {
          const number = document.createElement("span");
          number.className = "cell-number";
          number.textContent = cell.number;
          number.setAttribute("aria-hidden", "true");
          button.append(number);
        }
        const letter = document.createElement("span");
        letter.textContent = cell.value;
        letter.setAttribute("aria-hidden", "true");
        button.append(letter);
        button.addEventListener("click", () => selectCell(cell, true));
        gridElement.append(button);
        cell.element = button;
      }
    }
  }

  function renderClues() {
    [acrossList, downList].forEach((list) => { list.innerHTML = ""; });
    PUZZLE.entries.forEach((entry) => {
      const item = document.createElement("li");
      item.value = entry.number;
      item.textContent = entry.clue;
      item.dataset.entry = entry.id;
      item.tabIndex = 0;
      item.addEventListener("click", () => selectEntry(entry));
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectEntry(entry); }
      });
      (entry.direction === "across" ? acrossList : downList).append(item);
      entry.clueElement = item;
    });
  }

  function activeEntry() {
    if (!activeCell) return null;
    const id = activeCell.entries.find((entryId) => entryById.get(entryId).direction === activeDirection) || activeCell.entries[0];
    return entryById.get(id);
  }

  function refreshHighlights() {
    document.querySelectorAll(".crossword-cell.in-word, .crossword-cell.active").forEach((element) => element.classList.remove("in-word", "active"));
    document.querySelectorAll(".clue-list li.active").forEach((element) => element.classList.remove("active"));
    const entry = activeEntry();
    if (!entry) return;
    entry.cells.forEach((cellKey) => cells.get(cellKey).element.classList.add("in-word"));
    activeCell.element.classList.add("active");
    entry.clueElement.classList.add("active");
    activeClueElement.textContent = `${entry.number} ${entry.direction === "across" ? "Across" : "Down"}: ${entry.clue}`;
  }

  function selectCell(cell, toggle = false) {
    if (toggle && activeCell === cell && cell.entries.length > 1) {
      activeDirection = activeDirection === "across" ? "down" : "across";
    } else {
      activeCell = cell;
      if (!cell.entries.some((id) => entryById.get(id).direction === activeDirection)) {
        activeDirection = entryById.get(cell.entries[0]).direction;
      }
    }
    refreshHighlights();
    cell.element.focus();
  }

  function selectEntry(entry) {
    activeDirection = entry.direction;
    selectCell(cells.get(entry.cells[0]));
  }

  function moveWithinEntry(delta) {
    const entry = activeEntry();
    if (!entry) return;
    const index = entry.cells.indexOf(key(activeCell.row, activeCell.col));
    const nextKey = entry.cells[index + delta];
    if (nextKey) selectCell(cells.get(nextKey));
  }

  function moveByArrow(keyName) {
    if (!activeCell) return;
    const delta = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[keyName];
    activeDirection = delta[0] ? "down" : "across";
    let row = activeCell.row + delta[0];
    let col = activeCell.col + delta[1];
    while (row >= 0 && row < PUZZLE.size && col >= 0 && col < PUZZLE.size) {
      const next = cells.get(key(row, col));
      if (next) { selectCell(next); return; }
      row += delta[0];
      col += delta[1];
    }
    refreshHighlights();
  }

  function setLetter(letter) {
    if (!activeCell || finished) return;
    activeCell.value = letter;
    activeCell.element.querySelector("span:last-child").textContent = letter;
    activeCell.element.setAttribute("aria-label", `row ${activeCell.row + 1}, column ${activeCell.col + 1}, ${letter}`);
    activeCell.element.classList.remove("incorrect");
    moveWithinEntry(1);
    if ([...cells.values()].every((cell) => cell.value === cell.answer)) complete(false);
  }

  function eraseLetter() {
    if (!activeCell || finished) return;
    if (!activeCell.value) moveWithinEntry(-1);
    if (!activeCell) return;
    activeCell.value = "";
    activeCell.element.querySelector("span:last-child").textContent = "";
    activeCell.element.setAttribute("aria-label", `row ${activeCell.row + 1}, column ${activeCell.col + 1}, empty`);
    activeCell.element.classList.remove("incorrect");
  }

  function complete(wasRevealed) {
    finished = true;
    revealed = wasRevealed;
    copyButton.disabled = false;
    checkButton.disabled = true;
    revealButton.disabled = true;
    ClubGames.setMessage(message, wasRevealed ? "Puzzle revealed. Review the completed grid above." : "Brief complete — every answer is correct!", wasRevealed ? "" : "success");
  }

  function checkPuzzle() {
    const filled = [...cells.values()].filter((cell) => cell.value);
    if (!filled.length) {
      ClubGames.setMessage(message, "Add a few letters before checking.", "error");
      return;
    }
    let errors = 0;
    filled.forEach((cell) => {
      const incorrect = cell.value !== cell.answer;
      cell.element.classList.toggle("incorrect", incorrect);
      errors += Number(incorrect);
    });
    if (errors) ClubGames.setMessage(message, `${errors} incorrect letter${errors === 1 ? "" : "s"} marked in red.`, "error");
    else if (filled.length < cells.size) ClubGames.setMessage(message, "Everything entered so far is correct.", "success");
    else complete(false);
  }

  gridElement.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || finished) return;
    if (/^[a-zA-Z]$/.test(event.key)) { event.preventDefault(); setLetter(event.key.toUpperCase()); }
    else if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      eraseLetter();
    } else if (event.key.startsWith("Arrow")) { event.preventDefault(); moveByArrow(event.key); }
    else if (event.key === " ") { event.preventDefault(); selectCell(activeCell, true); }
  });

  checkButton.addEventListener("click", checkPuzzle);
  revealButton.addEventListener("click", () => {
    if (!window.confirm("Reveal every answer? This will end the puzzle.")) return;
    cells.forEach((cell) => {
      cell.value = cell.answer;
      cell.element.querySelector("span:last-child").textContent = cell.answer;
      cell.element.classList.add("revealed");
      cell.element.classList.remove("incorrect");
    });
    complete(true);
  });
  copyButton.addEventListener("click", () => {
    const filledCount = [...cells.values()].filter((cell) => cell.value === cell.answer).length;
    const status = revealed ? "revealed" : finished ? "completed" : `${filledCount}/${cells.size} letters`;
    ClubGames.copyText(`The Morning Brief — ${PUZZLE.edition}\n${status} ☕📈\nDeGroote Commerce Society`, copyButton);
  });

  renderGrid();
  renderClues();
  selectCell(cells.get(PUZZLE.entries[0].cells[0]));
}());
