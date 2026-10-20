// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import markdoc from "@astrojs/markdoc";
import svelte from "@astrojs/svelte";
import path from "path";
import rehypeExternalLinks from "rehype-external-links";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

import mdx from "@astrojs/mdx";

/**
 * Shiki transformer that reads a `title="..."` (or `filename="..."`) token from
 * a code fence's meta string and exposes it as a `data-filename` attribute on
 * the rendered `<pre>` element.
 *
 * Usage in markdown/mdx:
 *   ```ts title="src/foo.ts"
 *   // ...
 *   ```
 */
function transformerFilename() {
  return {
    name: "filename",
    pre(node) {
      const raw = this.options.meta?.__raw;
      if (!raw) return;
      const match = raw.match(/(?:title|filename)="([^"]+)"/);
      if (match) {
        node.properties["data-filename"] = match[1];
      }
    },
  };
}

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
        dark: "github-dark",
      },
      wrap: true,
      transformers: [transformerFilename()],
    },
    // Single dollars stay literal; math is written as $$...$$ (inline or display).
    remarkPlugins: [[remarkMath, { singleDollarTextMath: false }]],
    rehypePlugins: [
      [rehypeKatex, { macros: { "\\xor": "\\mathbin{\\text{XOR}}" } }],
      [
        rehypeExternalLinks,
        {
          target: "_blank",
          rel: ["noopener", "noreferrer", "nofollow"],
        },
      ],
    ],
  },

  integrations: [markdoc(), svelte(), mdx()],
});
