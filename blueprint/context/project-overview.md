# Resume Builder - Project Overview

> A single-tenant online CV and project-showcase template: deploy your own
> instance, import your GitHub projects, and let recruiters search them by
> keyword.

## Problem

Static portfolios and CVs don't surface what a project actually does or which
skills it demonstrates, and they're a pain to keep current. Resume Builder is
both a living online CV for its owner and a reusable template other
developers can deploy to organize and showcase their own GitHub projects.

## Users

- **Owner** - the developer who deploys their own instance. Logs in to manage
  their profile, import and edit projects, and pick a theme. One owner per
  deployment (no multi-tenant signup in v1).
- **Visitor / recruiter** - public, unauthenticated. Browses and searches the
  owner's projects and views their profile/CV.

## Features

1. **Project browse/search UI** - keyword search over the project list (tech
   used, what a project does), built first against placeholder data.
2. **Backend + database skeleton** - Postgres schema and FastAPI service, with
   web, backend, and db all running via docker-compose. *(Infra outcome, not
   user-facing, but unblocks every feature after it.)*
3. **Owner authentication** - signup/login with backend-issued sessions/JWT;
   routes split between the owner and public visitors.
4. **Profile page** - owner-editable personal details and photo; public read
   view for visitors.
5. **GitHub project import** - fetch the owner's public repos (README,
   languages, topics) via GitHub's public API, replacing placeholder data
   with real projects. *(Headline feature - this is what makes the template
   reusable without manual data entry.)*
6. **AI keyword generation** - Claude API summarizes each project's
   README/metadata into tech and purpose keywords, which power search.
7. **Theme presets** - 3+ selectable UI styles, chosen by the owner in
   profile settings; visitors see whichever the owner picked.
8. **Deployment readiness** - EC2 target, docker-compose production config.
9. **CI/CD pipeline** - GitHub Actions workflow, added after core development
   is done.

Out of v1 scope: CV upload/scan-to-display (fast-follow), subscriptions,
multi-tenant signup.

## Data model

### User

One row per deployment (the owner).

- `id` (uuid) - primary key
- `email` (string, unique) - login identifier
- `password_hash` (string) - custom auth credential, never the plaintext
- `display_name` (string) - shown on the profile/CV
- `bio` (text, nullable) - personal summary
- `photo_url` (string, nullable) - profile photo
- `role` (string, nullable) - short title/headline shown under the name
  (e.g. "Full-stack developer - FastAPI, React, Kubernetes")
- `github_url` (string, nullable) - public GitHub profile link
- `linkedin_url` (string, nullable) - public LinkedIn profile link
- `skills` (string[]) - freeform skill tags shown on the public profile
- `theme` (enum, default `minimal`) - selected UI preset; at least 3 values
- `created_at`, `updated_at` (timestamp)

> Added by feature 4 (profile page), expanding the fields locked in feature
> 2's original skeleton - `role`, `github_url`, `linkedin_url`, `skills`.
> Matches `prototypes/profile.html`, feature 4's design reference.

### Project

- `id` (uuid) - primary key
- `user_id` (FK -> User) - owner
- `github_repo` (string) - `owner/repo` reference used for import
- `title` (string) - display name
- `description` (text) - short summary, editable after import
- `homepage_url` (string, nullable) - project link
- `languages` (string[]) - imported from GitHub
- `topics` (string[]) - imported from GitHub
- `tech_keywords` (string[]) - AI-generated, searchable
- `purpose_keywords` (string[]) - AI-generated, searchable
- `readme_excerpt` (text, nullable) - cached source used for the AI summary
- `imported_at` (timestamp, nullable) - last GitHub sync
- `created_at`, `updated_at` (timestamp)

> Lock `tech_keywords` / `purpose_keywords` as the fields search filters on -
> feature 1 and feature 6 both depend on this shape.

> Future, not v1: CV content as parsed structured fields (no file storage) -
> deliberately left out of this model until that feature is spec'd.

## Tech stack

- **Next.js 16 + React 19 + TypeScript + Tailwind v4** - web frontend
- **FastAPI (Python)** - backend API service
- **PostgreSQL** - persistent data store
- **Claude API** - generates tech/purpose keywords from GitHub README + metadata
- **Docker + docker-compose** - one container per service (web, backend, db),
  for local dev now and the EC2 target later
- **Custom auth** - backend-issued sessions/JWT, no third-party auth vendor
- **GitHub public API** - repo import, no OAuth in v1

## Monetization

Not in v1. Possible future subscription tier (premium themes, CV parsing, a
hosted multi-tenant option) once the core product is validated.

## UI/UX

At least 3 selectable style presets (e.g. minimal, bold, editorial), chosen
by the owner in profile settings; visitors always see whichever the owner
picked. Works both as a personal CV and as a browsable project showcase.

Screens implied by the features above (exact routes TBD per-feature):

- Public project browse/search
- Public profile/CV view
- Owner login
- Owner dashboard - edit profile, manage projects, trigger GitHub import,
  pick theme

## Deployment

- **Target:** self-hosted EC2 instance (not yet provisioned)
- **App type:** multi-container Docker Compose - web, backend, db
- **Build/start commands:** web uses `npm run build` / `npm run start`
  (already scaffolded); backend build/start commands land with feature 2
- **Anticipated env vars** (names to confirm when feature 2 is spec'd):
  `DATABASE_URL`, `ANTHROPIC_API_KEY`, a session/JWT signing secret
- **Storage:** PostgreSQL only; no file storage needed (CV files aren't
  persisted, and photos can start as a simple upload path)
- **Health check path, domain:** not decided yet

## Open questions

> TODO: exact routes/URL paths - left as screens above, to be finalized when
> each feature is spec'd.
>
> TODO: env var names are inferred from the chosen stack, not yet stated in
> `project-plan.md` - confirm during feature 2 (backend + database skeleton).
>
> TODO: health check path and domain, per `project-plan.md` §8 - decide
> before feature 8 (deployment readiness).
>
> TODO: HTTPS is a hard requirement for feature 8, not optional - the session
> cookie (feature 3a) is `secure: true` in production, and browsers silently
> refuse to store `Secure` cookies over plain HTTP. Without TLS configured,
> login will appear to succeed but the cookie never sets, and the app will
> look broken with no obvious cause. Confirm the TLS approach (reverse proxy,
> Let's Encrypt, etc.) as part of feature 8, not after.
>
> TODO: no account recovery path exists - single-tenant, no password reset.
> If the owner forgets their password there is currently no self-service way
> back in except direct database access. Decide explicitly before a real
> deployment: build a minimal recovery flow, or formally accept manual DB
> reset as the permanent answer.
