<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  let a = $state(1);
  let b = $state(0);
  const result = $derived(a ^ b);

  const rows = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ] as const;
</script>

<figure>
  <div class="not-prose widget">
    <div class="flex items-end gap-4">
      <div class="operand">
        <span aria-hidden="true">A</span>
        <button
          type="button"
          class={["bit", a === 1 && "on"]}
          aria-label="A"
          aria-pressed={a === 1}
          onclick={() => (a ^= 1)}
        >
          {a}
        </button>
      </div>
      <span class="operator" aria-hidden="true">XOR</span>
      <div class="operand">
        <span aria-hidden="true">B</span>
        <button
          type="button"
          class={["bit", b === 1 && "on"]}
          aria-label="B"
          aria-pressed={b === 1}
          onclick={() => (b ^= 1)}
        >
          {b}
        </button>
      </div>
      <span class="operator text-2xl" aria-hidden="true">=</span>
      <div class="operand" aria-hidden="true">
        <span>result</span>
        <span class={["result", result === 1 && "on"]}>{result}</span>
      </div>
    </div>

    <p class="sr-only" aria-live="polite">{a} XOR {b} = {result}</p>

    <table>
      <thead>
        <tr>
          <th scope="col">A</th>
          <th scope="col">B</th>
          <th scope="col">A XOR B</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as [x, y]}
          {@const current = x === a && y === b}
          <tr class={[current && "current"]} aria-current={current ? "true" : undefined}>
            <td>{x}</td>
            <td>{y}</td>
            <td>{x ^ y}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <figcaption>
    {@render children?.()}
  </figcaption>
</figure>

<style>
  @reference "@css/global.css";

  .widget {
    @apply flex flex-wrap items-center justify-center gap-10 rounded-sm border border-slate-400 bg-slate-100/40 px-6 py-7 font-mono dark:bg-[#24292e];
  }

  .operand {
    @apply flex flex-col items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300;
  }

  .operator {
    @apply pb-5 text-lg text-slate-600 dark:text-slate-300;
  }

  .bit,
  .result {
    @apply grid size-18 place-items-center rounded-sm border text-3xl motion-safe:transition-colors;
  }

  .bit {
    @apply cursor-pointer border-slate-600 bg-white text-slate-600 dark:border-slate-300 dark:bg-transparent dark:text-slate-300;
    @apply focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:focus-visible:outline-amber-400;

    /* amber-400 rather than the dark-mode primary (amber-500): 7:1 against the widget */
    &.on {
      @apply border-primary bg-primary text-white dark:border-amber-400 dark:bg-amber-400 dark:text-slate-900;
    }
  }

  /* A double border tells the result apart from the buttons without relying on colour */
  .result {
    @apply border-4 border-double border-slate-600 text-slate-900 dark:border-slate-300 dark:text-slate-100;

    &.on {
      @apply border-slate-900 bg-amber-400 font-semibold text-slate-900 dark:border-slate-100 dark:bg-sky-300;
    }
  }

  table {
    @apply border-collapse text-lg text-slate-900 dark:text-slate-100;
  }

  th {
    @apply border-b border-slate-900 px-4 py-1.5 font-normal text-slate-600 dark:border-slate-300 dark:text-slate-300;
  }

  td {
    @apply px-4 py-1.5 text-center;
  }

  tr.current {
    @apply bg-amber-400/35 font-semibold outline-2 -outline-offset-2 outline-slate-900 dark:bg-sky-300/20 dark:outline-slate-100;
  }
</style>
