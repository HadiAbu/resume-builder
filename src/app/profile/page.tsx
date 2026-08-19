import Link from "next/link";

import { BACKEND_URL } from "@/lib/backend";
import { placeholderProjects } from "@/lib/placeholder-projects";

interface ProfileData {
  displayName: string;
  email: string;
  bio: string | null;
  photoUrl: string | null;
  role: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  skills: string[];
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase() ?? "");
  return initials.join("") || "?";
}

export default async function ProfilePage() {
  const res = await fetch(`${BACKEND_URL}/profile`, { cache: "no-store" });

  if (!res.ok) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="mb-2 text-xl text-text">This profile hasn&apos;t been set up yet</h1>
        <p className="text-muted">Check back once the owner has completed setup.</p>
      </div>
    );
  }

  const profile = (await res.json()) as ProfileData;

  const recentProjects = placeholderProjects.slice(0, 3);

  return (
    <div className="mx-auto max-w-[960px] px-6 py-12 pb-20">
      <div className="mb-10 flex items-start gap-7">
        {profile.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- data: URI photo, next/image doesn't apply here
          <img
            src={profile.photoUrl}
            alt={profile.displayName}
            className="h-24 w-24 flex-none rounded-full border border-border object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 flex-none items-center justify-center rounded-full border border-border bg-gradient-to-br from-accent-muted to-surface font-mono text-2xl text-accent">
            {getInitials(profile.displayName)}
          </div>
        )}
        <div>
          <h1 className="mb-1 text-2xl capitalize tracking-tight text-text">{profile.displayName}</h1>
          {profile.role && <div className="mb-3 text-[0.95rem] text-muted">{profile.role}</div>}
          <div className="flex flex-wrap gap-4 font-mono text-sm">
            {profile.githubUrl && (
              <a href={profile.githubUrl} className="text-accent hover:underline">
                {profile.githubUrl.replace(/^https?:\/\//, "")}
              </a>
            )}
            <a href={`mailto:${profile.email}`} className="text-accent hover:underline">
              {profile.email}
            </a>
            {profile.linkedinUrl && (
              <a href={profile.linkedinUrl} className="text-accent hover:underline">
                {profile.linkedinUrl.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        </div>
      </div>

      {profile.bio && (
        <section className="mb-10 max-w-[42rem]">
          <h2 className="mb-4 text-xs uppercase tracking-wider text-faint">About</h2>
          <p className="leading-7 text-muted">{profile.bio}</p>
        </section>
      )}

      {profile.skills.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xs uppercase tracking-wider text-faint">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill, index) => (
              <span
                key={skill}
                className={
                  index === 0
                    ? "inline-flex items-center whitespace-nowrap rounded-full border border-accent-muted bg-tag-bg px-2.5 py-0.5 font-mono text-xs text-accent"
                    : "inline-flex items-center whitespace-nowrap rounded-full border border-tag-border bg-tag-bg px-2.5 py-0.5 font-mono text-xs text-muted"
                }
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xs uppercase tracking-wider text-faint">Recent projects</h2>
        <div className="mb-3 flex flex-col gap-3">
          {recentProjects.map((project) => (
            <div
              key={project.id}
              className="flex items-baseline justify-between rounded-sm border border-border bg-surface px-4 py-3"
            >
              <span className="font-medium text-text">{project.title}</span>
              <div className="flex gap-1.5">
                {project.techKeywords.slice(0, 2).map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center whitespace-nowrap rounded-full border border-tag-border bg-tag-bg px-2.5 py-0.5 font-mono text-xs text-muted"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Link href="/" className="text-sm text-accent hover:underline">
          View all projects &rarr;
        </Link>
      </section>
    </div>
  );
}
