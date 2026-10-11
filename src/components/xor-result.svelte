<script lang="ts">
  interface Props {
    value: number;
    size?: "md" | "lg";
  }

  let { value, size = "md" }: Props = $props();
</script>

<span class={["result", size, value === 1 && "on"]} aria-hidden="true">{value}</span>

<style>
  @reference "@css/global.css";

  /* A double border tells the result apart from the buttons without relying on colour */
  .result {
    @apply grid place-items-center rounded-sm border-4 border-double border-slate-600 text-slate-900 motion-safe:transition-colors dark:border-slate-300 dark:text-slate-100;

    &.on {
      @apply border-slate-900 bg-amber-400 font-semibold text-slate-900 dark:border-slate-100 dark:bg-sky-300;
    }
  }

  .md {
    @apply aspect-square w-full max-w-11 text-xl;
  }

  .lg {
    @apply size-18 text-3xl;
  }
</style>
