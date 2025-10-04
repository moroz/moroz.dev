import { mount } from "svelte";
import Button from "@/components/CopyToClipboardButton.svelte";

const snippets = document.querySelectorAll<HTMLPreElement>("pre.astro-code");
for (const snippet of snippets) {
  const content = snippet.textContent?.trim();
  if (!content) continue;

  const lang = snippet.dataset.language;
  const isShell = ["powershell", "plain", "text", "json", "bash"].includes(
    lang as string,
  );
  const prompt = lang === "powershell" ? "> " : "$ ";
  let lines = content.split("\n");
  const hasPrompt = lines.some((line) => line.startsWith(prompt));

  if (isShell && hasPrompt) {
    lines = lines
      .filter((line) => line.startsWith(prompt))
      .map((line) => line.replace(prompt, ""))
      .filter(Boolean);
  }

  const wrapper = document.createElement("div");
  wrapper.className = "snippet-wrapper";

  const buttonContainer = document.createElement("div");

  // Insert wrapper before snippet first
  snippet.parentNode?.insertBefore(wrapper, snippet);

  // Then move snippet into wrapper and add button
  wrapper.appendChild(snippet);
  wrapper.prepend(buttonContainer);
  mount(Button, { target: buttonContainer, props: { lines } });
}
