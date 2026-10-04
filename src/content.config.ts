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
      // Month the project began, as YYYY-MM.
      started: z
        .string()
        .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "started must be YYYY-MM"),
      role: z.string(),
      status: z.string(),
      icon: image().optional(),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      stack: z.array(z.string()),
      highlights: z.array(z.string()).default([]),
      links: z
        .array(z.object({ label: z.string(), href: z.string().url() }))
        .default([]),
      order: z.number().default(100),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
    })
      .refine((p) => !p.cover || p.coverAlt, {
        message: "coverAlt is required when cover is set",
        path: ["coverAlt"],
      }),
});

export const collections = { blog, videos, projects };
