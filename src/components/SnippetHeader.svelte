<script lang="ts">
  import CopyToClipboardButton from "@components/CopyToClipboardButton.svelte";

  interface Props {
    lang?: string;
    code: string;
    filename?: string;
  }

  const { lang, code, filename } = $props();

  const displayName = (() => {
    if (!lang) return "";

    switch (lang) {
      case "plain":
      case "text":
        return "Plaintext";
      case "powershell":
        return "PowerShell";
      case "js":
        return "JavaScript";
      case "ts":
        return "TypeScript";
      case "cs":
        return "C#";
      case "xml":
      case "html":
      case "json":
        return lang.toUpperCase();
      default: {
        return lang.slice(0, 1).toUpperCase() + lang.slice(1);
      }
    }
  })();
</script>

<header class="text-sm">
  {#if filename}
    <span class="font-mono">{filename} ({displayName})</span>
  {:else}
    <span>{displayName}</span>
  {/if}
  <CopyToClipboardButton {code} />
</header>

<style>
  @reference "@css/global.css";

  header {
    @apply flex items-center justify-between overflow-hidden border-b border-solid border-slate-400 pl-4;
  }

  .filename {
    @apply font-mono;
  }
</style>
