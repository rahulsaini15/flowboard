# Flowboard

Flowboard is a small, single-workspace project management app built for the SDE2 frontend take-home. It is a frontend-only React application: there is no API server or database. Typed seed data is loaded into an in-memory client store when the app starts.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite. The seed data resets on page refresh; optional browser storage was deliberately left out so each demo starts from a predictable state.

## Architecture

```text
React UI (src/App.tsx)
  ├── Workspace sidebar, user switcher, board/list views, task drawer
  └── FlowboardStore (src/domain/store.ts)
       ├── Permission checks and visible-resource selectors
       ├── Container and task mutations
       └── Typed seed fixtures (src/domain/seed.ts)
```

## Data model

- Containers form `workspace → space → folder → list`; every container has an ID, name, parent, sibling position, visibility, and archive timestamp.
- Each list owns its status set (`To do`, `In progress`, and `Done`).
- Tasks belong to exactly one primary list and include title, plain-text description, status, priority, assignees, due date, position, and timestamps.
- The fixtures include one workspace, two spaces, two folders, three lists, 18 tasks, three users, and sample grants.
- Container removal is soft archive. Archiving a container also archives its descendants and their tasks.

## Permissions

Alice is an admin and can access every active workspace resource. Bob and Carol are members. Public containers are visible to members unless a matching deny grant exists. Private containers require an explicit allow grant on that container or an ancestor; deny grants override allows. Child-resource access follows this simple ancestor chain, and the store enforces access for both selectors and mutations. Switching users immediately changes the visible tree and task view.

The model intentionally uses individual user grants only. Team-based grants could be added by resolving team membership to principals before evaluating the same resource rules.

## Features

- Collapsible workspace tree with space, folder, and list selection
- Alice/Bob/Carol user switcher for demonstrating permission differences
- Kanban view with draggable task cards, columns per list status, and column ordering
- Dense list view with due-date and priority sorting
- Task create, edit, move, status change, reorder, and archive operations
- Container create, rename, sibling reorder in the store, and soft archive
- Client-side search across task titles and descriptions (one stretch goal)
- Task detail drawer with Escape and overlay-click close behavior
- Loading/empty states, inline mutation errors, and visible focus/hover states

## Validation

```powershell
npm run build
npm run lint
npm test
```

## Trade-offs and next steps

- The assessment does not require a backend; this app keeps the data in memory and does not persist changes across refreshes.
- Native HTML drag-and-drop keeps dependencies light. A dedicated sortable library and touch support would be considered next.
- One-level subtasks were left out so the core hierarchy, permission, board, and task flows could be completed first.
- Next steps would add browser persistence behind a versioned storage adapter, stronger end-to-end coverage for denied mutations, and keyboard-accessible task reordering.

## AI usage

AI assistance was used to scaffold and implement the typed store, React UI, tests, and documentation. The generated work was checked against the assessment and corrected to match its frontend-only scope. See [AI_USAGE.md](./AI_USAGE.md) for details.
