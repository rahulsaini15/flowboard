import { describe, expect, it } from "vitest";
import { seedData } from "./seed";
import { FlowboardStore } from "./store";

const createStore = () => new FlowboardStore(seedData);

describe("FlowboardStore permissions", () => {
  it("seeds the required workspace structure and task volume", () => {
    const snapshot = seedData;
    expect(snapshot.containers.filter((item) => item.type === "workspace")).toHaveLength(1);
    expect(snapshot.containers.filter((item) => item.type === "space")).toHaveLength(2);
    expect(snapshot.containers.filter((item) => item.type === "folder")).toHaveLength(2);
    expect(snapshot.containers.filter((item) => item.type === "list")).toHaveLength(3);
    expect(snapshot.tasks.length).toBeGreaterThanOrEqual(15);
    expect(snapshot.users).toHaveLength(3);
  });

  it("lets admins see every active container", () => {
    const store = createStore();
    expect(store.getVisibleContainers("alice")).toHaveLength(seedData.containers.length);
  });

  it("filters denied private resources from Bob and grants Carol access", () => {
    const store = createStore();
    expect(store.canAccess("bob", "list-launch")).toBe(false);
    expect(store.canAccess("carol", "list-launch")).toBe(true);
    expect(store.getVisibleContainers("bob").some((item) => item.id === "list-launch")).toBe(false);
    expect(store.getVisibleContainers("carol").some((item) => item.id === "list-launch")).toBe(true);
  });

  it("enforces denied access in task selectors and mutations", () => {
    const store = createStore();
    expect(() => store.getStatuses("bob", "list-launch")).toThrowError(expect.objectContaining({
      error: { code: "FORBIDDEN", message: expect.any(String) },
    }));
    expect(() => store.getTasksForList("bob", "list-launch")).toThrowError(expect.objectContaining({
      error: { code: "FORBIDDEN", message: expect.any(String) },
    }));
    expect(() => store.createTask("bob", "list-launch", { title: "Not allowed" })).toThrowError(expect.objectContaining({
      error: { code: "FORBIDDEN", message: expect.any(String) },
    }));
  });

  it("rejects invalid task statuses and allows a valid task creation", () => {
    const store = createStore();
    expect(() => store.createTask("bob", "list-backlog", { title: "Bad status", statusId: "not-a-status" })).toThrowError("Choose a status configured for this list.");
    store.createTask("bob", "list-backlog", { title: "Valid task", statusId: "todo" });
    expect(store.getTasksForList("bob", "list-backlog").some((task) => task.title === "Valid task")).toBe(true);
  });

  it("hides archived containers and descendants from selectors", () => {
    const store = createStore();
    store.archiveContainer("alice", "folder-platform");
    expect(store.getVisibleContainers("alice").some((item) => item.id === "list-backlog")).toBe(false);
    expect(() => store.getTasksForList("alice", "list-backlog")).toThrowError("This workspace item no longer exists.");
  });

  it("prevents members from changing container metadata", () => {
    const store = createStore();
    expect(() => store.renameContainer("bob", "list-backlog", "Changed")).toThrowError(expect.objectContaining({
      error: { code: "FORBIDDEN", message: expect.stringContaining("admin") },
    }));
  });

  it("moves and reorders tasks while preserving list-scoped statuses", () => {
    const store = createStore();
    store.reorderTask("bob", "task-2", "in_progress", 0);
    expect(store.getTasksForList("bob", "list-backlog").find((task) => task.id === "task-2")).toMatchObject({
      statusId: "in_progress",
      position: 0,
    });
    store.moveTask("bob", "task-2", "list-sprint", "done");
    expect(store.getTasksForList("bob", "list-sprint").find((task) => task.id === "task-2")).toMatchObject({
      primaryListId: "list-sprint",
      statusId: "done",
    });
  });
});
