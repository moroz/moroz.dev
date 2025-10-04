<script lang="ts">
  interface Props {
    lines: string[];
  }

  const { lines } = $props();

  let success = $state(false);

  function onClick() {
    navigator.clipboard.writeText(lines.join("\n"));
    success = true;

    setTimeout(() => {
      success = false;
    }, 3000);
  }
</script>

<button on:click={onClick}>
  {#if success}
    Copied!
  {:else}
    Copy to clipboard
  {/if}
</button>

<style>
  @reference "@css/global.css";

  button {
    @apply absolute -top-8 right-0 h-8 w-34 cursor-pointer border border-b-0 border-solid border-slate-400 bg-slate-100/40 px-2 text-sm text-slate-900 transition hover:bg-slate-100;
  }
</style>
