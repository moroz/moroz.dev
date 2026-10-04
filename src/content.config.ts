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

const projects = defineCollection({
  loader: glob({
    pattern: ["**/*.{md,mdx}"],
    base: "./content/projects",
  }),

  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string(),
      tagline: z.string(),
      year: z.number(),
      role: z.string(),
      status: z.string(),
      icon: image(),
      cover: image(),
      coverAlt: z.string(),
      stack: z.array(z.string()),
      highlights: z.array(z.string()).default([]),
      links: z
        .array(z.object({ label: z.string(), href: z.string().url() }))
        .default([]),
      order: z.number().default(100),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    }),
});

export const collections = { blog, videos, projects };
