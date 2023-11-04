import { serialize } from "next-mdx-remote/serialize";
import { marked } from "marked";
import rehypeHighlight from "rehype-highlight";
import sass from "highlight.js/lib/languages/scss";
import elixir from "highlight.js/lib/languages/elixir";
import swift from "highlight.js/lib/languages/swift";
import erb from "highlight.js/lib/languages/erb";
import vim from "highlight.js/lib/languages/vim";
import gql from "highlight.js/lib/languages/graphql";
import smartypants from "remark-smartypants";

export async function mdToReact(md: string) {
  return serialize(md, {
    mdxOptions: {
      rehypePlugins: [
        [
          rehypeHighlight as any,
          { languages: { sass, elixir, swift, erb, vim, gql } }
        ]
      ],
      remarkPlugins: [smartypants]
    }
  });
}

export async function formatMarkdown(md: string) {
  return marked(md);
}
