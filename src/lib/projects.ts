import { getCollection, type CollectionEntry } from "astro:content";

type Project = CollectionEntry<"projects">;

// Every project page has these sections, in this order, as level-2 headings.
export const REQUIRED_SECTIONS = ["What?", "Why?", "How?"];

export async function getProjects() {
  const showDrafts = import.meta.env.DEV;
  const projects = await getCollection(
    "projects",
    (p) => showDrafts || !p.data.draft,
  );
  // Newest first; `order` breaks ties within a month.
  return projects.sort(
    (a, b) =>
      b.data.started.localeCompare(a.data.started) ||
      a.data.order - b.data.order,
  );
}

// "2026-06" -> "June 2026"
export function formatStarted(started: string) {
  const [year, month] = started.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function checkSections(project: Project, headings: { depth: number; text: string }[]) {
  const found = headings.filter((h) => h.depth === 2).map((h) => h.text);
  const expected = REQUIRED_SECTIONS.join(", ");
  const sections = found.filter((t) => REQUIRED_SECTIONS.includes(t));
  if (sections.join(", ") !== expected) {
    throw new Error(
      `content/projects/${project.id}: needs the sections ${expected} as "## " headings, in that order (found: ${found.join(", ") || "none"})`,
    );
  }
}
