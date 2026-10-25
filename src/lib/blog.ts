import { type CollectionEntry, getCollection } from "astro:content";
import { pageHref } from "./blog-href.ts";

export const PER_PAGE = 20;

export async function getAllPosts(drafts = false) {
  return getCollection("blog")
    .then((collection) =>
      collection.sort((a, b) => -(Number(a.data.date) - Number(b.data.date))),
    )
    .then((collection) => {
      return collection.filter((post) => drafts || !post.data.draft);
    });
}

export async function getTotalPageCount(drafts = false): Promise<number> {
  const all = await getAllPosts(drafts);
  return Math.ceil(all.length / PER_PAGE);
}

export async function paginatePosts(page = 1, drafts = false) {
  const posts = await getAllPosts(drafts);
  const offset = (page - 1) * PER_PAGE;

  return {
    posts: posts.slice(offset, offset + PER_PAGE).map(transformPost),
    totalPageCount: Math.ceil(posts.length / PER_PAGE),
    totalPostCount: posts.length,
  };
}

export type BlogPost = Omit<CollectionEntry<"blog">, "data"> & {
  data: Omit<CollectionEntry<"blog">["data"], "date"> & {
    date: Temporal.PlainDate;
  };
  readingMinutes: number;
};

export function transformPost(post: CollectionEntry<"blog">): BlogPost {
  const date = Temporal.PlainDate.from(
    Temporal.Instant.fromEpochMilliseconds(
      Number(post.data.date),
    ).toZonedDateTimeISO("UTC"),
  );

  return {
    ...post,
    data: {
      ...post.data,
      date,
    },
    readingMinutes: readingMinutes(post.body),
  };
}

export interface SeriesPart {
  id: string;
  title: string;
  part?: string;
}

export interface Series {
  name: string;
  parts: SeriesPart[];
}

export interface YearEntry {
  year: number;
  count: number;
  // First page of the paginated list that holds a post from this year.
  page: number;
}

// Posts per year and series, both newest first; series parts oldest first.
export async function getBlogIndex(drafts = false) {
  const posts = (await getAllPosts(drafts)).map(transformPost);

  const years: YearEntry[] = [];
  posts.forEach((post, i) => {
    const year = post.data.date.year;
    const last = years.at(-1);
    if (last?.year === year) {
      last.count++;
    } else {
      years.push({ year, count: 1, page: Math.floor(i / PER_PAGE) + 1 });
    }
  });

  // Map keeps insertion order: the series with the newest post comes first.
  const series = new Map<string, SeriesPart[]>();
  for (const post of posts) {
    const { series: name, title, part } = post.data;
    if (!name) continue;
    if (!series.has(name)) series.set(name, []);
    series.get(name)!.unshift({ id: post.id, title, part });
  }

  return {
    years,
    series: [...series].map(([name, parts]): Series => ({ name, parts })),
  };
}

const CJK =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;

// About 230 words or 300 CJK characters a minute.
export function readingMinutes(body = ""): number {
  const cjk = body.match(CJK)?.length ?? 0;
  const words = body.replace(CJK, " ").match(/\S+/g)?.length ?? 0;
  return Math.max(1, Math.round(words / 230 + cjk / 300));
}

export const plural = (n: number, noun: string) =>
  `${n} ${noun}${n === 1 ? "" : "s"}`;

export { pageHref, postHref } from "./blog-href.ts";

export const yearHref = ({ year, page }: YearEntry) =>
  `${pageHref(page)}#y${year}`;

// Consecutive runs of posts from the same year; posts are newest first.
export function groupByYear(posts: BlogPost[]) {
  const groups: { year: number; posts: BlogPost[] }[] = [];
  for (const post of posts) {
    const year = post.data.date.year;
    const last = groups.at(-1);
    if (last?.year === year) last.posts.push(post);
    else groups.push({ year, posts: [post] });
  }
  return groups;
}
