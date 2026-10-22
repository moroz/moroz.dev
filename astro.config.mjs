// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import markdoc from "@astrojs/markdoc";
import svelte from "@astrojs/svelte";
import path from "path";
import rehypeExternalLinks from "rehype-external-links";
import { fromHtml } from "hast-util-from-html";
import { toText } from "hast-util-to-text";
import temml from "temml";
import { SKIP, visitParents } from "unist-util-visit-parents";
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

/**
 * Rehype plugin that renders the math nodes produced by remark-math to MathML
 * with Temml, so the browser lays formulas out in an OpenType math font.
 *
 * remark-math emits `<code class="math-inline">` for inline math and
 * `<pre><code class="math-display">` for display math; both are replaced by
 * the rendered `<math>` element.
 */
function rehypeTemml(options = {}) {
  return (tree) => {
    visitParents(tree, "element", (node, ancestors) => {
      const classes = node.properties.className ?? [];
      const inline = classes.includes("math-inline");
      const display = classes.includes("math-display");
      if (!inline && !display) return;

      const html = temml.renderToString(toText(node, { whitespace: "pre" }), {
        ...options,
        displayMode: display,
        throwOnError: true,
      });
      const rendered = fromHtml(html, { fragment: true }).children;

      let target = node;
      let parent = ancestors.at(-1);
      if (display && parent?.tagName === "pre") {
        target = parent;
        parent = ancestors.at(-2);
      }
      parent.children.splice(parent.children.indexOf(target), 1, ...rendered);
      return SKIP;
    });
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
      [rehypeTemml, { macros: { "\\xor": "\\mathbin{\\text{XOR}}" } }],
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
