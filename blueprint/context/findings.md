# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to merge while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-01 [P3] fixed - Local dev DB credentials duplicated in three places

**File:** docker-compose.yml:5-7,21 and .env.example:3
**Found:** 2026-08-17 by /audit (scope: current)
**Why it matters:** `resume_builder`/`resume_builder` is typed out independently
in the `db` service's `POSTGRES_*` env, again inside the `backend` service's
`DATABASE_URL`, and again in `.env.example`. Changing the local dev password
in one place and forgetting the other two breaks local dev silently until
someone debugs a connection failure.
**Suggested fix:** Use Compose variable substitution (e.g.
`POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-resume_builder}` and build
`DATABASE_URL` from the same variables) so the value is defined once.
**Resolution:** `docker-compose.yml`'s `db` and `backend` services now both
read `${POSTGRES_DB:-...}`/`${POSTGRES_USER:-...}`/`${POSTGRES_PASSWORD:-...}`
instead of hardcoded literals; `.env.example` documents overriding them via a
root `.env`. Verified with `docker compose up -d --build` (defaults still
resolve, `/health/db` still connects). `DATABASE_URL` in `.env.example`
remains separately needed for the non-Docker local backend path (a different
consumer, not further reducible).

### F-02 [P3] fixed - AGENTS.md backend dev command omits virtualenv setup

**File:** AGENTS.md (Commands section, "Backend dev server" line)
**Found:** 2026-08-17 by /audit (scope: current)
**Why it matters:** The line says "with a virtualenv active" but never shows
how to create one or install `backend/requirements.txt`, unlike the `npm`
commands which are self-contained via `package.json`. Someone following the
docs from a clean checkout can't actually run the backend outside Docker
without already knowing the Python venv convention this project picked.
**Suggested fix:** Add the one-time setup line (e.g. `python -m venv
backend/.venv && backend/.venv/Scripts/pip install -r
backend/requirements.txt` / the POSIX equivalent) before the `uvicorn`
command.
**Resolution:** Added the `python -m venv .venv` + `pip install -r
requirements.txt` setup line to AGENTS.md before the `uvicorn` command.
Verified from scratch: fresh venv, installed deps, copied `.env.example` to
`backend/.env`, ran the documented `uvicorn` command, `GET /health` returned
200. Test venv and `.env` copy removed afterward.
