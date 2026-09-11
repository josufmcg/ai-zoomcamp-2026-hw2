# Expenses4All

Expenses4All is a lightweight expense tracker for temporary groups such as trips, shared meals, and one-off events. It does not require accounts or passwords. A group is accessed through a unique UUID URL, and each browser keeps its member identity in `localStorage`.

## Project layout

- `backend/`: Python API service managed with `uv`
- `frontend/`: Node.js web client
- `_docs/specs.md`: product requirements, data models, API contract, and balance rules
- `docs/`: architecture and delivery notes

## Requirements

- Python 3.12 or newer
- `uv`
- Node.js 22 or newer
- npm, pnpm, or the package manager selected by the frontend setup

## Backend setup

From `backend/`:

```bash
uv sync
uv run pytest
```

Start the API with the command provided by the backend framework after it is configured. Keep backend-specific dependencies and scripts in `backend/pyproject.toml`.

## Frontend setup

From `frontend/`:

```bash
npm install
npm run dev
```

Use the scripts defined in `frontend/package.json` for development, testing, linting, and production builds.

## API contract

The API is organized around groups:

- `POST /api/groups` creates a group from `{ "name": "Group Name" }`.
- `GET /api/groups/:id` returns the group, members, and expenses.
- `POST /api/groups/:id/members` adds a member from `{ "displayName": "Name" }`.
- `POST /api/groups/:id/expenses` records an expense with its payer and split member IDs.
- `GET /api/groups/:id/balances` returns the computed net balance for each member.

For the authoritative fields and response shapes, see `_docs/specs.md`.

## Balance rule

For each member:

`net balance = total paid - fair share owed`

Each expense is divided equally among the IDs in `splitForMemberIds`. Positive balances mean the member is owed money; negative balances mean the member owes money; zero means settled.

## Development principles

- Keep the no-authentication, shareable-URL access model intact.
- Validate amounts, dates, member IDs, and split coverage at the API boundary.
- Use decimal-safe money arithmetic in the backend and format currency consistently in the frontend.
- Keep browser identity scoped by `groupId`; do not store credentials because the product has none.
- Add focused tests for API validation, balance calculations, and the main group/expense user flows.
