# Feature: Bootstrap signup

**From build-plan:** feature 3a
**Status:** complete

## Goal

Let the owner create their one-and-only account the first time this
deployment runs, with a backend-issued session on success. This is the first
of three owner-authentication sub-features (3a signup, 3b login, 3c route
protection) - login and protecting real routes come later; this one just gets
an owner account into the database safely.

## In scope

- Password hashing and JWT create/decode helpers in the backend
- A camelCase Pydantic response convention (this project's first real API
  schema), matching the frontend's existing `Project` type style
- `POST /auth/signup` - creates the owner `User` row, but only while none
  exists yet; permanently rejects once an owner exists, enforced server-side
- `GET /auth/setup-status` - public, tells the frontend whether signup is
  still available
- A Next.js Server Action that calls the backend server-to-server (no
  browser CORS involved) and sets an httpOnly cookie holding the session on
  success
- A `/signup` page: shows the form only when no owner exists yet, otherwise
  an "already set up" message; shows a clear error on failure

## Out of scope

- Login (3b) and route protection / sign-out / a protected stub page (3c) -
  this feature only creates the account and sets a cookie, nothing reads or
  verifies that cookie to gate access yet
- Password reset / forgot-password - not in the v1 plan
- Rate limiting on signup attempts - the endpoint permanently disables itself
  after the first success, which already bounds the exposure
- Refresh tokens or token rotation - a single long-lived JWT is enough for a
  single-tenant, low-traffic deployment
- Direct browser-to-backend calls or CORS config - the Server Actions proxy
  pattern makes this moot

## Build steps

- [x] **Step 1 - Password hashing and JWT helpers** - add `backend/app/security.py`
  (`hash_password`/`verify_password` via `bcrypt`, `create_access_token`/
  `decode_access_token` via `pyjwt`, HS256, `sub` claim = user id, 7-day
  expiry), add `session_secret: str` to `backend/app/config.py`'s `Settings`
  (reads `SESSION_SECRET`, fails fast like `database_url` already does), and
  add `bcrypt`, `pyjwt`, `email-validator` to `backend/requirements.txt`.
  *Done when:* a `python -c` roundtrip hashes and verifies a password, and
  encodes then decodes a JWT back to the same user id; decoding a tampered or
  expired token raises.
- [x] **Step 2 - Signup and setup-status endpoints** - add
  `backend/app/schemas.py` (a `CamelModel` base with
  `alias_generator=to_camel` + `populate_by_name=True`, then `SignupRequest`
  (`email: EmailStr`, `password: str` min length 8, `display_name: str`),
  `SignupResponse` (`token`, `user: {id, email, displayName}`), and
  `SetupStatusResponse` (`needsSetup: bool`)), add
  `backend/app/routers/auth.py` (`APIRouter(prefix="/auth")` with
  `POST /signup` and `GET /setup-status`, querying `User` via the session
  factory - `POST /signup` returns `403` once any `User` row exists), and
  wire the router into `backend/app/main.py`. *Done when:* against a running
  `backend` + `db` (via `docker compose up -d db backend`), the first
  `POST /auth/signup` creates a real row and returns a token; a second call
  returns `403`; `GET /auth/setup-status` reports `true` before and `false`
  after, all confirmed via `curl`.
- [x] **Step 3 - Server Action + signup page** - add `BACKEND_URL:
  http://backend:8000` to the `web` service in `docker-compose.yml` (default
  to `http://localhost:8000` in code for running `npm run dev` outside
  Docker); add `src/actions/auth.ts` exporting `signupAction(formData)`
  (POSTs to `${BACKEND_URL}/auth/signup`, on failure redirects to
  `/signup?error=<message>`, on success sets an httpOnly `session` cookie -
  `secure` in production, `sameSite: 'lax'`, 7-day `maxAge` matching the JWT
  - holding the returned token, then redirects to `/`); add
  `src/app/signup/page.tsx` (server component: fetches `GET
  /auth/setup-status`; renders the form, `action={signupAction}`, with
  email/password/display-name fields when `needsSetup` is true, an "Owner
  account already exists" message otherwise; reads `searchParams.error` to
  show a failure message), styled with the existing dark theme tokens from
  `globals.css` (feature 1) - no new prototype needed for one utility form.
  The action and the page are one step because the action has no observable
  behavior without a form to trigger it. *Done when, verified via Playwright
  against `docker compose up`:* visiting `/signup` with no owner yet shows
  the form; submitting valid data redirects to `/`, and the `session` cookie
  is present afterward; visiting `/signup` again shows the "already exists"
  message instead of the form; submitting an invalid password shows the
  error message instead of silently failing.

## Files / areas

- `backend/app/security.py` (new)
- `backend/app/config.py` (add `session_secret`)
- `backend/app/schemas.py` (new)
- `backend/app/routers/auth.py` (new)
- `backend/app/main.py` (include the auth router)
- `backend/requirements.txt` (add `bcrypt`, `pyjwt`, `email-validator`)
- `docker-compose.yml` (`BACKEND_URL` and `SESSION_SECRET` on the relevant
  services)
- `.env.example` (`SESSION_SECRET` documented as required)
- `src/actions/auth.ts` (new)
- `src/app/signup/page.tsx` (new)

## Data / contracts

- **Load-bearing for 3b/3c:** the `session` cookie name, its httpOnly/
  `sameSite: 'lax'` shape, and that it holds the raw JWT string returned by
  the backend - login (3b) must set an identical cookie, and route
  protection (3c) must read/verify this exact one.
- **Load-bearing for 3b/3c:** the JWT shape from `security.py` - HS256,
  `sub` = user id (string), 7-day `exp`, signed with `SESSION_SECRET`. Both
  later sub-features decode against this exact contract.
- **Load-bearing for future API work (5, 6):** `CamelModel` in
  `backend/app/schemas.py` is the base every future Pydantic response schema
  should inherit from, resolving the camelCase contract feature 2 flagged
  but didn't build.
- `SignupRequest` / `SignupResponse` / `SetupStatusResponse` as described in
  step 2.

## Testing

- No backend or frontend test runner is configured yet, so the automated
  gate stayed off. Verified with a `python -c` roundtrip (step 1), `curl`
  against the real running services plus a direct `psql` check of the
  bcrypt-hashed row (step 2), and a full Playwright flow against
  `docker compose up` (step 3) - including bypassing native HTML5
  validation to prove the backend's own 422 error path, not just the
  browser's.
- Flagging for later, not built now: `hash_password`/`verify_password` and
  the JWT roundtrip (step 1) are pure, assertable logic and good first pytest
  candidates - noted again here since feature 2 already flagged its own
  candidates and pytest still isn't set up.

## Notes for the AI

- Server Actions only - no client components needed for this feature. The
  form posts via `action={signupAction}` directly; errors surface through a
  redirect + `searchParams`, not client-side state, per
  `coding-standards.md`'s server-components-by-default preference.
- `backend/app/routers/` is new structure - this is the first router beyond
  the two health endpoints in `main.py`. 3b's login route belongs in the same
  `auth.py` router, not a new file.
- The permanent-lockout behavior of `POST /auth/signup` must be enforced by
  querying the database for an existing `User` row inside the endpoint
  itself, never by trusting a client-supplied flag or only hiding the UI.
- Known, accepted simplification: the "no user exists yet" check and the
  insert aren't wrapped in a locking transaction, so two concurrent signup
  requests could theoretically both pass the check before either commits.
  This endpoint is hit at most once in a deployment's real lifetime, so the
  risk is negligible - not worth pessimistic locking for a bootstrap-only
  path.
- The `session` cookie was verified `secure: true` inside the container
  because the web image runs with `NODE_ENV=production` (from feature 2's
  Dockerfile) - it only worked over plain `http://localhost` in testing
  because Chromium treats `localhost` as a secure-context exception. A real
  deployment must be served over HTTPS or this cookie will silently fail to
  set.
