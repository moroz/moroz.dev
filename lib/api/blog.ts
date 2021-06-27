import fs from "fs";
import matter from "gray-matter";
import { join, basename } from "path";
import { Post, Video } from "../../interfaces";
import day from "dayjs";
import { formatMarkdown } from "./markdown";

const isDev = process.env.NODE_ENV !== "production";

const postsDirectory = join(process.cwd(), "content/blog");
const videosDirectory = join(process.cwd(), "content/videos");

export async function getPostData(filename: string): Promise<Post> {
  const resolvedFilename = join(postsDirectory, `${filename}.md`);
  const fileContents = fs.readFileSync(resolvedFilename, "utf8");
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
    content: content,
    filename: resolvedFilename
  };
}

export function getVideoData(filename: string): Video {
  const resolvedFilename = join(videosDirectory, `${filename}.md`);
  const fileContents = fs.readFileSync(resolvedFilename, "utf8");
  const parsed = matter(fileContents);
  const { data, content } = parsed;
  const date = new Date(data.date).toISOString();
  const datePretty = day(date).format("MMMM D, YYYY");
  return {
    slug: data.slug,
    title: data.title,
    date,
    datePretty,
    content: content,
    youtube: data.youtube,
    filename: resolvedFilename
  };
}

export function getAllSlugs(directory: string) {
  return fs
    .readdirSync(directory)
    .filter((fn) => fn.match(/\.md$/))
    .map((name) => basename(name, ".md"));
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
