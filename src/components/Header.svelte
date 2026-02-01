<script lang="ts">
  import { Hamburger } from "svelte-hamburgers";

  let open = $state(false);
</script>

<header
  class="b-unset fixed inset-0 z-10 flex h-16 items-center justify-between border-b border-slate-700 bg-white dark:bg-slate-900"
>
  <div
    class="mobile:pl-4 desktop:mx-auto container flex h-full w-full items-center justify-between"
  >
    <a href="/">
      <h1 class="text-2xl font-bold">moroz.dev</h1>
    </a>
    <div class="hamburger-wrapper desktop:hidden">
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
    @apply mobile:fixed mobile:hidden inset-0 top-16 z-10;
  }

  nav.open {
    @apply mobile:fixed inset-0 top-16 z-10 bg-white dark:bg-slate-900;

    ul {
      @apply flex-col items-start;
    }

    li {
      @apply mobile:h-16 mobile:w-full mobile:text-lg;

      a {
        @apply mobile:w-full mobile:justify-end mobile:text-right h-full hover:bg-slate-100 dark:hover:bg-slate-800;
      }
    }
  }
</style>
