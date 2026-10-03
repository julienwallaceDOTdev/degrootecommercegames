# DeGroote Commerce Society Games

A dependency-free collection of three short, business-school-themed browser games for an email newsletter:

- **Boardroom Bundles** (`connections.html`) — group 16 terms into four categories.
- **Five by Five** (`word-game.html`) — find a five-letter business term in six attempts.
- **The Morning Brief** (`crossword.html`) — complete a small interactive crossword.

The project is a static site. It uses only HTML, CSS, and client-side JavaScript; it has no server-side functionality, accounts, database, build process, tracking, or external APIs.

## Preview locally

The pages can be opened directly from the filesystem, but a local web server most closely matches production:

```sh
python3 -m http.server 8000
```

Then visit <http://localhost:8000/connections.html>. Use the shared header to open the other games. Any simple static server works.

Run the dependency-free content and navigation checks with:

```sh
node tests/smoke-test.mjs
```

## Update the puzzle content

Puzzle content is deliberately kept near the top of each game script under an `EDITION CONTENT` comment:

- `js/connections.js`: edit the `PUZZLE.groups` array. Keep four groups with exactly four distinct words each.
- `js/word-game.js`: change `ANSWER` and update `ACCEPTED_WORDS`. The answer must be five letters and must appear in the accepted set.
- `js/crossword.js`: edit `PUZZLE.entries`. Each entry has an answer, zero-based starting row/column, direction, and clue. Crossing letters must agree. Increase `PUZZLE.size` if the new grid needs more room.

To create the next newsletter edition:

1. Replace the content in all three puzzle objects and update each `edition` label used in shared results.
2. Keep answers uppercase in the word game and crossword; connection words may use display capitalization.
3. Preview every page on both a desktop-width and phone-width browser.
4. Complete each puzzle once, intentionally try an incorrect choice, and test each Copy results button.
5. Commit the changed puzzle scripts to the newsletter edition branch or repository.

The DeGroote Commerce Society logo is stored in `dcslogo1.png` and used by every page header. Shared club colours and layout are in `css/styles.css`; shared shuffle, feedback, and clipboard helpers are in `js/shared.js`.

## Cloudflare Workers static assets

Point a Cloudflare Worker static-assets configuration at the repository root (or copy these files into the configured asset directory). No Worker code or backend route is needed for the games themselves.

After deployment, public URLs will follow this pattern, using the hostname assigned to the Worker:

```text
https://your-worker.your-subdomain.workers.dev/connections.html
https://your-worker.your-subdomain.workers.dev/word-game.html
https://your-worker.your-subdomain.workers.dev/crossword.html
```

A custom domain uses the same page paths. Link those full URLs from the email newsletter so each game opens directly in a new browser tab.

## Files

```text
connections.html       Category-matching page
word-game.html         Five-letter guessing page
crossword.html         Mini-crossword page
css/styles.css         Shared responsive visual system
js/shared.js           Shared shuffle, clipboard, and message utilities
js/connections.js      Category puzzle content and game logic
js/word-game.js        Five-letter answer/list and game logic
js/crossword.js        Crossword entries/clues and game logic
```

The repository is licensed under the included MIT license.
