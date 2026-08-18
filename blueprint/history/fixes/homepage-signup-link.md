# Fix: Homepage has no link to the signup page

**Type:** Fix
**Status:** complete

## The problem

`src/app/page.tsx`'s header (`src/app/page.tsx:7-11`) renders only a brand
mark - no navigation at all. This was a deliberate call in feature 1's spec
("no nav links yet, since sign-in and the profile page don't exist until
features 3-4"), but feature 3a just built a working `/signup` page and
nothing on the homepage links to it. A first-time visitor (the owner, on
first run) has no way to discover it except by knowing the URL.

## The fix

Add a conditional link in the homepage header to `/signup`, shown only while
`GET /auth/setup-status` reports `needsSetup: true` - the same check
`/signup` itself already performs, so the two pages never disagree. Once an
owner exists, hide the link again: there's no login page yet to send
visitors to instead (that's 3b's job), so a dead link would be worse than no
link.

This is the third place that needs `BACKEND_URL` (after `src/actions/auth.ts`
and `src/app/signup/page.tsx`), so pull it into a small shared constant
(`src/lib/backend.ts`) instead of duplicating the same fallback a third time.

Must not touch: `ProjectBrowser`/search behavior, the signup flow itself, or
add a "Sign in" link (premature - 3b doesn't exist yet).

## Build steps

- [x] **Step 1 - Shared BACKEND_URL + homepage signup link** - add
  `src/lib/backend.ts` exporting `BACKEND_URL` (`process.env.BACKEND_URL ??
  "http://localhost:8000"`), update `src/actions/auth.ts` and
  `src/app/signup/page.tsx` to import it instead of redefining it, make
  `Home` (`src/app/page.tsx`) an async server component that fetches `GET
  /auth/setup-status` (`cache: "no-store"`, same as the signup page), and
  render a "Set up owner account" link to `/signup` in the header when
  `needsSetup` is true, nothing extra otherwise. *Done when:* with no owner
  in the database, the homepage shows the link and clicking it reaches the
  working signup form; after creating the owner account, reloading the
  homepage shows no link; `npm run build` passes.

## Verify

- Reset the local dev database to no owner (`docker compose exec db psql -U
  resume_builder -d resume_builder -c "DELETE FROM users;"`), reload `/`,
  confirm the link is visible and routes to `/signup`.
- Complete signup, reload `/`, confirm the link is gone.
- `npm run build` and `npm run lint` both pass.

Verified via Playwright against the real `docker compose` stack: link
visible with no owner, `/url: /signup` confirmed, clicked through to the
working form, completed signup, redirected to `/`, link gone on reload.
`npm run build` (typecheck) and `npm run lint` both passed clean.
