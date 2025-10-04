<script lang="ts">
  interface Props {
    code: string;
  }

  const { code } = $props();

  let success = $state(false);

  function onClick() {
    navigator.clipboard.writeText(code);
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
    <svg viewBox="0 0 24 24">
      <use xlink:href="/icons/copy.svg" />
    </svg>
    Copy code
  {/if}
</button>

<style>
  @reference "@css/global.css";

  svg {
    @apply h-4;
  }

  button {
    @apply flex h-8 w-32 cursor-pointer items-center justify-center gap-2 rounded-tr-sm px-2 text-center text-sm text-inherit transition hover:bg-slate-100 dark:hover:bg-gray-700;
  }
</style>
