import Link from "next/link";

import { signOutAction } from "@/actions/auth";
import { ProjectBrowser } from "@/components/projects/ProjectBrowser";
import { BACKEND_URL } from "@/lib/backend";
import { placeholderProjects } from "@/lib/placeholder-projects";
import { getCurrentUser } from "@/lib/session";

export default async function Home() {
  const res = await fetch(`${BACKEND_URL}/auth/setup-status`, { cache: "no-store" });
  const { needsSetup } = (await res.json()) as { needsSetup: boolean };

  const user = needsSetup ? null : await getCurrentUser();

  return (
    <div className="mx-auto max-w-[960px] px-6 py-12 pb-20">
      <header className="mb-10 flex items-center justify-between">
        <div className="text-[1.05rem] font-semibold tracking-tight text-text">
          hadi<span className="text-accent">.</span>dev
        </div>
        {needsSetup ? (
          <Link href="/signup" className="text-sm text-muted hover:text-text">
            Set up owner account
          </Link>
        ) : user ? (
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm capitalize text-muted hover:text-text">
              {user.displayName}
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="text-sm text-muted hover:text-text">
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <Link href="/login" className="text-sm text-muted hover:text-text">
            Sign in
          </Link>
        )}
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
