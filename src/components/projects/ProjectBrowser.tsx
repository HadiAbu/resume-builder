"use client";

import { useMemo, useState } from "react";

import { searchProjects } from "@/lib/search-projects";
import type { Project } from "@/types/project";

import { ProjectCard } from "./ProjectCard";

interface ProjectBrowserProps {
  projects: Project[];
}

export function ProjectBrowser({ projects }: ProjectBrowserProps) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchProjects(projects, query), [projects, query]);

  return (
    <div>
      <div className="flex items-center gap-2.5 rounded-md border border-border bg-surface px-4 py-3">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="shrink-0 text-faint"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search projects..."
          className="flex-1 bg-transparent font-sans text-[0.95rem] text-text placeholder:text-faint outline-none"
        />
      </div>
      <div className="mb-8 mt-3 text-[0.8rem] text-faint">
        {results.length} {results.length === 1 ? "project" : "projects"}
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {results.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="px-4 py-16 text-center text-muted">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mx-auto mb-3 text-faint"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <h3 className="mb-1 text-[1.05rem] text-text">No projects match &quot;{query.trim()}&quot;</h3>
          <p>Try a different tech, keyword, or clear the search.</p>
        </div>
      )}
    </div>
  );
}
