# Project Plan

> One of the two planning docs you provide. Answer each section in a line or two
> (a worksheet, not an essay). Draft it yourself or let the AI help you expand and
> sharpen it; either way, the content is yours to direct. When it's filled in, run
> `/overview` to generate the project overview from this plus `build-plan.md`.

## 1. Problem - What problem are we solving?

Static portfolios/CVs don't surface what a project actually does or which
skills it demonstrates, and are a pain to keep current. This is both a living
online CV for the owner and a reusable template other developers can deploy
to organize and showcase their own GitHub projects.

## 2. Users - Who is this for?

Two audiences per deployment: the owner (a developer who deploys their own
instance, logs in to manage their profile and projects) and recruiters/
visitors (public, unauthenticated, browsing and searching projects).

## 3. Features - What does the MVP need?

- Search projects by keyword (tech used, what the project does)
- GitHub import: pull the owner's public repos (README, languages, topics)
- AI-generated tech/purpose keywords per project via the Claude API
- Profile page: owner uploads personal details and a photo
- Owner authentication (custom backend login) separate from public visitors
- 3+ selectable UI theme presets, chosen by the owner in profile settings

Out of scope for v1: CV upload/scan-to-display (fast-follow), subscriptions,
multi-tenant signup (each deployment has one owner for now).

## 4. Data - What are we storing?

- Users (owner account): credentials, profile details, photo, selected theme
- Projects: title, description, links, GitHub repo reference, tech keywords,
  purpose keywords, imported metadata (languages, topics)
- (Future) CV content: parsed structured fields only, not the uploaded file

## 5. Tech - What stack are we using?

- Frontend: Next.js 16 + React 19 + TypeScript + Tailwind v4
- Backend: FastAPI (Python), separate API service
- Database: PostgreSQL
- AI: Claude API for keyword/summary generation from GitHub data
- Each service (web, backend, db) runs in its own Docker container, via
  docker-compose for local development
- Auth: custom, backend-issued sessions/JWT, no third-party auth vendor
- GitHub integration: public API only (no OAuth) in v1

## 6. Monetize - How will this make money?

Not in v1. Possible future subscription tier (premium themes, CV parsing,
hosted multi-tenant option) once the core product is validated.

## 7. UI/UX - How should this look and feel?

At least 3 selectable style presets (e.g. minimal, bold, editorial), chosen
by the owner in profile settings; visitors see whichever the owner picked.
Should work well both as a personal CV and as a browsable project showcase.

## 8. Deployment - Where and how will this ship?

Target: self-hosted on an EC2 instance eventually (not yet). Dockerized per
service (web, backend, db) via docker-compose for now. CI/CD via GitHub
Actions to be set up after core development is done, not in v1.
