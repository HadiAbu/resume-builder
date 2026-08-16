import type { Project } from "@/types/project";

function matches(project: Project, needle: string): boolean {
  const haystack = [
    project.title,
    project.description,
    ...project.languages,
    ...project.topics,
    ...project.techKeywords,
    ...project.purposeKeywords,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(needle);
}

export function searchProjects(projects: Project[], query: string): Project[] {
  const needle = query.trim().toLowerCase();

  if (!needle) {
    return projects;
  }

  return projects.filter((project) => matches(project, needle));
}
