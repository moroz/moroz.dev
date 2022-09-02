import { serialize } from "next-mdx-remote/serialize";
import { marked } from "marked";
import rehypeHighlight from "rehype-highlight";
import { lowlight } from "lowlight/lib/core.js";
import sass from "highlight.js/lib/languages/scss";
import elixir from "highlight.js/lib/languages/elixir";
import swift from "highlight.js/lib/languages/swift";
import erb from "highlight.js/lib/languages/erb";
import vim from "highlight.js/lib/languages/vim";
import gql from "highlight.js/lib/languages/graphql";
import smartypants from "remark-smartypants";
const pug = require("highlight-pug/pug");

lowlight.registerLanguage("pug", pug);
lowlight.registerLanguage("sass", sass);
lowlight.registerLanguage("elixir", elixir);
lowlight.registerLanguage("erb", erb);
lowlight.registerLanguage("swift", swift);
lowlight.registerLanguage("vim", vim);
lowlight.registerLanguage("gql", gql);
lowlight.registerLanguage("graphql", gql);

export async function mdToReact(md: string) {
  return serialize(md, {
    mdxOptions: {
      rehypePlugins: [rehypeHighlight],
      remarkPlugins: [smartypants]
    }
  });
}

export async function formatMarkdown(md: string) {
  return marked(md);
}
