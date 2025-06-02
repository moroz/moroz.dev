document.querySelectorAll(".gist[data-code]").forEach((gist) => {
  const button = document.createElement("button");
  button.setAttribute("type", "button");
  button.className = "button copy-to-clipboard";
  button.textContent = "Copy to clipboard";

  const lines = gist.dataset.code?.split("\n");
  if (lines.length === 1) {
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
  });

  gist.prepend(button);
});
