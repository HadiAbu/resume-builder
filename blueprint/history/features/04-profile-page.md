# Feature: Profile page

**From build-plan:** feature 4
**Status:** complete

## Goal

Give the owner a real editable profile (replacing 3c's `/dashboard` stub, as
that feature's spec already flagged), and give visitors a public CV-style
page to read it - matching `prototypes/profile.html`, this feature's locked
design reference. Expands the `User` data model (already updated in
`project-overview.md`) to carry the fields the mockup needs: `role`,
`github_url`, `linkedin_url`, `skills`.

## Design reference

`prototypes/profile.html` (locked back at feature 1's `/prototype` run,
reserved for this feature) is the visual target for the public `/profile`
page: avatar/photo, name, role line, contact links, bio, skills tags, and a
"recent projects" summary linking back to the homepage. `prototypes/theme.css`
tokens are already ported into `globals.css` - no new porting step needed,
just match the mockup's layout and spacing with existing tokens.

## In scope

- `User` migration adding `role`, `github_url`, `linkedin_url` (all nullable
  strings) and `skills` (string array, default empty) - the model fields
  already added to `project-overview.md`
- `GET /profile` - public, no auth, returns the owner's current profile
- `PATCH /profile` - protected (`get_current_user`), updates display name,
  bio, role, links, skills, and optionally the photo
- `/dashboard` becomes the real owner edit form (pre-filled via
  `GET /profile`, saved via `PATCH /profile`) - replacing 3c's stub, not
  adding a second protected page
- `/profile` - new public page rendering the owner's profile per the mockup,
  including a small "recent projects" summary reusing the existing
  placeholder project data (no new data source)
- Photo upload as a base64 data URI stored directly in `photo_url` - matches
  `project-overview.md`'s Deployment section ("PostgreSQL only; no file
  storage needed... photos can start as a simple upload path"), capped at
  2MB to keep the column and page weight sane
- A persistent "Profile" link in the homepage header, visible regardless of
  login state - closes the gap between the locked prototype's nav (which
  always showed both "Profile" and the auth link) and the current header,
  which only shows auth-state-dependent links

## Out of scope

- GitHub project import (feature 5) - the "recent projects" summary reuses
  today's placeholder data, not real repos
- Any further data model fields beyond `role`/`github_url`/`linkedin_url`/
  `skills` - if the mockup needs something else later, that's a new,
  explicit decision, not silent scope growth
- Theme switching - `theme` exists on `User` but picking it is feature 7
- Client-side image cropping/resizing - a plain file input, capped by size
  and type, no editing UI

## Build steps

- [x] **Step 1 - Migration: expand `User`** - add `role: Mapped[str | None]`,
  `github_url: Mapped[str | None]`, `linkedin_url: Mapped[str | None]`, and
  `skills: Mapped[list[str]]` (`ARRAY(String)`, `default=list`, matching the
  existing `Project` array-column pattern) to `backend/app/db/models.py`,
  then generate and apply the Alembic migration. *Done when:*
  `alembic upgrade head` applies cleanly against the running `db`, and
  `docker compose exec db psql ... -c '\d users'` shows all four new
  columns with the right types.
- [x] **Step 2 - Profile endpoints** - add `ProfileOut` (`CamelModel`:
  `id`, `email`, `displayName`, `bio`, `photoUrl`, `role`, `githubUrl`,
  `linkedinUrl`, `skills`) and `ProfileUpdateRequest`
  (`displayName: str = Field(min_length=1)`, `bio: str | None`,
  `role: str | None`, `githubUrl: str | None`, `linkedinUrl: str | None`,
  `skills: list[str]`, `photoUrl: str | None` -
  `Field(max_length=2_800_000)` on `photoUrl`, roughly bounding a 2MB
  image once base64-encoded) to `backend/app/schemas.py`, and add
  `backend/app/routers/profile.py` (`GET /profile` - public, loads the
  one `User` row - and `PATCH /profile` - `Depends(get_current_user)`,
  updates the row, omits `photo_url` from the update when the request's
  `photoUrl` is `None` so an edit without a new photo doesn't clear the
  existing one), wired into `main.py`. *Done when:* `curl GET /profile`
  (no auth) returns the current owner's data; `curl PATCH /profile` with a
  valid Bearer token updates and returns the new values; the same call
  without a token returns `401`; a request with an oversized `photoUrl`
  string returns `422`.
- [x] **Step 3 - Owner edit page** - replace `/dashboard`'s stub content
  with a real edit form (server component, pre-filled from `GET /profile`):
  text inputs for display name, role, bio, GitHub URL, LinkedIn URL, a
  comma-separated skills input, and a photo file input; add
  `updateProfileAction` to `src/actions/auth.ts` (reads the session token -
  via a new `requireSessionToken()` in `src/lib/session.ts` - reads the
  uploaded photo via `file.arrayBuffer()` into a base64 data URI when one
  is provided, rejecting with a clear error if it's over 2MB or its `type`
  isn't `image/*`, otherwise `PATCH`s
  the backend with the Bearer token, redirects back to `/dashboard?updated=1`
  on success or `/dashboard?error=<message>` on failure); bump
  `next.config.ts`'s `experimental.serverActions.bodySizeLimit` to `'4mb'`
  so the multipart upload isn't rejected before it reaches the action.
  *Done when, verified via Playwright:* the form shows current values;
  changing fields and saving persists them (confirmed by reloading and
  re-fetching); uploading a photo under 2MB updates it (confirmed via
  `psql` that `photo_url` now starts with `data:image/`); an oversized or
  non-image file shows a clear error instead of silently failing or
  crashing.
- [x] **Step 4 - Public profile page** - add `src/app/profile/page.tsx`
  (server component, fetches `GET /profile`, no auth): avatar/photo, name,
  role, GitHub/LinkedIn/email links, bio, skills tags, and a compact
  "recent projects" summary (first 3 entries from
  `placeholderProjects`, matching `prototypes/profile.html`'s
  `.project-row` style, linking back to `/`) - styled with existing theme
  tokens per the mockup. *Done when, verified via Playwright:* visiting
  `/profile` while logged out shows the values saved in step 3, matching
  the mockup's layout.
- [x] **Step 5 - Homepage "Profile" link** - add a persistent "Profile"
  link to `/profile` in `src/app/page.tsx`'s header, shown in every state
  (setup / signed-out / signed-in) alongside the existing auth-dependent
  control - matches `prototypes/home.html`'s original nav design (`Profile`
  + the auth link, always both visible). *Done when:* the homepage shows a
  working "Profile" link regardless of login state, confirmed via
  Playwright in at least the logged-out case.
- [x] **Step 6 - Fix: `/profile` crashes before any owner exists** - `GET
  /profile` correctly returns `404` when no `User` row exists yet, but
  `src/app/profile/page.tsx` never checks `res.ok` before casting the
  response body to `ProfileData`, so `getInitials(undefined)` throws.
  Check `res.ok` and render a friendly "This profile hasn't been set up
  yet" message (matching `/login`'s and `/signup`'s existing tone for the
  same "no owner yet" state) instead of crashing. *Done when, verified via
  Playwright:* with no owner in the database, `/profile` shows the message
  instead of erroring; with an owner present, the page renders normally as
  before (no regression). Found during a post-build reflection pass, not
  `/audit` - added mid-implementation and fixed on the same branch since
  the buggy code hadn't merged yet.

## Files / areas

- `backend/app/db/models.py` (extend `User`)
- `backend/migrations/versions/` (new migration)
- `backend/app/schemas.py` (`ProfileOut`, `ProfileUpdateRequest`)
- `backend/app/routers/profile.py` (new)
- `backend/app/main.py` (include the profile router)
- `src/lib/session.ts` (add `requireSessionToken()`)
- `src/actions/auth.ts` (add `updateProfileAction`)
- `src/app/dashboard/page.tsx` (replace stub with the real edit form)
- `src/app/profile/page.tsx` (new)
- `src/app/page.tsx` (persistent "Profile" link)
- `next.config.ts` (`serverActions.bodySizeLimit`)

## Data / contracts

- `User` gains `role`, `github_url`, `linkedin_url` (nullable strings) and
  `skills` (string array, default empty) - already reflected in
  `project-overview.md`.
- `ProfileOut` is the one shape both the public `/profile` page and the
  owner edit form's prefill consume - **load-bearing**: any future feature
  reading profile data should reuse this schema, not invent a second one.
- Photo storage stays a base64 data URI in the existing `photo_url` text
  column - no new storage infrastructure, per `project-overview.md`'s
  already-decided approach.

## Testing

- No backend or frontend test runner is configured yet, so the automated
  gate stayed off. Verified with `curl`/`psql` (steps 1-2, 6 - including a
  full backup/delete/restore of the real owner row to safely test the
  no-owner-yet state without any data loss) and Playwright (steps 3-5).
- Flagging for later, not built now: the skills comma-split/trim logic and
  the photo size/type validation in `updateProfileAction` are pure,
  assertable logic - good candidates once a frontend test runner exists,
  joining the list from 3a/3b/3c.

## Notes for the AI

- Apply Tailwind's `capitalize` class only to `displayName` (a name, where
  per-word title-casing is correct), not to `role` or `bio` - those are
  freeform sentences where forcing every word to a capital would look
  wrong (e.g. "Full-Stack Developer - Fastapi, React, Kubernetes"). This
  mirrors the distinction already made in 3c.
- `PATCH /profile`'s partial-photo semantics matter: the request always
  resends `displayName`/`bio`/`role`/links/`skills` (the form always has
  values for these), but `photoUrl` is only present when a *new* photo was
  uploaded. Treat `photoUrl: None` as "don't touch the existing photo," not
  "clear it."
- `requireSessionToken()` is a sibling to 3c's `getCurrentUser()`/
  `requireCurrentUser()` - it exists because `updateProfileAction` needs
  the raw Bearer token to call the backend, not just the parsed user.
- Any page that calls `GET /profile` without an auth gate must check
  `res.ok` before treating the body as `ProfileData` - the no-owner-yet
  `404` is a real, reachable state on `/profile`, not just theoretical.
- Migration gotcha worth remembering: adding a `NOT NULL` array column via
  Alembic autogenerate needs an explicit `server_default` when the table
  already has rows, or the migration fails. Autogenerate doesn't add this
  automatically - caught and fixed in step 1's review.

## Findings

_No findings were recorded against this feature._
