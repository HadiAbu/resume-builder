import { importProjectsAction, signOutAction, updateProfileAction } from "@/actions/auth";
import { BACKEND_URL } from "@/lib/backend";
import { requireCurrentUser } from "@/lib/session";

interface ProfileData {
  displayName: string;
  bio: string | null;
  role: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  skills: string[];
}

function parseGitHubUsername(githubUrl: string | null): string {
  if (!githubUrl) return "";
  try {
    const segments = new URL(githubUrl).pathname.split("/").filter(Boolean);
    return segments[0] ?? "";
  } catch {
    return "";
  }
}

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  await requireCurrentUser();
  const { error, updated, imported } = await props.searchParams;

  const res = await fetch(`${BACKEND_URL}/profile`, { cache: "no-store" });
  const profile = (await res.json()) as ProfileData;

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="mb-6 text-xl text-text">Edit profile</h1>

      {updated && (
        <p className="mb-4 rounded-md border border-accent-muted bg-tag-bg px-4 py-2 text-sm text-accent">
          Profile updated.
        </p>
      )}
      {imported && (
        <p className="mb-4 rounded-md border border-accent-muted bg-tag-bg px-4 py-2 text-sm text-accent">
          Imported {imported} project{imported === "1" ? "" : "s"}.
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-md border border-border bg-surface px-4 py-2 text-sm text-text">
          {error}
        </p>
      )}

      <form action={updateProfileAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-muted">
          Display name
          <input
            name="displayName"
            type="text"
            required
            defaultValue={profile.displayName}
            className="rounded-md border border-border bg-surface px-3 py-2 text-text outline-none focus:border-accent-muted"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          Role
          <input
            name="role"
            type="text"
            defaultValue={profile.role ?? ""}
            placeholder="Full-stack developer - FastAPI, React, Kubernetes"
            className="rounded-md border border-border bg-surface px-3 py-2 text-text outline-none focus:border-accent-muted"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          Bio
          <textarea
            name="bio"
            rows={4}
            defaultValue={profile.bio ?? ""}
            className="rounded-md border border-border bg-surface px-3 py-2 text-text outline-none focus:border-accent-muted"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          GitHub URL
          <input
            name="githubUrl"
            type="url"
            defaultValue={profile.githubUrl ?? ""}
            className="rounded-md border border-border bg-surface px-3 py-2 text-text outline-none focus:border-accent-muted"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          LinkedIn URL
          <input
            name="linkedinUrl"
            type="url"
            defaultValue={profile.linkedinUrl ?? ""}
            className="rounded-md border border-border bg-surface px-3 py-2 text-text outline-none focus:border-accent-muted"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          Skills (comma-separated)
          <input
            name="skills"
            type="text"
            defaultValue={profile.skills.join(", ")}
            placeholder="Python, FastAPI, React"
            className="rounded-md border border-border bg-surface px-3 py-2 text-text outline-none focus:border-accent-muted"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          Photo (max 2MB)
          <input name="photo" type="file" accept="image/*" className="text-text" />
        </label>
        <button
          type="submit"
          className="mt-2 rounded-md bg-accent px-4 py-2 font-medium text-accent-ink hover:opacity-90"
        >
          Save
        </button>
      </form>

      <div className="mt-10 border-t border-border pt-6">
        <h2 className="mb-4 text-lg text-text">Import from GitHub</h2>
        <form action={importProjectsAction} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-muted">
            GitHub username
            <input
              name="githubUsername"
              type="text"
              required
              defaultValue={parseGitHubUsername(profile.githubUrl)}
              className="rounded-md border border-border bg-surface px-3 py-2 text-text outline-none focus:border-accent-muted"
            />
          </label>
          <button
            type="submit"
            className="mt-2 rounded-md bg-accent px-4 py-2 font-medium text-accent-ink hover:opacity-90"
          >
            Import projects
          </button>
        </form>
      </div>

      <form action={signOutAction} className="mt-6">
        <button
          type="submit"
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-text hover:bg-surface-hover"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
