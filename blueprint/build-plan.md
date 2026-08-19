# Build Plan

> One of the two planning docs you provide. Write it yourself or with the AI's help.

The features that make up this project, high level and in rough build order, one
line each, no detail (that comes per feature). Rough is fine at first, but before
`/overview` runs this file should be shaped into a checkbox list the build loop
can track.

Keep it as a checklist. Run `/feature` with no number to spec the **next
unchecked** item, or `/feature 3` / `/feature "login"` to pick a specific one.
Completed features get checked off here, so the build plan doubles as your
progress tracker. A big item gets split into sub-items (4a, 4b, etc.) when you
spec it.

## Continuing after the initial build

This is a living roadmap, not a plan that freezes when the first release is
done. Keep completed items checked, then append new unchecked features as the
project grows. Optional milestone headings such as `## MVP` and `## Post-MVP`
keep a longer plan readable without changing how `/feature` finds the next
unchecked item.

Do not renumber completed features because their archived specs refer back to
those numbers. Continue with the next unused number. If a new feature materially
changes the product direction, users, data, stack, monetization, UI/UX, or
deployment, update the relevant part of `project-plan.md` too. Then re-run
`/overview` before spec'ing the feature.

You can edit this file directly or ask the AI to start a new feature by name. If
`/feature "team workspaces"` does not match an existing item, it will propose the
new build-plan line and any necessary project-plan changes, wait for approval,
refresh the overview, and then write the feature spec.

Scaffolding the app (create-next-app, etc.) and prototyping the look are
pre-build steps, not features (see the README), so don't list them here. Start
with your first real slice of functionality.

A common order that works well: build the core UI with placeholder data first,
then wire up data, auth, and integrations. Add deployment readiness only when
the app is worth shipping or a provider config change is part of the work. Adapt
it to your project.

## Format

Use checkboxes. Each item should be a feature-sized outcome, not a loose task or
a whole product area.

Good:

- [ ] 1. **Skill submission** - upload a skill package and save its metadata
- [ ] 2. **Validation result** - run checks and show pass/fail status for a skill
- [ ] 3. **Directory listing** - browse and filter published skills
- [ ] 4. **Deployment readiness** - configure Render or Vercel and verify the
  production build

Avoid:

- Upload stuff
- Database
- Make it look nice
- Auth, billing, dashboard, validation, and deploy

If your first pass is just rough bullets, that is okay. Run `/overview` after
filling both planning docs; it will flag plan-shape problems and can propose a
cleaned-up checkbox version before generating the project overview.

- [x] 1. **Project browse/search UI** - keyword search over a project list, built against placeholder data
- [x] 2. **Backend + database skeleton** - Postgres schema and FastAPI service, all three services (web, backend, db) running via docker-compose
- [x] 3. Owner authentication
  - [x] 3a. **Bootstrap signup** - one-time owner account creation (only
    possible while no `User` row exists), password hashing, backend-issued
    session on success
  - [x] 3b. **Login** - sign-in page, backend session/JWT verification,
    Next.js httpOnly cookie holding the session
  - [x] 3c. **Route protection** - gate owner-only routes, sign-out, a
    minimal authenticated stub page proving protection actually works ahead
    of feature 4's real profile page
- [ ] 4. **Profile page** - owner-editable personal details and photo, public read view
- [ ] 5. **GitHub project import** - fetch public repos (README, languages, topics) via GitHub's public API, wired to real data replacing the placeholder
- [ ] 6. **AI keyword generation** - Claude API summarizes each project's README/metadata into tech and purpose keywords
- [ ] 7. **Theme presets** - 3+ UI styles, selectable by the owner in profile settings
- [ ] 8. **Deployment readiness** - EC2 target, docker-compose production config
- [ ] 9. **CI/CD pipeline** - GitHub Actions workflow, added after core development is done
