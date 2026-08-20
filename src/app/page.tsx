import Link from "next/link";

import { signOutAction } from "@/actions/auth";
import { ProjectBrowser } from "@/components/projects/ProjectBrowser";
import { BACKEND_URL } from "@/lib/backend";
import { getCurrentUser } from "@/lib/session";
import type { Project } from "@/types/project";

export default async function Home() {
  const [setupRes, projectsRes] = await Promise.all([
    fetch(`${BACKEND_URL}/auth/setup-status`, { cache: "no-store" }),
    fetch(`${BACKEND_URL}/projects`, { cache: "no-store" }),
  ]);
  const { needsSetup } = (await setupRes.json()) as { needsSetup: boolean };
  const projects = (await projectsRes.json()) as Project[];

  const user = needsSetup ? null : await getCurrentUser();

  return (
    <div className="mx-auto max-w-[960px] px-6 py-12 pb-20">
      <header className="mb-10 flex items-center justify-between">
        <div className="text-[1.05rem] font-semibold tracking-tight text-text">
          hadi<span className="text-accent">.</span>dev
        </div>
        <div className="flex items-center gap-4">
          <Link href="/profile" className="text-sm text-muted hover:text-text">
            Profile
          </Link>
          {needsSetup ? (
            <Link href="/signup" className="text-sm text-muted hover:text-text">
              Set up owner account
            </Link>
          ) : user ? (
            <>
              <Link href="/dashboard" className="text-sm capitalize text-muted hover:text-text">
                {user.displayName}
              </Link>
              <form action={signOutAction}>
                <button type="submit" className="text-sm text-muted hover:text-text">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="text-sm text-muted hover:text-text">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <h1 className="mb-1.5 text-[1.9rem] tracking-tight text-text">Projects</h1>
      <p className="mb-8 max-w-[40rem] text-muted">
        Search by what a project does or what it&apos;s built with - &quot;FastAPI&quot;,
        &quot;scraping&quot;, &quot;Kubernetes&quot;.
      </p>

      {projects.length > 0 ? (
        <ProjectBrowser projects={projects} />
      ) : (
        <div className="px-4 py-16 text-center text-muted">
          <h3 className="mb-1 text-[1.05rem] text-text">No projects imported yet</h3>
          <p>
            {user ? (
              <>
                Go to{" "}
                <Link href="/dashboard" className="text-accent hover:underline">
                  the dashboard
                </Link>{" "}
                to import from GitHub.
              </>
            ) : (
              "Check back once the owner has imported their projects."
            )}
          </p>
        </div>
      )}
    </div>
  );
}
