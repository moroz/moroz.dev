import fs from "fs";
import matter from "gray-matter";
import { join, basename } from "path";
import { Post, Video } from "../../interfaces";
import day from "dayjs";

const postsDirectory = join(process.cwd(), "content/blog");
const videosDirectory = join(process.cwd(), "content/videos");

export function getPostData(filename: string): Post {
  const resolvedFilename = join(postsDirectory, `${filename}.md`);
  const fileContents = fs.readFileSync(resolvedFilename, "utf8");
  const parsed = matter(fileContents);
  const { data, content } = parsed;
  const date = new Date(data.date).toISOString();
  const datePretty = day(date).format("MMMM D, YYYY");
  return {
    slug: data.slug,
    title: data.title,
    lang: data.lang ?? "en",
    date,
    datePretty,
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

export function getAllPostData() {
  return getAllSlugs(postsDirectory).map(getPostData);
}

export function getAllVideoData() {
  return getAllSlugs(videosDirectory).map(getVideoData);
}

export function getSortedPostData() {
  return getAllPostData().sort((a, b) => {
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
