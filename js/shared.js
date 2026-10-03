(function () {
  "use strict";

  window.ClubGames = {
    shuffle(items) {
      const copy = [...items];
      for (let index = copy.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
      }
      return copy;
    },

    async copyText(text, button) {
      try {
        await navigator.clipboard.writeText(text);
        const original = button.textContent;
        button.textContent = "Copied!";
        window.setTimeout(() => { button.textContent = original; }, 1800);
      } catch (error) {
        window.prompt("Copy your results:", text);
      }
    },

    setMessage(element, text, type = "") {
      element.textContent = text;
      element.className = `game-message${type ? ` is-${type}` : ""}`;
    }
  };
}());
