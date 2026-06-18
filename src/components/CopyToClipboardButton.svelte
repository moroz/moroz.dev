<script lang="ts">
  interface Props {
    code: string;
    isCommands: boolean;
  }

  const { code, isCommands } = $props();

  let success = $state(false);

  function onClick() {
    navigator.clipboard.writeText(code);
    success = true;

    setTimeout(() => {
      success = false;
    }, 3000);
  }

  const label = $derived.by(() => {
    if (!isCommands) return "code";
    if (isCommands && code.trim().split("\n").length === 1) return "command";
    return "commands";
  });
</script>

<button on:click={onClick}>
  {#if success}
    <span class="success"> Copied! </span>
  {/if}
  <!-- Hide the original contents using visibility: hidden; to maintain the original width -->
  <div class={["contents", success && "invisible"]}>
    <svg viewBox="0 0 24 24">
      <use xlink:href="/icons/copy.svg" />
    </svg>
    Copy {label}
  </div>
</button>

<style>
  @reference "@css/global.css";

  .success {
    @apply absolute inset-0 flex items-center justify-center bg-inherit;
  }

  svg {
    @apply h-4;
  }

  button {
    @apply relative flex h-8 min-w-32 cursor-pointer items-center justify-center gap-2 rounded-tr-sm bg-inherit px-4 text-center text-sm text-inherit transition hover:bg-slate-100 dark:hover:bg-gray-700;
  }
</style>
