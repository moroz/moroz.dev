<script lang="ts">
  import type { Snippet } from "svelte";
  import XorBit from "./XorBit.svelte";
  import XorResult from "./XorResult.svelte";

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
        <XorBit value={a} size="lg" aria-label="A" onclick={() => (a ^= 1)} />
      </div>
      <span class="operator" aria-hidden="true">XOR</span>
      <div class="operand">
        <span aria-hidden="true">B</span>
        <XorBit value={b} size="lg" aria-label="B" onclick={() => (b ^= 1)} />
      </div>
      <span class="operator text-2xl" aria-hidden="true">=</span>
      <div class="operand" aria-hidden="true">
        <span>result</span>
        <XorResult value={result} size="lg" />
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
