import fs from "fs";
import matter from "gray-matter";
import { join, basename } from "path";
import { Post } from "../../interfaces";

const postsDirectory = join(process.cwd(), "content/blog");

export function getPostData(filename: string): Post {
  const resolvedFilename = join(postsDirectory, `${filename}.md`);
  const fileContents = fs.readFileSync(resolvedFilename, "utf8");
  const parsed = matter(fileContents);
  const { data, content } = parsed;
  return {
    slug: data.slug,
    title: data.title,
    date: String(data.date),
    content: content,
    filename: resolvedFilename
  };
}

export function getAllSlugs() {
  return fs.readdirSync(postsDirectory).map((name) => basename(name, ".md"));
}
