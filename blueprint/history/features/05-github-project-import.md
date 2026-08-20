# Feature: GitHub project import

**From build-plan:** feature 5
**Status:** complete

## Goal

Replace the homepage's static placeholder projects with the owner's real
GitHub repositories - fetched via GitHub's public API (no OAuth, per
`project-overview.md`), triggered on demand from `/dashboard`. This is the
headline feature: it's what makes the template reusable without manual data
entry.

## In scope

- A GitHub API client (`backend/app/github.py`): fetches a public user's
  repos, per-repo languages and topics, and a truncated README excerpt
- `POST /projects/import` - protected (owner-only), takes a GitHub username,
  upserts `Project` rows keyed by `github_repo` (create or update, never
  duplicate)
- `GET /projects` - public, returns all of the owner's projects as
  `ProjectOut[]`, matching the frontend's existing `Project` type
  field-for-field (the camelCase contract feature 2 flagged and left for
  "the endpoint that needs it" - this is that endpoint)
- An "Import from GitHub" control on `/dashboard` (username input, pre-filled
  by parsing `profile.githubUrl` when set), reporting how many projects were
  imported
- Rewiring the homepage to fetch `GET /projects` instead of importing
  `placeholderProjects` directly, with a distinct empty state for "nothing
  imported yet" vs. "no results for this search"
- Deleting `src/lib/placeholder-projects.ts` once nothing references it -
  dead code once the homepage no longer needs it

## Out of scope

- AI keyword generation (feature 6) - imported projects have empty
  `tech_keywords`/`purpose_keywords` until then; re-import must never wipe
  keywords feature 6 has already generated (see Notes)
- Removing `Project` rows for repos deleted or renamed on GitHub since the
  last import - re-import only creates/updates, never deletes. A stale
  entry just stops getting refreshed; accepted for v1, flagged rather than
  silently decided
- OAuth or a GitHub App - still the public API only, matching
  `project-overview.md`
- Pagination beyond the first page of repos - capped at the 15 most
  recently pushed, see Notes for why

## Build steps

- [x] **Step 1 - GitHub API client** - add `httpx` to
  `backend/requirements.txt` and `backend/app/github.py` exporting
  `fetch_github_repos(username: str) -> list[RepoData]` (a small dataclass
  or `TypedDict`: `github_repo`, `title`, `description`, `homepage_url`,
  `languages`, `topics`, `readme_excerpt`). Calls, per repo (capped at the
  15 most recently pushed, `sort=pushed&direction=desc`):
  `GET /users/{username}/repos` (list + topics + description + homepage),
  `GET /repos/{owner}/{repo}/languages` (top 5 by byte count), and
  `GET /repos/{owner}/{repo}/readme` (base64-decoded, truncated to 3000
  chars - a per-repo `404` here is common and non-fatal, just means no
  README; fall back to a `null` excerpt and keep processing the rest).
  Sends `Authorization: Bearer $GITHUB_TOKEN` when that env var is
  set (raises the rate limit from 60/hr to 5000/hr), otherwise unauthenticated.
  Raises a distinct, catchable error for "user not found" (GitHub 404) vs.
  "rate limited" (403/429) vs. network failure. *Done when:* run against a
  real, stable public account (e.g. `octocat`) via a `python -c` script,
  confirm it returns a non-empty list with populated languages/topics for
  at least one repo, and that a nonexistent username raises the
  not-found error distinctly from a rate-limit error.
- [x] **Step 2 - Import endpoint** - add `ProjectOut` (`CamelModel`: `id`,
  `title`, `description`, `homepageUrl`, `githubRepo`, `languages`,
  `topics`, `techKeywords`, `purposeKeywords` - matching
  `src/types/project.ts` exactly) and `ImportRequest`
  (`githubUsername: str = Field(min_length=1)`) to `backend/app/schemas.py`;
  add `backend/app/routers/projects.py` with `POST /projects/import`
  (`Depends(get_current_user)`: calls `fetch_github_repos`, upserts each
  result as a `Project` row scoped to `current_user.id` keyed by
  `github_repo` - on update, touch every field except `tech_keywords`/
  `purpose_keywords`, which only get set on first creation - sets
  `imported_at = now()`, returns `{"importedCount": int}`; translates the
  client's not-found/rate-limit/network errors into `404`/`429`/`502`
  with clear messages), wired into `main.py`. *Done when:* against a real
  account, `curl POST /projects/import` with a valid Bearer token and a
  real username returns the correct count and `psql` shows the rows;
  running it again with the same username updates rows in place (same ids,
  no duplicates); an invalid username returns `404`; no token returns `401`.
- [x] **Step 3 - Public projects endpoint** - add `GET /projects` (public,
  no auth) to `projects.py`, returning all `Project` rows for the (one)
  owner as `ProjectOut[]`. *Done when:* `curl GET /projects` (no auth)
  returns the rows created in step 2, camelCase, matching
  `src/types/project.ts`'s shape exactly.
- [x] **Step 4 - Dashboard import control** - add an "Import from GitHub"
  section to `/dashboard`: a text input for the GitHub username
  (`defaultValue` parsed from `profile.githubUrl` when set, e.g.
  `github.com/hadiabu` -> `hadiabu`), and `importProjectsAction` in
  `src/actions/auth.ts` (reads the session token via
  `requireSessionToken()`, `POST`s `/projects/import`, redirects to
  `/dashboard?imported=<count>` or `/dashboard?error=<message>`). *Done
  when, verified via Playwright against a real GitHub account:* submitting
  a valid username shows "Imported N projects."; submitting an invalid one
  shows a clear error; the username field is pre-filled when
  `profile.githubUrl` is already set.
- [x] **Step 5 - Homepage wiring + empty state + cleanup** - replace
  `page.tsx`'s `placeholderProjects` import with a `GET /projects` fetch
  (`cache: "no-store"`); when the result is empty, render a distinct "No
  projects imported yet" message (with a link to `/dashboard` for the
  owner) instead of handing an empty array to `ProjectBrowser` (which
  would otherwise show its "no results for this search" copy - wrong
  message for a genuinely empty catalog); delete
  `src/lib/placeholder-projects.ts` once nothing imports it. *Done when,
  verified via Playwright:* with 0 real projects, the homepage shows the
  distinct empty-catalog message; after step 4's import, the homepage
  shows the real imported projects, search still works over them, and
  `npm run build` passes with no dangling reference to the deleted file.
  Also updated `src/app/profile/page.tsx`'s "recent projects" summary,
  which also referenced the placeholder file and would have broken the
  build otherwise - caught while confirming nothing else referenced it.

## Files / areas

- `backend/app/github.py` (new)
- `backend/requirements.txt` (add `httpx`)
- `backend/app/schemas.py` (`ProjectOut`, `ImportRequest`)
- `backend/app/routers/projects.py` (new)
- `backend/app/main.py` (include the projects router)
- `src/actions/auth.ts` (add `importProjectsAction`)
- `src/app/dashboard/page.tsx` (import control)
- `src/app/page.tsx` (real data + empty-catalog state)
- `src/app/profile/page.tsx` (real data for "recent projects")
- `src/lib/placeholder-projects.ts` (deleted)
- `.env.example` (`GITHUB_TOKEN`, documented but missed until archiving)
- `docker-compose.yml` (`GITHUB_TOKEN` passthrough on the `backend` service)

## Data / contracts

- `ProjectOut` mirrors `src/types/project.ts`'s `Project` interface
  field-for-field - **load-bearing**: this is the contract feature 1's
  frontend type anticipated and feature 2 deferred; feature 6 (AI
  keywords) will `PATCH` the same rows' `tech_keywords`/`purpose_keywords`
  later, not redefine this shape.
- Upsert key: `(user_id, github_repo)`. Re-import is idempotent and must
  never touch `tech_keywords`/`purpose_keywords` on an update - only set
  on first creation (empty arrays, per the existing model default) so
  feature 6's future work survives a re-sync.
- No change to the `Project` SQLAlchemy model or its migration - all
  columns needed already exist from feature 2.

## Testing

- No backend or frontend test runner is configured yet, so the automated
  gate stayed off. Verified with a real GitHub account (`HadiAbu`) via
  `python -c`/`curl` (steps 1-3) and Playwright (steps 4-5), including a
  real GitHub rate-limit hit mid-session that proved the `429` path for
  real, and re-import idempotency confirmed via identical row ids before
  and after a second import.
- Flagging for later, not built now: the upsert key logic and the
  not-found/rate-limit/network error translation in `github.py` are pure,
  mockable logic - good pytest candidates once a runner exists, joining
  the growing list from every feature since 2.

## Notes for the AI

- The 15-repo cap and top-5-languages cap exist mainly to protect GitHub's
  unauthenticated rate limit (60 requests/hour - each repo costs 2 extra
  calls beyond the initial list, so an uncapped import against a
  many-repo account could exhaust the budget in one run). `GITHUB_TOKEN`
  is optional and raises the ceiling to 5000/hour - documented in
  `.env.example` and passed through `docker-compose.yml`.
- Re-import must preserve `tech_keywords`/`purpose_keywords` on existing
  rows. This is the one field-level exception to "touch every field on
  update" - get it wrong and feature 6's AI-generated keywords get wiped
  on every re-sync.
- The GitHub username parser in `dashboard/page.tsx` strips
  `https://github.com/`, trailing slash, and any path beyond the username
  - don't assume `profile.githubUrl` is always a clean bare username.
- `src/lib/search-projects.ts` and `ProjectBrowser`/`ProjectCard` needed no
  changes - they already operate generically over `Project[]` regardless
  of source, per feature 1's original design.
- Any page that pulls project data should fetch `GET /projects`, never
  import a placeholder file directly - `placeholder-projects.ts` is gone
  and both consumers (`page.tsx`, `profile/page.tsx`) had to be updated
  together when it was removed.

## Findings

_No findings were recorded against this feature._
