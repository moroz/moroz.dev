import { serialize } from "next-mdx-remote/serialize";
import { marked } from "marked";
import rehypeHighlight from "rehype-highlight";
import sass from "highlight.js/lib/languages/scss";
import elixir from "highlight.js/lib/languages/elixir";
import swift from "highlight.js/lib/languages/swift";
import erb from "highlight.js/lib/languages/erb";
import vim from "highlight.js/lib/languages/vim";
import gql from "highlight.js/lib/languages/graphql";
import yaml from "highlight.js/lib/languages/yaml";
import shell from "highlight.js/lib/languages/shell";
import javascript from "highlight.js/lib/languages/javascript";
import xml from "highlight.js/lib/languages/xml";
import go from "highlight.js/lib/languages/go";
import sql from "highlight.js/lib/languages/sql";
import smartypants from "remark-smartypants";
import rehypeExternalLinks from "rehype-external-links";

export async function mdToReact(md: string) {
  return serialize(md, {
    mdxOptions: {
      rehypePlugins: [
        [
          rehypeHighlight as any,
          {
            detect: true,
            languages: {
              javascript,
              sass,
              elixir,
              swift,
              erb,
              vim,
              gql,
              yaml,
              shell,
              xml,
              go,
              sql
            }
          }
        ],
        [rehypeExternalLinks, { rel: 'noopener noreferrer', target: '_blank' }]
      ],
      remarkPlugins: [smartypants],
    }
  });
}

export async function formatMarkdown(md: string) {
  return marked(md);
}
