import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({
    pattern: ["**/*.{md,mdx}"],
    base: "./content/blog",
  }),

  schema: z.object({
    title: z.string(),
    date: z.date(),
    summary: z.string().optional(),
    lang: z.string().default("en"),
    draft: z.boolean().default(false),
  }),
});

const videos = defineCollection({
  loader: glob({
    pattern: ["*.md"],
    base: "./content/videos",
  }),

  schema: z.object({
    title: z.string(),
    youtube: z.string(),
    date: z.date(),
    slug: z.string(),
    summary: z.string().optional(),
    tags: z.array(z.string()),
  }),
});

export const collections = { blog, videos };
