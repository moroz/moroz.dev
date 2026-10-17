<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";

  interface Props extends HTMLButtonAttributes {
    value: number;
    size?: "md" | "lg";
    ref?: HTMLButtonElement;
  }

  let { value, size = "md", ref = $bindable(), ...rest }: Props = $props();
</script>

<button
  type="button"
  bind:this={ref}
  class={["bit", size, value === 1 && "on"]}
  aria-pressed={value === 1}
  {...rest}
>
  {value}
</button>

<style type="postcss">
  @reference "@css/global.css";

  .bit {
    @apply grid cursor-pointer place-items-center rounded-sm border border-slate-600 bg-white text-slate-600 motion-safe:transition-colors dark:border-slate-300 dark:bg-transparent dark:text-slate-300;
    @apply focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:focus-visible:outline-amber-400;

    /* amber-400 rather than the dark-mode primary (amber-500): 7:1 against the widget */
    &.on {
      @apply border-primary bg-primary text-white dark:border-amber-400 dark:bg-amber-400 dark:text-slate-900;
    }
  }

  .md {
    @apply aspect-square w-full max-w-11 text-xl;
  }

  .lg {
    @apply size-18 text-3xl;
  }
</style>
