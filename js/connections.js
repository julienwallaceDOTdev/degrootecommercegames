(function () {
  "use strict";

  // EDITION CONTENT: Replace these four groups for the next newsletter.
  const PUZZLE = {
    edition: "Sample 01",
    groups: [
      { title: "Financial statement terms", words: ["Asset", "Equity", "Revenue", "Margin"] },
      { title: "Classic marketing funnel", words: ["Awareness", "Interest", "Desire", "Action"] },
      { title: "Leadership qualities", words: ["Vision", "Empathy", "Courage", "Integrity"] },
      { title: "Student club roles", words: ["President", "Treasurer", "Secretary", "Events"] }
    ]
  };

  const grid = document.querySelector("#word-grid");
  const solvedContainer = document.querySelector("#solved-groups");
  const message = document.querySelector("#game-message");
  const submitButton = document.querySelector("#submit");
  const shuffleButton = document.querySelector("#shuffle");
  const copyButton = document.querySelector("#copy-results");
  const mistakesElement = document.querySelector("#mistakes");

  let remainingWords = ClubGames.shuffle(PUZZLE.groups.flatMap((group) => group.words));
  let selected = [];
  let solved = [];
  let mistakes = 0;
  let finished = false;
  const resultRows = [];

  function renderMistakes() {
    const left = 4 - mistakes;
    mistakesElement.innerHTML = "";
    mistakesElement.setAttribute("aria-label", `${left} mistake${left === 1 ? "" : "s"} remaining`);
    for (let index = 0; index < 4; index += 1) {
      const dot = document.createElement("span");
      dot.className = `mistake-dot${index < mistakes ? " used" : ""}`;
      dot.setAttribute("aria-hidden", "true");
      mistakesElement.append(dot);
    }
  }

  function renderGrid() {
    grid.innerHTML = "";
    remainingWords.forEach((word) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "word-tile";
      button.textContent = word;
      button.setAttribute("aria-pressed", String(selected.includes(word)));
      button.disabled = finished;
      button.addEventListener("click", () => toggleWord(word));
      grid.append(button);
    });
    submitButton.disabled = selected.length !== 4 || finished;
    shuffleButton.disabled = finished;
  }

  function toggleWord(word) {
    if (selected.includes(word)) {
      selected = selected.filter((item) => item !== word);
    } else if (selected.length < 4) {
      selected.push(word);
    } else {
      ClubGames.setMessage(message, "You can select only four words at a time.", "error");
    }
    renderGrid();
  }

  function addSolvedGroup(group, index, revealed = false) {
    if (solved.includes(group)) return;
    solved.push(group);
    const panel = document.createElement("article");
    panel.className = `solved-group group-${index}`;
    panel.innerHTML = `<h3>${revealed ? "Revealed: " : ""}${group.title}</h3><p>${group.words.join(" · ")}</p>`;
    solvedContainer.append(panel);
    remainingWords = remainingWords.filter((word) => !group.words.includes(word));
  }

  function finish(won) {
    finished = true;
    if (!won) {
      PUZZLE.groups.forEach((group, index) => addSolvedGroup(group, index, true));
      ClubGames.setMessage(message, "No mistakes left — the remaining groups are revealed above.", "error");
    } else {
      ClubGames.setMessage(message, "Excellent work — all four bundles are complete!", "success");
    }
    copyButton.disabled = false;
    grid.hidden = true;
    renderGrid();
  }

  function submitSelection() {
    const matchIndex = PUZZLE.groups.findIndex((group) =>
      group.words.every((word) => selected.includes(word)) && !solved.includes(group));

    if (matchIndex >= 0) {
      resultRows.push("🟦".repeat(Math.max(1, mistakes + 1)));
      addSolvedGroup(PUZZLE.groups[matchIndex], matchIndex);
      selected = [];
      ClubGames.setMessage(message, `Correct: ${PUZZLE.groups[matchIndex].title}.`, "success");
      if (solved.length === PUZZLE.groups.length) finish(true);
    } else {
      mistakes += 1;
      resultRows.push("⬜⬜⬜⬜");
      const oneAway = PUZZLE.groups.some((group) =>
        group.words.filter((word) => selected.includes(word)).length === 3 && !solved.includes(group));
      ClubGames.setMessage(message, oneAway ? "Not quite — one word is out of place." : "Those four do not form a group. Try again.", "error");
      if (mistakes >= 4) finish(false);
    }
    renderMistakes();
    renderGrid();
  }

  shuffleButton.addEventListener("click", () => {
    remainingWords = ClubGames.shuffle(remainingWords);
    selected = [];
    renderGrid();
    ClubGames.setMessage(message, "Words shuffled. Select a new group of four.");
  });
  submitButton.addEventListener("click", submitSelection);
  copyButton.addEventListener("click", () => {
    const score = finished && solved.length === 4 ? `${mistakes} mistake${mistakes === 1 ? "" : "s"}` : "not completed";
    ClubGames.copyText(`Boardroom Bundles — ${PUZZLE.edition}\n${score}\n${resultRows.join("\n")}\nDeGroote Commerce Society`, copyButton);
  });

  renderMistakes();
  renderGrid();
}());
