<script lang="ts">
  import { DarkModePreference } from "./types.ts";
  import MoonIcon from "../icons/MoonIcon.svelte";
  import SunIcon from "../icons/SunIcon.svelte";

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
  <div class="relative h-5 w-5">
    <MoonIcon
      class="absolute inset-0 h-5 w-5 fill-current transition-opacity not-dark:opacity-0"
    />
    <SunIcon
      class="absolute inset-0 h-5 w-5 fill-current transition-opacity dark:opacity-0"
    />
  </div>
  <span class="sr-only">{description}</span>
</button>
