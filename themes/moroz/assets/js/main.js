document.querySelectorAll(".gist[data-code]").forEach((gist) => {
  const button = document.createElement("button");
  button.setAttribute("type", "button");
  button.setAttribute("title", "Copy to clipboard");
  button.className = "button copy-to-clipboard";

  button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><use href="/icons/copy.svg" /></svg><span>Copy</span><span class="success">Copied!</span>`;

  const lines = gist.dataset.code?.split("\n");
  if (lines.length < 4) {
    button.classList.add("is-centered");
  }

  button.addEventListener("click", () => {
    let lines = gist.dataset.code?.split("\n");
    if (!lines) return;

    const isShell =
      gist.querySelector(
        "code.language-shell, code.language-plain, code.language-text, code.language-json",
      ) !== null;
    const hasDollar = lines.some((line) => line?.startsWith("$"));

    if (isShell && hasDollar) {
      lines = lines
        .filter((line) => line?.startsWith("$"))
        .map((line) => line.replace("$ ", ""))
        .filter(Boolean);
    }

    navigator.clipboard.writeText(lines.join("\n").trim());

    button.classList.add("is-success");

    setTimeout(() => {
      button.classList.remove("is-success");
    }, 5000);
  });

  gist.prepend(button);
});
