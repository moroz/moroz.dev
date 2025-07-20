import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({
    pattern: ["**/.md", "*.md"],
    base: "./content/blog",
  }),

  schema: z.object({
    title: z.string(),
    date: z.date(),
    summary: z.string().optional(),
    lang: z.string().default("en"),
  }),
});

export const collections = { blog };
