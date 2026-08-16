import type { Project } from "@/types/project";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { title, description, techKeywords } = project;

  return (
    <article className="flex flex-col gap-2.5 rounded-md border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
      <h2 className="text-[1.05rem] font-medium tracking-tight text-text">{title}</h2>
      <p className="text-[0.88rem] leading-relaxed text-muted">{description}</p>
      {techKeywords.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {techKeywords.map((keyword, index) => (
            <span
              key={keyword}
              className={
                index === 0
                  ? "inline-flex items-center whitespace-nowrap rounded-full border border-accent-muted bg-tag-bg px-2.5 py-0.5 font-mono text-xs text-accent"
                  : "inline-flex items-center whitespace-nowrap rounded-full border border-tag-border bg-tag-bg px-2.5 py-0.5 font-mono text-xs text-muted"
              }
            >
              {keyword}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
