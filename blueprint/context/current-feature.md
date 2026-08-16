# Feature: Project browse/search UI

**From build-plan:** feature 1
**Status:** not started

## Goal

A visitor can browse the owner's projects and filter them by keyword (tech
used, what the project does) on the homepage. Built against placeholder data
now; feature 5 (GitHub import) later swaps the placeholder for real projects
without changing this UI.

## Design reference

`/prototype` locked the look after this spec was first drafted. Build against:

- `prototypes/theme.css` - the token source (minimal, dark-first, teal accent,
  Inter/JetBrains Mono). Ports into `src/app/globals.css`'s `@theme` block as
  this feature's new Step 3, before the visual components are built.
- `prototypes/home.html` - the primary mockup for this feature: search bar,
  project card grid, and the empty-results state (toggle in the mockup).

`prototypes/profile.html` is reference for feature 4 (profile page), not this
one.

## In scope

- A `Project` type and a small set of placeholder projects shaped like the
  future API response (title, description, languages, topics, tech/purpose
  keywords)
- A pure, case-insensitive search/filter function over that shape
- A project card showing title, description, and keyword/language tags
- A search input wired to live-filter the visible project list
- An empty state when no project matches the query
- Wiring this into the homepage (`/`), replacing the default create-next-app
  content

## Out of scope

- Real data - GitHub import (feature 5) and the backend/API (feature 2)
- Auth, profile page, themes (features 2-7)
- Pagination or sorting (small placeholder dataset, defer until it matters)
- Persisted/URL-synced search state (defer unless a later feature needs deep links)

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - Project type + placeholder data** - add `src/types/project.ts`
  (the `Project` shape: id, title, description, homepageUrl, githubRepo,
  languages, topics, techKeywords, purposeKeywords) and
  `src/lib/placeholder-projects.ts` (6-8 mock projects, including one with
  empty keyword arrays and one with a long description, to exercise edge
  cases later). *Done when:* both files typecheck and `npm run build` passes.
- [x] **Step 2 - Pure search filter** - add `src/lib/search-projects.ts`
  exporting `searchProjects(projects: Project[], query: string): Project[]`,
  matching case-insensitively against title, description, languages, topics,
  and both keyword arrays; an empty/whitespace query returns all projects
  unchanged. *Done when:* the function is pure (no side effects, no
  component state) and manually verified against a few placeholder queries
  (a tech keyword, a purpose keyword, a no-match string, an empty string).
- [x] **Step 3 - Port theme tokens into globals.css** - replace the default
  create-next-app theme block in `src/app/globals.css` with the palette from
  `prototypes/theme.css` (bg, surface, surface-hover, border, text, muted,
  faint, accent, accent-ink, accent-muted, tag-bg/border/text, font-sans,
  font-mono, radius, radius-sm) as Tailwind v4 `@theme inline` tokens. This
  theme is dark-only for now (no light variant defined in the prototype) -
  drop the existing `prefers-color-scheme` toggle rather than half-porting
  it; a light/alternate preset is feature 7's job. *Done when:* the
  (still-default) homepage renders with the dark background and teal accent
  instead of the create-next-app default, verified via screenshot, and `npm
  run build` passes.
- [x] **Step 4 - ProjectCard component** - add
  `src/components/projects/ProjectCard.tsx` (server component, props-only),
  styled to match the card markup in `prototypes/home.html` (surface
  background, border, title, description, tag row), rendering
  languages/keywords as tags; renders cleanly with no tags when the arrays
  are empty. *Done when:* it renders correctly for both a fully-populated
  placeholder project and the empty-keywords one, matching the mockup,
  verified via screenshot.
- [x] **Step 5 - ProjectBrowser client component** - add
  `src/components/projects/ProjectBrowser.tsx` (`'use client'`), taking
  `projects: Project[]` as a prop, holding the search query in state, calling
  `searchProjects` on change, rendering the search bar and card grid styled
  per `prototypes/home.html`, and an empty state ("No projects match your
  search") matching the mockup's empty-results state when the filtered list
  is empty. *Done when:* typing in the input live-filters the visible cards
  and an unmatched query shows the empty state, verified via
  screenshot/dev server.
- [x] **Step 6 - Wire into the homepage** - replace the default
  create-next-app content in `src/app/page.tsx` with a page header (brand
  mark only - no nav links yet, since sign-in and the profile page don't
  exist until features 3-4) followed by
  `<ProjectBrowser projects={placeholderProjects} />` (page stays a server
  component; it just passes the placeholder data down), and update the
  `metadata` title/description in `src/app/layout.tsx` away from "Create Next
  App". *Done when:* `npm run dev` shows the full placeholder project list on
  `/` by default, styled per the mockup, search filters it live, and `npm run
  build` passes.

## Files / areas

- `src/types/project.ts` (new)
- `src/lib/placeholder-projects.ts` (new)
- `src/lib/search-projects.ts` (new)
- `src/components/projects/ProjectCard.tsx` (new)
- `src/components/projects/ProjectBrowser.tsx` (new)
- `src/app/page.tsx` (replace default content)
- `src/app/layout.tsx` (metadata only)
- `src/app/globals.css` (theme tokens ported from `prototypes/theme.css`)

## Data / contracts

- `Project` (frontend shape, mirrors the future API response):
  `id`, `title`, `description`, `homepageUrl`, `githubRepo`, `languages:
  string[]`, `topics: string[]`, `techKeywords: string[]`,
  `purposeKeywords: string[]`.
- **Load-bearing:** this shape anticipates the Postgres `Project` model in
  `project-overview.md`. Feature 2 (backend skeleton) and feature 5 (GitHub
  import) must produce API data matching these field names, or this type
  needs an explicit, reviewed update at that point.

## Testing

- No test runner is configured yet (`AGENTS.md` has no `test` command), so
  the automated test gate is off for this feature. Verify with `npm run
  build` (typecheck + build) and browser/dev-server screenshots per step.
- `searchProjects` (step 2) is pure logic and a good candidate for a unit
  test once `/tests` is run - flagging it now so it's not forgotten later,
  not building it in this feature.

## Notes for the AI

- `ProjectBrowser` is a client component (`'use client'`) for the search
  state; `page.tsx` and `ProjectCard` stay server components - no
  interactivity needed there.
- Use Tailwind v4's CSS-first `@theme` convention when porting
  `prototypes/theme.css` in Step 3. The prototype is dark-only (no light
  variant), so this feature ships a single dark theme rather than a
  `prefers-color-scheme` toggle - multiple/light presets are feature 7.
- Keep tag rendering resilient to empty `languages`/`topics`/keyword arrays -
  no broken layout, no stray separators.
- Field names in `src/types/project.ts` are camelCase per
  `coding-standards.md`; the eventual FastAPI response will need to map to
  this shape (or this type gets revisited) - don't silently rename fields in
  a later feature without updating this contract.
