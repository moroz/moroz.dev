import { type CollectionEntry, getCollection } from "astro:content";

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

// Series are recognised by title prefix; the rest of the title names the part.
const SERIES = [
  {
    name: "Envelope Encryption with AWS KMS in Node.js",
    prefix: /^Envelope Encryption with AWS KMS in Node\.js, (?=Part)/,
  },
  {
    name: "Learning iOS and Swift",
    prefix: /^Learning iOS and Swift\. (?=Day)/,
  },
  { name: "Go 入門", prefix: /^Go 入門：/ },
];

export interface SeriesPart {
  id: string;
  title: string;
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

  const series: Series[] = [];
  for (const { name, prefix } of SERIES) {
    const parts = posts
      .filter((post) => prefix.test(post.data.title))
      .map((post) => ({
        id: post.id,
        title: post.data.title.replace(prefix, ""),
      }))
      .reverse();
    if (parts.length) series.push({ name, parts });
  }
  const latest = (s: Series) =>
    posts.findIndex((p) => p.id === s.parts.at(-1)!.id);
  series.sort((a, b) => latest(a) - latest(b));

  return { years, series };
}

const CJK =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;

// About 230 words or 300 CJK characters a minute.
export function readingMinutes(body = ""): number {
  const cjk = body.match(CJK)?.length ?? 0;
  const words = body.replace(CJK, " ").match(/\S+/g)?.length ?? 0;
  return Math.max(1, Math.round(words / 230 + cjk / 300));
}
