<script lang="ts">
  import { Hamburger } from "svelte-hamburgers";

  let open = $state(false);
</script>

<header
  class="b-unset fixed inset-0 z-10 flex h-16 items-center justify-between border-b border-slate-700 bg-white dark:bg-slate-900"
>
  <div
    class="container mx-auto flex h-full items-center justify-between max-md:pl-4"
  >
    <a href="/">
      <h1 class="text-2xl font-bold">moroz.dev</h1>
    </a>
    <div class="hamburger-wrapper md:hidden">
      <Hamburger bind:open />
    </div>
    <nav class={["h-full", open && "open"]}>
      <ul class="flex h-full items-stretch">
        <li><a href="/">Home</a></li>
        <li><a href="/blog/">Blog</a></li>
        <li><a href="/videos/">Videos</a></li>
        <li><a href="/contact/">Contact</a></li>
      </ul>
    </nav>
  </div>
</header>

<style>
  @reference "@css/global.css";

  a {
    @apply transition;
  }

  li {
    @apply h-full;
  }

  a {
    @apply hover:text-primary inline-flex h-full items-center font-semibold;
  }

  nav a {
    @apply px-5;
  }

  h1 a {
    @apply p-0;
  }

  header:has(:hover) {
    a:not(:hover) {
      @apply text-slate-700 dark:text-gray-400;
    }
  }

  .hamburger-wrapper {
    --color: currentColor;
  }

  nav:not(.open) {
    @apply inset-0 top-16 z-10 max-md:fixed max-md:hidden;
  }

  nav.open {
    @apply inset-0 top-16 z-10 bg-white max-md:fixed dark:bg-slate-900;

    ul {
      @apply flex-col items-start;
    }

    li {
      @apply max-md:h-16 max-md:w-full max-md:text-lg;

      a {
        @apply h-full hover:bg-slate-100 max-md:w-full max-md:justify-end max-md:text-right dark:hover:bg-slate-800;
      }
    }
  }
</style>
