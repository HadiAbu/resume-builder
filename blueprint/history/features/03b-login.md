# Feature: Login

**From build-plan:** feature 3b
**Status:** complete

## Goal

Let the owner sign back in after 3a's signup, using the exact same
JWT/cookie contracts 3a already locked in. This also gives the backend a
proven way to verify "is this JWT still valid, and whose is it" - the
concrete building block 3c (route protection) will apply to gate real pages.

## In scope

- `backend/app/dependencies.py`'s `get_current_user` - a FastAPI dependency
  that reads an `Authorization: Bearer <token>` header, decodes it via 3a's
  `decode_access_token`, and loads the matching `User` (or raises `401`)
- `GET /auth/me` - protected by `get_current_user`, proves verification
  works end-to-end
- `POST /auth/login` - email + password against the stored bcrypt hash,
  issues a session token on success, generic `401` on any failure (wrong
  email or wrong password look identical to the caller - no user
  enumeration)
- Renaming `SignupResponse` to `AuthResponse` (backend) since login returns
  the exact same `{token, user}` shape - one schema, not two identical ones
- A `/login` page and `loginAction` Server Action, mirroring 3a's signup
  page/action exactly (same cookie name, shape, and expiry)
- Closing the gap the homepage fix explicitly deferred: showing a "Sign in"
  link in the homepage header once an owner exists (complementing the
  existing "Set up owner account" link that shows before one does)

## Out of scope

- Route protection itself, sign-out, and the protected stub page - that's
  3c. This feature proves login and verification work; nothing gates access
  with them yet
- Password reset - not in the v1 plan
- Rate limiting / lockout on `/auth/login` - unlike signup, this endpoint
  doesn't self-disable, so it's a real repeatable attack surface. Accepted
  as out of scope for a single-tenant, low-traffic v1, but flagged here
  rather than silently ignored - worth revisiting (backoff or lockout)
  before any real internet-facing deployment (feature 8)
- Refresh tokens - unchanged from 3a's reasoning, still a single long-lived
  JWT

## Build steps

- [x] **Step 1 - JWT verification: `get_current_user` + `GET /auth/me`** - add
  `backend/app/dependencies.py` exporting `get_current_user` (a FastAPI
  `Depends`-compatible function: reads the `Authorization` header, expects
  `Bearer <token>`, decodes via `security.decode_access_token`, loads the
  `User` by the `sub` id, raises `401` on a missing header, bad scheme,
  invalid/expired token, or a user id that no longer exists), and add
  `GET /auth/me` to `backend/app/routers/auth.py` (`Depends(get_current_user)`,
  returns `UserOut`). *Done when:* against the running backend, calling
  `/auth/me` with a valid token (from an existing signup) returns `200` and
  the right user; with no header, a malformed header, and a tampered token
  each returns `401` - all confirmed via `curl`.
- [x] **Step 2 - Login endpoint** - rename `SignupResponse` to `AuthResponse`
  in `backend/app/schemas.py` (update the one place it's used in
  `routers/auth.py`), add `LoginRequest` (`email: EmailStr`, `password:
  str`), and add `POST /auth/login` to `routers/auth.py`: looks up the
  `User` by email, calls `verify_password`; on success issues a token via
  `create_access_token` and returns `AuthResponse`; on any failure (no such
  email, or wrong password) returns `401` with the same generic detail
  message either way. *Done when:* against a real signed-up owner, correct
  credentials return `200` with a token that also works against
  `GET /auth/me`; wrong password and a nonexistent email both return `401`
  with an identical error body.
- [x] **Step 3 - Login page + Server Action** - add `loginAction` to
  `src/actions/auth.ts` (POSTs to `${BACKEND_URL}/auth/login`, same
  httpOnly `session` cookie shape as `signupAction` - name, `secure` in
  production, `sameSite: 'lax'`, 7-day `maxAge` - on success redirects to
  `/`, on failure redirects to `/login?error=<message>`), and add
  `src/app/login/page.tsx` (server component: if `GET /auth/setup-status`
  reports `needsSetup: true`, show a message pointing at `/signup` instead
  of a form - there's no owner to log in as yet; otherwise render the
  email/password form, `action={loginAction}`, reading `searchParams.error`
  for failures), styled with the same tokens/layout as `/signup`. *Done
  when, verified via Playwright against `docker compose up`:* with an owner
  already signed up, `/login` shows the form; correct credentials redirect
  to `/` with the `session` cookie set; wrong credentials show the error
  message and keep the form; visiting `/login` with no owner yet shows the
  "go to /signup" message instead of a form.
- [x] **Step 4 - Homepage "Sign in" link** - in `src/app/page.tsx`, add a
  "Sign in" link to `/login` in the header when `needsSetup` is `false`
  (alongside the existing "Set up owner account" link that shows when it's
  `true` - exactly one of the two is ever visible). *Done when:* with an
  owner signed up, the homepage shows "Sign in" (not the setup link) and it
  routes to a working `/login`; with no owner, it shows the setup link as
  before (unchanged from the earlier fix).

## Files / areas

- `backend/app/dependencies.py` (new)
- `backend/app/routers/auth.py` (add `GET /auth/me`, `POST /auth/login`)
- `backend/app/schemas.py` (`SignupResponse` renamed to `AuthResponse`, add
  `LoginRequest`)
- `src/actions/auth.ts` (add `loginAction`)
- `src/app/login/page.tsx` (new)
- `src/app/page.tsx` (conditional "Sign in" link)

## Data / contracts

- **Load-bearing for 3c:** `get_current_user` (step 1) is the verification
  primitive 3c's route protection will call the same way - via a
  `GET /auth/me`-style check, since the JWT signing secret
  (`SESSION_SECRET`) lives only in the backend. Next.js can never verify
  the token itself; it must always ask the backend. 3c's Next.js-side
  guard should read the `session` cookie, forward it as an
  `Authorization: Bearer` header to `GET /auth/me` (or an equivalent), and
  treat any non-`200` as "not logged in."
- `AuthResponse` (renamed from `SignupResponse`) - `{token, user: {id,
  email, displayName}}` - now shared by both `/auth/signup` and
  `/auth/login`.
- `LoginRequest` - `{email, password}`.
- Cookie contract unchanged from 3a: name `session`, httpOnly, `secure` in
  production, `sameSite: 'lax'`, 7-day `maxAge`, holds the raw JWT.

## Testing

- No backend or frontend test runner is configured yet, so the automated
  gate stayed off. Verified with `curl` against the real running services
  (steps 1-2, including a temporary isolated test-user row for login so the
  real owner account was never touched) and a full Playwright flow (steps
  3-4), including a captured-and-restored real-owner-row test to prove the
  "no owner yet" branch of `/login` without any permanent data loss.
- Flagging for later, not built now: `get_current_user`'s branches (missing
  header, bad scheme, invalid token, unknown user id) are pure,
  easily-mocked logic and a good pytest candidate once `/tests` runs -
  joining the list from 3a and feature 2.

## Notes for the AI

- Keep the "invalid email or wrong password" error message byte-identical
  in both failure branches of `/auth/login` - a different message per case
  would leak which emails have accounts (user enumeration), even though
  there's only ever one real account in this app.
- `get_current_user` and `/auth/me` are proven directly with `curl` and a
  manually-carried Bearer token in step 1 - Next.js-side cookie-reading/
  forwarding logic is deliberately not built here. That's 3c's job.
- `setSessionCookie` in `src/actions/auth.ts` is now shared by both
  `signupAction` and `loginAction` - keep both actions in sync if the
  cookie shape ever changes.

## Findings

_No findings were recorded against this feature._
