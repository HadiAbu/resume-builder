# Feature: Route protection

**From build-plan:** feature 3c
**Status:** complete

## Goal

Give the app a reusable way to gate a route to the logged-in owner only,
apply it to one representative protected page, and let the owner sign out.
This is the last piece of owner authentication (3a signup, 3b login, 3c
here) - no backend work is needed, since 3b already built and proved
`GET /auth/me` as the verification primitive. This feature is purely about
wiring the Next.js side to actually use it.

## In scope

- `src/lib/session.ts` - `getCurrentUser()` (reads the `session` cookie,
  forwards it as `Authorization: Bearer` to `GET /auth/me`, returns the user
  or `null` - never throws, treats a missing cookie, an invalid/expired
  token, and a network failure identically as "not logged in") and
  `requireCurrentUser()` (calls `getCurrentUser()`, redirects to `/login` if
  `null`, otherwise returns the user) - the reusable guard feature 4's real
  profile page will call the same way
- `/dashboard` - a minimal protected stub page calling
  `requireCurrentUser()`, showing the logged-in owner's name/email and a
  sign-out control
- `signOutAction` - clears the `session` cookie, redirects to `/`
- Homepage session-awareness: the header now reflects whether *this
  visitor* is logged in (`Sign out` + a link to `/dashboard`), not just
  whether an owner account exists (`Sign in` / `Set up owner account`)

## Out of scope

- Feature 4's real profile page - `/dashboard` is a throwaway stub whose
  only job is proving the guard works; feature 4 replaces or extends it
- Next.js Middleware / edge-level gating - a server-component-level guard
  matches every other page in this app and needs no new infrastructure
- Refreshing or rotating the session on activity - unchanged from 3a/3b,
  still one 7-day token
- Proactively clearing a stale (expired/invalid) cookie when
  `requireCurrentUser` redirects - harmless to leave it, since an expired
  JWT can never authenticate again regardless; a fresh login just
  overwrites it

## Build steps

- [x] **Step 1 - Session helpers + protected stub page** - add
  `src/lib/session.ts` exporting `getCurrentUser()` (reads the `session`
  cookie via `cookies()`; if absent, returns `null`; otherwise `fetch`es
  `${BACKEND_URL}/auth/me` with `Authorization: Bearer <token>` inside a
  `try/catch` - any non-`200` or thrown error also returns `null`, never
  propagates) and `requireCurrentUser()` (awaits `getCurrentUser()`,
  `redirect('/login')` if `null`, otherwise returns the user), and add
  `src/app/dashboard/page.tsx` (server component: `const user = await
  requireCurrentUser()`, then renders the user's `displayName`/`email`).
  *Done when, verified via Playwright:* visiting `/dashboard` with no
  `session` cookie redirects to `/login`; visiting it with a valid cookie
  (from a real login) shows the correct owner's name and email.
- [x] **Step 2 - Sign-out** - add `signOutAction` to `src/actions/auth.ts`
  (deletes the `session` cookie, `redirect('/')`), and add a "Sign out"
  button (`<form action={signOutAction}>`) to `/dashboard`. *Done when,
  verified via Playwright:* while logged in, clicking sign-out on
  `/dashboard` clears the cookie and redirects to `/`; visiting
  `/dashboard` again afterward redirects to `/login` - proving the session
  is actually gone, not just hidden in the UI.
- [x] **Step 3 - Homepage session-awareness** - in `src/app/page.tsx`,
  replace the `needsSetup`-only header logic with three states using
  `getCurrentUser()`: no owner yet -> "Set up owner account" (unchanged);
  owner exists but this visitor isn't logged in -> "Sign in" (unchanged);
  this visitor is logged in -> a link to `/dashboard` plus a "Sign out"
  control (`signOutAction`, same as step 2). *Done when, verified via
  Playwright:* logged out with an owner existing, homepage shows "Sign in";
  after logging in, homepage shows the dashboard link and "Sign out";
  clicking sign-out from the homepage returns to the logged-out state.

## Files / areas

- `src/lib/session.ts` (new)
- `src/app/dashboard/page.tsx` (new)
- `src/actions/auth.ts` (add `signOutAction`)
- `src/app/page.tsx` (three-state header)

## Data / contracts

- `getCurrentUser()` / `requireCurrentUser()` are the reusable session-check
  primitives for every future protected page - **load-bearing for feature
  4** (the real profile page calls `requireCurrentUser()` the same way
  `/dashboard` does here, not a new mechanism).
- No new backend routes or schemas - this feature only consumes 3b's
  already-built and already-verified `GET /auth/me`.

## Testing

- No backend or frontend test runner is configured yet, so the automated
  gate stayed off. Verified every step with Playwright against
  `docker compose up`, using real request flows: generated tokens for the
  real owner account (no password needed, no DB writes) to exercise
  logged-in states, and confirmed sign-out actually invalidates the
  session (re-visiting `/dashboard` afterward redirects again, not just
  UI-hidden).
- Flagging for later, not built now: `getCurrentUser`'s three collapse-to-
  null branches (no cookie, backend says invalid, network failure) are
  pure-ish logic once the `fetch` is injected/mocked - a good pytest/vitest
  candidate whenever a frontend test runner exists, joining the list from
  3a/3b/feature 2.

## Notes for the AI

- `getCurrentUser()` must never throw - every failure mode (no cookie,
  expired token, backend unreachable) collapses to `null`. A route guard
  that can crash the page it's supposed to protect is worse than no guard.
- `signOutAction`'s cookie deletion must match the exact `path: '/'` used
  when the cookie was set in `signupAction`/`loginAction`, or the delete
  silently won't take effect.
- Display `displayName` with Tailwind's `capitalize` class wherever it's
  rendered (dashboard's "Welcome, {name}" and the homepage greeting) - a
  display-only fix (first letter of each word), not a rewrite of the
  stored value. Added mid-implementation per user feedback.
- Discussed mid-implementation and deferred, not part of this feature: a
  Redis-backed session store. Current scope (single-tenant, low traffic)
  doesn't need it - JWT verification already satisfies
  `project-overview.md`'s tech stack decision, and Redis would be new
  infrastructure with no problem it solves yet. The one real gap
  (sign-out only clears the browser cookie; a leaked JWT stays valid until
  its natural 7-day expiry) has a lighter fix: a `token_version` column on
  `User`, embedded in the JWT and checked in `get_current_user`. Not yet
  scheduled as a build-plan item - raise it via `/feature` or `/fix` when
  ready.

## Findings

_No findings were recorded against this feature._
