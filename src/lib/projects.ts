import { getCollection } from "astro:content";

export async function getProjects() {
  const showDrafts = import.meta.env.DEV;
  const projects = await getCollection(
    "projects",
    (p) => showDrafts || !p.data.draft,
  );
  return projects.sort(
    (a, b) => a.data.order - b.data.order || b.data.year - a.data.year,
  );
}

export async function getFeaturedProject() {
  const projects = await getProjects();
  return projects.find((p) => p.data.featured) ?? projects[0];
}
