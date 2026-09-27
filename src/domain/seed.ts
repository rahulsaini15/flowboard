import type { Container, Priority, Task, TaskStatus, User, WorkspaceData } from "./types";

const containers: Container[] = [
  { id: "workspace", name: "Acme Studio", type: "workspace", parentId: null, position: 0, visibility: "public", archivedAt: null },
  { id: "space-product", name: "Product & Engineering", type: "space", parentId: "workspace", position: 0, visibility: "public", archivedAt: null },
  { id: "space-operations", name: "Operations", type: "space", parentId: "workspace", position: 1, visibility: "public", archivedAt: null },
  { id: "folder-platform", name: "Platform", type: "folder", parentId: "space-product", position: 0, visibility: "public", archivedAt: null },
  { id: "folder-launch", name: "Q2 Launch", type: "folder", parentId: "space-product", position: 1, visibility: "private", archivedAt: null },
  { id: "list-backlog", name: "Backlog", type: "list", parentId: "folder-platform", position: 0, visibility: "public", archivedAt: null },
  { id: "list-sprint", name: "Sprint 24", type: "list", parentId: "folder-platform", position: 1, visibility: "public", archivedAt: null },
  { id: "list-launch", name: "Launch checklist", type: "list", parentId: "folder-launch", position: 0, visibility: "private", archivedAt: null },
];

const users: User[] = [
  { id: "alice", name: "Alice Chen", email: "alice@acme.test", initials: "AC", role: "admin" },
  { id: "bob", name: "Bob Martin", email: "bob@acme.test", initials: "BM", role: "member" },
  { id: "carol", name: "Carol Diaz", email: "carol@acme.test", initials: "CD", role: "member" },
];

const statuses: TaskStatus[] = [
  { id: "todo", name: "To do", category: "not_started", color: "#9297aa", position: 0 },
  { id: "in_progress", name: "In progress", category: "active", color: "#695ce7", position: 1 },
  { id: "done", name: "Done", category: "completed", color: "#30a781", position: 2 },
];

const taskSpecs: [string, string, string, Priority, string, string][] = [
  ["Tighten sign-in error states", "list-backlog", "in_progress", "high", "bob", "2026-10-02"],
  ["Add workspace invitations", "list-backlog", "todo", "normal", "carol", "2026-10-06"],
  ["Audit keyboard navigation", "list-backlog", "todo", "urgent", "alice", "2026-09-30"],
  ["Design notification preferences", "list-backlog", "done", "low", "carol", "2026-09-24"],
  ["Improve project search", "list-backlog", "in_progress", "normal", "bob", "2026-10-08"],
  ["Document API pagination", "list-backlog", "todo", "none", "alice", "2026-10-12"],
  ["Create reusable empty states", "list-sprint", "in_progress", "high", "carol", "2026-10-01"],
  ["Fix stale activity timestamps", "list-sprint", "todo", "normal", "bob", "2026-10-04"],
  ["Add optimistic task updates", "list-sprint", "done", "urgent", "alice", "2026-09-26"],
  ["Polish mobile navigation", "list-sprint", "todo", "low", "carol", "2026-10-10"],
  ["Ship onboarding checklist", "list-sprint", "in_progress", "high", "bob", "2026-10-03"],
  ["Review launch email copy", "list-launch", "todo", "normal", "carol", "2026-10-07"],
  ["Finalize release notes", "list-launch", "in_progress", "high", "alice", "2026-10-02"],
  ["Verify analytics events", "list-launch", "done", "low", "bob", "2026-09-25"],
  ["Prepare customer preview", "list-launch", "todo", "urgent", "carol", "2026-10-05"],
  ["QA the billing upgrade flow", "list-launch", "in_progress", "normal", "alice", "2026-10-09"],
  ["Check localization strings", "list-backlog", "done", "low", "bob", "2026-09-20"],
  ["Review empty search results", "list-sprint", "todo", "normal", "alice", "2026-10-11"],
];

const positions = new Map<string, number>();
const tasks: Task[] = taskSpecs.map(([title, primaryListId, statusId, priority, assigneeId, dueDate], index) => {
  const positionKey = `${primaryListId}:${statusId}`;
  const position = positions.get(positionKey) ?? 0;
  positions.set(positionKey, position + 1);
  return {
    id: `task-${index + 1}`,
    primaryListId,
    title,
    description: `${title}. Add implementation notes and acceptance criteria here.`,
    statusId,
    priority,
    assigneeIds: [assigneeId],
    dueDate: `${dueDate}T12:00:00.000Z`,
    position,
    createdAt: "2026-09-20T09:00:00.000Z",
    updatedAt: "2026-09-26T12:30:00.000Z",
    parentTaskId: null,
    archivedAt: null,
  };
});

export const seedData: WorkspaceData = {
  containers,
  statusesByList: Object.fromEntries(
    containers.filter((container) => container.type === "list").map((list) => [list.id, statuses.map((status) => ({ ...status }))]),
  ),
  tasks,
  users,
  grants: [
    { resourceId: "folder-launch", userId: "bob", mode: "deny" },
    { resourceId: "folder-launch", userId: "carol", mode: "allow" },
  ],
};
