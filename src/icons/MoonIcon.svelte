<script lang="ts">
  interface Props {
    class?: string;
  }

  const { class: className }: Props = $props();
</script>

<!-- Lucide "moon", ISC License, https://lucide.dev -->
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  class={className}
>
  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
</svg>
