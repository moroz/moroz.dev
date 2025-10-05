<script lang="ts">
  interface Props {
    src: string;
    darkSrc?: string;
    children?: any;
  }

  let { src, children, darkSrc }: Props = $props();
</script>

<figure>
  <picture>
    {#if darkSrc}
      <source srcset={src} media="(prefers-color-scheme: light)" />
      <source srcset={darkSrc} media="(prefers-color-scheme: dark)" />
    {/if}
    <img {src} alt="" />
  </picture>
  <figcaption>
    {@render children?.()}
  </figcaption>
</figure>
