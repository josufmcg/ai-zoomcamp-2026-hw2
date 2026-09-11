# AGENTS.md

## Project context

Expenses4All is a no-account expense tracker for temporary groups. Read `_docs/specs.md` before changing the API, data model, or balance behavior.

## Repository layout

- `backend/`: Python backend and API. Use `uv` for dependencies and commands.
- `frontend/`: Node.js frontend. Follow the package manager and scripts declared by its `package.json`.
- `_docs/`: product specification.
- `docs/`: architecture, planning, and delivery documentation.

## Required behavior

- Groups are accessed through unguessable UUID URLs; do not introduce authentication or passwords.
- A visitor joins with a display name. Persist only the group-scoped `memberId` and `displayName` in browser `localStorage`.
- Expenses must include a title, decimal amount, `YYYY-MM-DD` date, payer, and one or more split member IDs.
- Split an expense equally across `splitForMemberIds`, not necessarily across every group member.
- Calculate each member's balance as `total paid - fair share owed`.
- Display positive balances as owed money, negative balances as money owed, and zero as settled.

## Development workflow

- Make small, focused changes and preserve existing public API shapes.
- Keep money calculations decimal-safe; never rely on binary floating-point arithmetic for persisted or calculated currency values.
- Validate all IDs against the current group and reject empty split coverage.
- Add or update focused tests with every behavior change.
- Keep secrets and local databases out of version control. Use environment variables for configuration.
- Update documentation when an endpoint, setup command, or user-visible behavior changes.

## Validation commands

Run commands from the relevant project directory:

```bash
cd backend && uv run pytest
cd frontend && npm test
cd frontend && npm run build
```

Only run commands that exist in the current project configuration; the frontend commands are expected to be added with the frontend setup.
