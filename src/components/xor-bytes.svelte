<script lang="ts">
  import type { Snippet } from "svelte";
  import XorBit from "./xor-bit.svelte";
  import XorResult from "./xor-result.svelte";

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  type Operand = "a" | "b";

  const IPAD = 0x36;
  const OPAD = 0x5c;

  let bytes = $state({ a: 0x00, b: OPAD });
  const result = $derived(bytes.a ^ bytes.b);

  // Most significant bit first, the way a byte is written out
  const positions = [7, 6, 5, 4, 3, 2, 1, 0];

  const uid = $props.id();

  // Roving tabindex: one tab stop per byte; the arrow keys move between its bits
  let focused = $state({ a: 0, b: 0 });
  let refs: Record<Operand, HTMLButtonElement[]> = $state({ a: [], b: [] });

  const operands: { key: Operand; label: string }[] = [
    { key: "a", label: "A" },
    { key: "b", label: "B" },
  ];

  // A different byte each time, so the click always visibly changes something
  function random(current: number) {
    let next = current;
    while (next === current) next = crypto.getRandomValues(new Uint8Array(1))[0];
    return next;
  }

  // `active` marks a preset whose value is in effect; random presets are never active
  type Preset = { label: string; apply: () => void; active?: () => boolean };

  const presets: { key: Operand; label: string; options: Preset[] }[] = [
    {
      key: "a",
      label: "A",
      options: [
        { label: "0x00", apply: () => (bytes.a = 0x00), active: () => bytes.a === 0x00 },
        { label: "0xFF", apply: () => (bytes.a = 0xff), active: () => bytes.a === 0xff },
        { label: "random", apply: () => (bytes.a = random(bytes.a)) },
      ],
    },
    {
      key: "b",
      label: "B",
      options: [
        { label: "ipad 0x36", apply: () => (bytes.b = IPAD), active: () => bytes.b === IPAD },
        { label: "opad 0x5C", apply: () => (bytes.b = OPAD), active: () => bytes.b === OPAD },
        { label: "A", apply: () => (bytes.b = bytes.a), active: () => bytes.b === bytes.a },
        { label: "random", apply: () => (bytes.b = random(bytes.b)) },
      ],
    },
  ];

  const hex = (n: number) => "0x" + n.toString(16).toUpperCase().padStart(2, "0");
  const binary = (n: number) => n.toString(2).padStart(8, "0");
  const bit = (n: number, position: number) => (n >> position) & 1;

  function move(key: Operand, column: number, e: KeyboardEvent) {
    const target = ({ ArrowLeft: column - 1, ArrowRight: column + 1, Home: 0, End: 7 } as Record<string, number>)[e.key];
    if (target === undefined) return;
    e.preventDefault();
    focused[key] = Math.max(0, Math.min(7, target));
    refs[key][focused[key]]?.focus();
  }
</script>

<figure>
  <div class="not-prose widget">
    <div class="rows">
      {#each operands as { key, label } (key)}
        <div class="row">
          <span class="name" id="{uid}-{key}">{label}</span>
          <div class="bits" role="toolbar" aria-labelledby="{uid}-{key}">
            {#each positions as position, column}
              <XorBit
                value={bit(bytes[key], position)}
                aria-label="bit {position}"
                tabindex={focused[key] === column ? 0 : -1}
                bind:ref={refs[key][column]}
                onclick={() => (bytes[key] ^= 1 << position)}
                onkeydown={(e) => move(key, column, e)}
                onfocus={() => (focused[key] = column)}
              />
            {/each}
          </div>
          <span class="value">
            <span class="sr-only">{label} =</span>
            {hex(bytes[key])}
            <span class="decimal" aria-hidden="true">{bytes[key]}</span>
          </span>
        </div>
      {/each}

      <div class="row total">
        <span class="name" aria-hidden="true">A XOR B</span>
        <div class="bits">
          {#each positions as position}
            <XorResult value={bit(result, position)} />
          {/each}
        </div>
        <span class="value result">
          <span class="sr-only">A XOR B =</span>
          {hex(result)}
          <span class="decimal" aria-hidden="true">{result}</span>
        </span>
      </div>
    </div>

    <div class="presets">
      {#each presets as { key, label, options } (key)}
        <div class="preset-group" role="group" aria-label="Presets for {label}">
          <span class="preset-name" aria-hidden="true">{label} =</span>
          {#each options as preset}
            <button
              type="button"
              class={[preset.active?.() && "on"]}
              aria-pressed={preset.active ? preset.active() : undefined}
              onclick={preset.apply}
            >
              {preset.label}
            </button>
          {/each}
        </div>
      {/each}
    </div>

    <p class="sr-only" aria-live="polite">
      {hex(bytes.a)} XOR {hex(bytes.b)} = {hex(result)}, binary {binary(result)}
    </p>
  </div>
  <figcaption>
    {@render children?.()}
  </figcaption>
</figure>

<style>
  @reference "@css/global.css";

  .widget {
    @apply flex flex-col items-center gap-6 rounded-sm border border-slate-400 bg-slate-100/40 px-4 py-7 font-mono text-slate-900 dark:bg-[#24292e] dark:text-slate-100;
  }

  .rows {
    @apply flex w-full max-w-xl flex-col gap-2;
  }

  .row {
    @apply grid items-center gap-x-3 gap-y-1.5;
    grid-template-columns: 5rem minmax(0, 23.75rem) auto;
    grid-template-areas: "name bits value";

    @variant mobile {
      grid-template-columns: auto auto;
      grid-template-areas:
        "name value"
        "bits bits";
    }
  }

  .total {
    @apply mt-1 border-t border-slate-900 pt-3 dark:border-slate-300;
  }

  .name {
    @apply text-right whitespace-nowrap text-slate-600 dark:text-slate-300;
    grid-area: name;

    @variant mobile {
      @apply text-left;
    }
  }

  .bits {
    @apply grid grid-cols-8 gap-1;
    grid-area: bits;
  }

  .value {
    @apply flex items-baseline gap-3 text-lg font-semibold whitespace-nowrap;
    grid-area: value;

    @variant mobile {
      @apply justify-end;
    }
  }

  .decimal {
    @apply w-8 text-right text-sm font-normal text-slate-600 dark:text-slate-300;
  }

  .presets {
    @apply flex flex-col items-center gap-2 text-sm;
  }

  .preset-group {
    @apply flex flex-wrap items-center justify-center gap-2;

    button {
      @apply min-h-11 cursor-pointer rounded-sm border border-slate-600 bg-white px-3 text-primary hover:bg-slate-100 dark:border-slate-300 dark:bg-transparent dark:text-amber-400 dark:hover:bg-slate-800;
      @apply focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:focus-visible:outline-amber-400;

      /* Same colours as a set bit */
      &.on {
        @apply border-primary bg-primary text-white hover:bg-primary dark:border-amber-400 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-400;
      }
    }
  }

  .preset-name {
    @apply w-10 text-slate-600 dark:text-slate-300;
  }
</style>
