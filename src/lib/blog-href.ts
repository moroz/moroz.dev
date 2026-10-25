// Blog URLs; no astro:content import, so client scripts can use them too.

export const pageHref = (page: number) =>
  page === 1 ? "/blog/" : `/blog/page/${page}/`;

// A post linked from a list page carries `?ref=<page>`, so the post's back
// link returns to that page.
export const postHref = (id: string, ref?: number) =>
  ref && ref > 1 ? `/blog/${id}/?ref=${ref}` : `/blog/${id}/`;

export function backHref(search: string) {
  const ref = new URLSearchParams(search).get("ref");
  return ref && /^[1-9]\d{0,3}$/.test(ref) ? pageHref(Number(ref)) : "/blog/";
}
