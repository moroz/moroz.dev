import html from "remark-html";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";

export async function formatMarkdown(md: string) {
  const result = await unified()
    .use(remarkParse)
    .use(remarkStringify)
    .use(require("remark-prism"), {
      /* options */
    })
    .use(html, { sanitize: false })
    .process(md);
  return result.toString();
}
