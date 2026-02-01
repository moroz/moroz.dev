<script lang="ts">
  import { DarkModePreference } from "./types.ts";

  const initial =
    typeof window === "undefined" || !("localStorage" in window)
      ? null
      : localStorage.getItem("theme");

  let mode = $state(initial);

  function apply() {
    document.documentElement.classList.toggle(
      "dark",
      localStorage.theme === "dark" ||
        (!("theme" in localStorage) &&
          window.matchMedia("(prefers-color-scheme: dark)").matches),
    );
  }

  function cycle() {
    const next =
      mode === DarkModePreference.Dark
        ? DarkModePreference.Light
        : DarkModePreference.Dark;

    mode = next;
    localStorage.setItem("theme", next);
    apply();
  }

  let description = $derived.by(() => {
    switch (mode) {
      case DarkModePreference.Light:
        return "Light";
      case DarkModePreference.Dark:
        return "Dark";
    }
  });
</script>

<button
  onclick={cycle}
  title="Toggle dark/light mode"
  class="hover:text-primary mobile:ml-auto grid aspect-square h-full cursor-pointer place-items-center"
>
  <svg class="h-5 w-5 fill-current">
    <use xlink:href="/icons/sun.svg" class="dark:invisible" />
    <use xlink:href="/icons/moon.svg" class="not-dark:invisible" />
  </svg>
  <span class="sr-only">{description}</span>
</button>
