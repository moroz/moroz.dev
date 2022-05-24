import fs from "fs";
import matter from "gray-matter";
import { join, basename } from "path";
import { Post, Video } from "../../interfaces";
import day from "dayjs";
import { formatMarkdown } from "./markdown";
import glob from "glob";

const isDev = process.env.NODE_ENV !== "production";

const postsDirectory = join(process.cwd(), "content/blog");
const videosDirectory = join(process.cwd(), "content/videos");

interface BlogEntry {
  slug: string;
  filename: string;
}

export async function getPostDataBySlug(slug: string) {
  const path = glob.sync(`${postsDirectory}/**/${slug}.md`)[0];
  return getPostData({ slug, filename: path });
}

export async function getPostData({
  filename: filename
}: BlogEntry): Promise<Post> {
  const fileContents = fs.readFileSync(filename, "utf8");
  const parsed = matter(fileContents);
  const { data, content } = parsed;
  const date = new Date(data.date).toISOString();
  const datePretty = day(date).format("MMMM D, YYYY");
  const summary = data.summary ? await formatMarkdown(data.summary) : null;
  const summaryPlain = data.summary ?? null;
  return {
    slug: data.slug,
    title: data.title,
    lang: data.lang ?? "en",
    draft: data.draft ?? false,
    date,
    datePretty,
    summary,
    summaryPlain,
    content,
    filename
  };
}

export function getVideoData({ filename }: BlogEntry): Video {
  const fileContents = fs.readFileSync(filename, "utf8");
  const parsed = matter(fileContents);
  const { data, content } = parsed;
  const date = new Date(data.date).toISOString();
  const datePretty = day(date).format("MMMM D, YYYY");
  return {
    slug: data.slug,
    title: data.title,
    date,
    datePretty,
    content,
    youtube: data.youtube,
    filename
  };
}

export function getAllSlugs(directory: string) {
  return glob.sync(`${directory}/**/*.md`).map((filename) => {
    const slug = basename(filename, ".md");
    return {
      slug,
      filename
    };
  });
}

export function getAllPostSlugs() {
  return getAllSlugs(postsDirectory);
}

export function getAllVideoSlugs() {
  return getAllSlugs(videosDirectory);
}

export async function getAllPostData() {
  return await Promise.all(getAllSlugs(postsDirectory).map(getPostData));
}

export function getAllVideoData() {
  return getAllSlugs(videosDirectory).map(getVideoData);
}

export async function getSortedPostData() {
  return (await getAllPostData())
    .filter((post) => isDev || !post.draft)
    .sort((a, b) => {
      if (a.date > b.date) return -1;
      if (a.date < b.date) return 1;
      if (a.slug > b.slug) return -1;
      if (a.slug < b.slug) return 1;
      return 0;
    });
}

export function getSortedVideoData() {
  return getAllVideoData().sort((a, b) => {
    if (a.date > b.date) return -1;
    if (a.date < b.date) return 1;
    return 0;
  });
}
