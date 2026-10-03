import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const pages = ["index.html", "connections.html", "word-game.html", "crossword.html"];

// Every public page links to every game and loads its declared local assets.
for (const page of pages) {
  const html = read(page);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${page} has unique element IDs`);
  for (const reference of [...html.matchAll(/aria-labelledby="([^"]+)"/g)].map((match) => match[1])) {
    assert.ok(ids.includes(reference), `${page} aria-labelledby target exists: ${reference}`);
  }
  for (const destination of pages) {
    assert.match(html, new RegExp(`href="${destination}"`), `${page} links to ${destination}`);
  }
  for (const asset of [...html.matchAll(/(?:href|src)="((?:(?:css|js|assets)\/)[^"]+)"/g)].map((match) => match[1])) {
    assert.doesNotThrow(() => read(asset), `${page} asset exists: ${asset}`);
  }
}

// Category puzzle has four complete, distinct groups and can be solved group by group.
const connectionsSource = read("js/connections.js");
const groupMatches = [...connectionsSource.matchAll(/\{ title: "([^"]+)", words: \[([^\]]+)\] \}/g)];
assert.equal(groupMatches.length, 4, "connections has four groups");
const connectionWords = groupMatches.flatMap((match) => [...match[2].matchAll(/"([^"]+)"/g)].map((word) => word[1]));
assert.equal(connectionWords.length, 16, "connections has sixteen words");
assert.equal(new Set(connectionWords).size, 16, "connection words are unique");
for (const group of groupMatches) {
  assert.equal([...group[2].matchAll(/"([^"]+)"/g)].length, 4, `${group[1]} has four words`);
}

// Five-letter answer is valid and accepted, which exercises the winning submission path.
const wordSource = read("js/word-game.js");
const answer = wordSource.match(/const ANSWER = "([A-Z]+)";/)?.[1];
assert.equal(answer?.length, 5, "word answer has five letters");
const acceptedBlock = wordSource.match(/const ACCEPTED_WORDS = new Set\(\[([\s\S]*?)\]\);/)?.[1] ?? "";
const accepted = [...acceptedBlock.matchAll(/"([A-Z]+)"/g)].map((match) => match[1]);
assert.ok(accepted.includes(answer), "word answer is accepted");
assert.ok(accepted.every((word) => word.length === 5), "all accepted guesses have five letters");

// Crossword entries stay in bounds, agree at crossings, and form one connected puzzle.
const crosswordSource = read("js/crossword.js");
const size = Number(crosswordSource.match(/size: (\d+)/)?.[1]);
const entryPattern = /\{ answer: "([A-Z]+)", row: (\d+), col: (\d+), direction: "(across|down)", clue: "([^"]+)" \}/g;
const entries = [...crosswordSource.matchAll(entryPattern)].map((match) => ({
  answer: match[1], row: Number(match[2]), col: Number(match[3]), direction: match[4], clue: match[5]
}));
assert.ok(entries.length >= 6, "crossword has at least six entries");
const cells = new Map();
const neighbours = entries.map(() => new Set());
entries.forEach((entry, entryIndex) => {
  [...entry.answer].forEach((letter, offset) => {
    const row = entry.row + (entry.direction === "down" ? offset : 0);
    const col = entry.col + (entry.direction === "across" ? offset : 0);
    assert.ok(row < size && col < size, `${entry.answer} stays in bounds`);
    const cellKey = `${row}-${col}`;
    const prior = cells.get(cellKey);
    if (prior) {
      assert.equal(prior.letter, letter, `crossing agrees at ${cellKey}`);
      neighbours[entryIndex].add(prior.entryIndex);
      neighbours[prior.entryIndex].add(entryIndex);
    } else {
      cells.set(cellKey, { letter, entryIndex });
    }
  });
});
const visited = new Set([0]);
const queue = [0];
while (queue.length) {
  for (const next of neighbours[queue.shift()]) {
    if (!visited.has(next)) { visited.add(next); queue.push(next); }
  }
}
assert.equal(visited.size, entries.length, "all crossword answers connect");
assert.ok([...cells.values()].every(({ letter }) => /^[A-Z]$/.test(letter)), "crossword solution fills every playable square");

console.log(`Smoke tests passed: ${pages.length} pages, 16 connection words, answer ${answer}, ${entries.length} crossword entries.`);
