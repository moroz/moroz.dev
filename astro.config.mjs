// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import markdoc from "@astrojs/markdoc";
import svelte from "@astrojs/svelte";
import path from "path";
import rehypeExternalLinks from "rehype-external-links";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve("./src"),
        "@layouts": path.resolve("./src/layouts"),
        "@components": path.resolve("./src/components"),
        "@css": path.resolve("./src/styles"),
      },
    },
  },
  markdown: {
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "catppuccin-macchiato",
      },
      wrap: true,
    },
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          target: "_blank",
          rel: ["noopener", "noreferrer", "nofollow"],
        },
      ],
    ],
  },

  integrations: [markdoc(), svelte()],
});
