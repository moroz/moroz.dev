<script lang="ts">
  interface Props {
      lines: string[]
  }

  const {lines} = $props()
</script>

<button>Copy to clipboard</button>

<style>
  @reference "@css/global.css";

  button {
      @apply bg-blue-400 text-white p-4;
  }
</style>