# moroz.dev

Karol Moroz's website: Astro 6, Svelte 5, Tailwind 4, deployed by Netlify (deploy previews
on pull requests). Main font IBM Plex Sans (`@fontsource-variable/ibm-plex-sans`).

## Portfolio (`content/projects/<slug>/index.md`)

- Frontmatter schema: `src/content.config.ts`. `started` is the month the project began,
  quoted `"YYYY-MM"`; the list is sorted newest first. `cover`/`icon` are optional.
- The body has exactly these level-2 sections, in this order: `## What?`, `## Why?`,
  `## How?` (subsections as `###`). The project page fails the build otherwise
  (`checkSections` in `src/lib/projects.ts`).
- Published prose is in a neutral, scientific register: impersonal, precise, no
  rhetorical devices. Karol will replace the texts with his own write-ups; don't
  overwrite those with generated prose.
- Don't name employers; Karol's day job is "Day Job Inc.".
- Links to codeshare-writeup PDFs point at a specific release's assets
  (`releases/download/<tag>/<file>`), never `latest/download`.
