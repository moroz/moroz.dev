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
  };
}
