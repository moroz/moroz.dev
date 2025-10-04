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
    Copy to clipboard
  {/if}
</button>

<style>
  @reference "@css/global.css";

  button {
    @apply h-8 w-34 cursor-pointer rounded-tr-sm px-2 text-sm text-inherit transition hover:bg-slate-100 dark:hover:bg-gray-700;
  }
</style>
