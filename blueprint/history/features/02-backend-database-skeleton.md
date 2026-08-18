# Feature: Backend + database skeleton

**From build-plan:** feature 2
**Status:** complete

## Goal

Stand up the backend service and the Postgres database as real, running
infrastructure - a FastAPI app with the `User` and `Project` tables migrated
in, and all three services (web, backend, db) running together via a single
`docker-compose.yml`. This is an infra outcome, not a user-facing one, but it
unblocks every feature after it (auth, profile, GitHub import).

## In scope

- A standalone FastAPI service under `backend/` with a liveness endpoint
- SQLAlchemy models for `User` and `Project`, matching the data model already
  locked in `project-overview.md`
- Alembic migrations that create both tables against a real Postgres instance
- A `db` service (Postgres) and a `backend` service in `docker-compose.yml`,
  wired together with a DB readiness check
- A Dockerfile for the existing Next.js app and a `web` service in the same
  compose file, so all three services start with one command
- `.env.example` documenting `DATABASE_URL`
- `AGENTS.md` Commands and `coding-standards.md`'s Database section updated to
  reflect the real backend commands and ORM/migration choice

## Out of scope

- Any actual API endpoints beyond health checks (`/projects`, etc.) - those
  land with the features that need them (5: GitHub import, 6: AI keywords)
- Auth, sessions, JWT (feature 3) - no protected routes yet
- CORS / how the Next.js app calls the backend (browser-direct vs. server-side
  proxy) - undecided until a feature actually wires a real fetch, likely
  feature 3 or 5
- `ANTHROPIC_API_KEY` and the JWT signing secret - anticipated in
  `project-overview.md` but not used by any code yet; they arrive with
  features 6 and 3 respectively, not stubbed here
- Production deployment config, EC2, or the final health-check path/domain
  decision (feature 8) - the `/health` endpoint here is for local
  docker-compose only
- Backend test runner (pytest) - not set up in this feature; see Testing below

## Build steps

- [x] **Step 1 - FastAPI service skeleton** - create `backend/app/main.py` (FastAPI
  app instance with a `GET /health` liveness route returning
  `{"status": "ok"}`), `backend/app/config.py` (a `pydantic-settings` `Settings`
  class reading `DATABASE_URL`, failing fast at startup if it's missing once
  step 2 needs it), `backend/requirements.txt` (fastapi, uvicorn[standard],
  sqlalchemy, alembic, psycopg2-binary, pydantic-settings), `backend/Dockerfile`,
  `backend/.dockerignore`, and add Python artifacts (`__pycache__/`, `*.pyc`,
  `.venv/`) to the root `.gitignore`. *Done when:* `uvicorn app.main:app
  --reload` runs from `backend/` with dependencies installed, and `GET
  http://localhost:8000/health` returns `200 {"status": "ok"}`.
- [x] **Step 2 - SQLAlchemy models** - add `backend/app/db/base.py` (declarative
  `Base` + engine/session factory reading `Settings.database_url`) and
  `backend/app/db/models.py` defining `User` and `Project` ORM models with
  every field from `project-overview.md`'s data model (same names, types,
  nullability, and the `Project.user_id` FK), including a `to_camel`-style
  Pydantic serialization alias plan noted in Data/contracts below. *Done when:*
  `python -c "from app.db import models"` runs without error from `backend/`
  and a side-by-side review against `project-overview.md`'s `User`/`Project`
  sections confirms every field is present.
- [x] **Step 3 - Postgres in docker-compose + Alembic migration** - add a `db`
  service to a new root `docker-compose.yml` (`postgres:16`, named volume,
  `POSTGRES_DB`/`POSTGRES_USER`/`POSTGRES_PASSWORD` env, a `pg_isready`
  healthcheck), then set up Alembic (`backend/alembic.ini`,
  `backend/migrations/env.py` wired to `models.Base.metadata` and
  `DATABASE_URL`) and generate the initial migration creating `users` and
  `projects`. *Done when:* `docker compose up -d db`, then `alembic upgrade
  head` from `backend/` (pointed at that container via `DATABASE_URL`) creates
  both tables, confirmed with `docker compose exec db psql -U <user> -d
  <db> -c '\dt'`.
- [x] **Step 4 - Backend service in docker-compose** - add a `backend` service to
  `docker-compose.yml` (build from `backend/Dockerfile`, `DATABASE_URL` env
  pointed at the `db` service's hostname, `depends_on: db` with
  `condition: service_healthy`), and extend `GET /health` to accept a
  `?check=db` query (or add `GET /health/db`) that runs `SELECT 1` through the
  session factory and reports `{"status": "ok", "database": "connected"}`.
  *Done when:* `docker compose up -d db backend` starts both containers, and
  `GET http://localhost:8000/health/db` returns the connected response from
  the container (not a local run).
- [x] **Step 5 - Dockerize web + full three-service compose** - add a root
  `Dockerfile` for the Next.js app (multi-stage build using the existing
  `npm run build` / `npm run start`) and a `web` service to
  `docker-compose.yml`, so all three services start together. *Done when:*
  `docker compose up` starts `web`, `backend`, and `db`; the homepage loads in
  a browser at the web service's mapped port; `GET /health` on the backend
  service responds `200`.
- [x] **Step 6 - Docs and env template** - add root `.env.example`
  (`DATABASE_URL=postgresql://...`, with a comment noting
  `ANTHROPIC_API_KEY` and the session/JWT secret arrive in later features),
  update `AGENTS.md`'s Commands section with the backend dev command,
  the migration command, and the `docker compose up` command, and fill in
  `coding-standards.md`'s Database section (SQLAlchemy + Alembic, migrations
  run via `alembic upgrade head` before the backend starts in production).
  *Done when:* following the documented commands from a clean checkout
  reproduces steps 1-5's results, and no real secret values are committed.

## Files / areas

- `backend/app/main.py`, `backend/app/config.py` (new)
- `backend/app/db/base.py`, `backend/app/db/models.py` (new)
- `backend/alembic.ini`, `backend/migrations/` (new)
- `backend/requirements.txt`, `backend/Dockerfile`, `backend/.dockerignore` (new)
- `docker-compose.yml` (new, repo root)
- `Dockerfile` (new, repo root, for the web app)
- `.env.example` (new, repo root)
- `.gitignore` (Python artifacts added)
- `AGENTS.md` (Commands section)
- `blueprint/context/coding-standards.md` (Database section)

## Data / contracts

- `User` and `Project` SQLAlchemy models mirror `project-overview.md`'s data
  model exactly (snake_case column names, same nullability and types).
- **Load-bearing:** the frontend `Project` type
  (`src/types/project.ts`, from feature 1) uses camelCase field names
  (`homepageUrl`, `githubRepo`, `techKeywords`, `purposeKeywords`). When a
  later feature (5: GitHub import) exposes these models over the API, the
  Pydantic response schemas must alias to camelCase (e.g.
  `alias_generator=to_camel` + `populate_by_name=True`) so the JSON shape
  matches the existing frontend type without renaming it. This feature only
  defines the DB-side snake_case models; the camelCase API schemas themselves
  are built with the endpoints that need them.
- No API response endpoints ship in this feature - `/health` and `/health/db`
  are the only routes.

## Testing

- No backend test runner is configured yet, and `AGENTS.md` has no `test`
  command, so the automated test gate stayed off for this feature. Verified
  each step with concrete evidence: curl/HTTP checks, `psql \dt` and `\d`,
  `docker compose ps`, and a Playwright screenshot of the containerized
  homepage.
- Flagging for later, not built now: once `/tests` sets up pytest for the
  backend, the `Settings` fail-fast-on-missing-`DATABASE_URL` behavior (step
  1) and the eventual camelCase Pydantic aliasing (noted above) are good
  first candidates - both are pure, assertable logic.

## Notes for the AI

- `backend/` is a separate Python project from the Next.js app at the repo
  root; don't mix dependency files or configs between them.
- Keep the ORM choice boring and standard: SQLAlchemy (sync) + Alembic +
  `psycopg2-binary`. No async driver, no alternate ORM - this is a skeleton,
  not a performance-sensitive path yet.
- `DATABASE_URL` is the only env var this feature actually wires up and
  reads. `ANTHROPIC_API_KEY` and a JWT secret stay out of scope until the
  features that use them.
- The `/health` (liveness) vs. `/health/db` (readiness) split is deliberate:
  cheap liveness polling for docker-compose's healthcheck without hitting the
  database every time, previewing (not resolving) feature 8's real
  health-check-path decision.
- `theme` on `User` is a plain `String`, not a Postgres `ENUM` - feature 7
  owns the actual set of theme names, and Postgres enum types are painful to
  extend later.
- Local dev DB credentials in `docker-compose.yml` and `.env.example` are
  parameterized (`${POSTGRES_PASSWORD:-resume_builder}` etc.), not hardcoded
  in three places - see Findings below.
- Docker Desktop was not running at the start of implementation and had to be
  started manually before `docker compose` worked - a possible snag if this
  environment is rebuilt from scratch.

## Findings

- F-01 [P3] and F-02 [P3] were raised by `/audit` (dev DB credentials
  duplicated across `docker-compose.yml`/`.env.example`; `AGENTS.md`'s backend
  dev command omitted virtualenv setup). Both were fixed and verified
  (rebuilt compose, re-ran `/health/db`; fresh venv + documented `uvicorn`
  command from scratch) before this feature closed. They remain `fixed`, not
  `closed`, in the live ledger (`blueprint/context/findings.md`) pending a
  future `/audit` re-review, per the workflow's rule that only a review pass
  - not the repair itself - can close a finding.
