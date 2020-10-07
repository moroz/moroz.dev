import remark from "remark";
import html from "remark-html";

export async function formatMarkdown(md: string) {
  const result = await remark()
    .use(html)
    .use(require("@silvenon/remark-smartypants"))
    .use(require("remark-prism"), {
      plugins: [
        "prismjs/plugins/autolinker/prism-autolinker",
        "prismjs/plugins/diff-highlight/prism-diff-highlight",
        "prismjs/plugins/inline-color/prism-inline-color",
        "prismjs/plugins/line-numbers/prism-line-numbers",
        "prismjs/plugins/treeview/prism-treeview",
        "prismjs/plugins/show-invisibles/prism-show-invisibles"
      ]
    })
    .process(md);
  return result.toString();
}
