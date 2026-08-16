import { ProjectBrowser } from "@/components/projects/ProjectBrowser";
import { placeholderProjects } from "@/lib/placeholder-projects";

export default function Home() {
  return (
    <div className="mx-auto max-w-[960px] px-6 py-12 pb-20">
      <header className="mb-10 flex items-center">
        <div className="text-[1.05rem] font-semibold tracking-tight text-text">
          hadi<span className="text-accent">.</span>dev
        </div>
      </header>

      <h1 className="mb-1.5 text-[1.9rem] tracking-tight text-text">Projects</h1>
      <p className="mb-8 max-w-[40rem] text-muted">
        Search by what a project does or what it&apos;s built with - &quot;FastAPI&quot;,
        &quot;scraping&quot;, &quot;Kubernetes&quot;.
      </p>

      <ProjectBrowser projects={placeholderProjects} />
    </div>
  );
}
