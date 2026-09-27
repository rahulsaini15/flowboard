import { StoreError } from "./errors";
import type { Container, ContainerType, Task, TaskStatus, WorkspaceData } from "./types";

const clone = (data: WorkspaceData): WorkspaceData => structuredClone(data);
const normalizeDateTime = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new StoreError("INVALID_DATE", "Due date must be a valid ISO date.");
  return parsed.toISOString();
};

const parentType: Record<Exclude<ContainerType, "workspace">, ContainerType> = {
  space: "workspace",
  folder: "space",
  list: "folder",
};

export class FlowboardStore {
  private data: WorkspaceData;
  private revision = 0;
  private readonly listeners = new Set<() => void>();

  constructor(initial: WorkspaceData) {
    this.data = clone(initial);
  }

  getRevision = (): number => this.revision;

  getUsers = () => this.data.users.map((user) => ({ ...user }));

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private commit(next: WorkspaceData): void {
    this.data = next;
    this.revision += 1;
    this.listeners.forEach((listener) => listener());
  }

  private activeContainer(id: string): Container {
    const container = this.data.containers.find((item) => item.id === id && !item.archivedAt);
    if (!container) throw new StoreError("NOT_FOUND", "This workspace item no longer exists.");
    return container;
  }

  private lineage(id: string): Container[] {
    const result: Container[] = [];
    let current = this.activeContainer(id);
    while (true) {
      result.unshift(current);
      if (!current.parentId) return result;
      const parent = this.data.containers.find((item) => item.id === current.parentId && !item.archivedAt);
      if (!parent) throw new StoreError("NOT_FOUND", "A parent workspace item no longer exists.");
      current = parent;
    }
  }

  canAccess(userId: string, resourceId: string): boolean {
    const user = this.data.users.find((item) => item.id === userId);
    if (!user) return false;
    if (user.role === "admin") return true;
    let lineage: Container[];
    try {
      lineage = this.lineage(resourceId);
    } catch (error) {
      if (error instanceof StoreError && error.error.code === "NOT_FOUND") return false;
      throw error;
    }
    const grants = this.data.grants.filter((grant) => grant.userId === userId);
    for (const [index, node] of lineage.entries()) {
      if (grants.some((grant) => grant.resourceId === node.id && grant.mode === "deny")) return false;
      if (node.visibility === "private" && !lineage.slice(0, index + 1).some((ancestor) =>
        grants.some((grant) => grant.resourceId === ancestor.id && grant.mode === "allow"),
      )) return false;
    }
    return true;
  }

  getVisibleContainers(userId: string): Container[] {
    return this.data.containers
      .filter((container) => !container.archivedAt && this.canAccess(userId, container.id))
      .sort((a, b) => a.position - b.position)
      .map((container) => ({ ...container }));
  }

  getTasksForList(userId: string, listId: string): Task[] {
    const list = this.activeContainer(listId);
    if (list.type !== "list") throw new StoreError("INVALID_RESOURCE", "Tasks can only be read from a list.");
    this.assertAccess(userId, listId);
    return this.data.tasks
      .filter((task) => task.primaryListId === listId && !task.archivedAt)
      .sort((a, b) => a.position - b.position)
      .map((task) => ({ ...task, assigneeIds: [...task.assigneeIds] }));
  }

  getTask(userId: string, taskId: string): Task {
    const task = this.data.tasks.find((item) => item.id === taskId && !item.archivedAt);
    if (!task) throw new StoreError("NOT_FOUND", "This task no longer exists.");
    this.assertAccess(userId, task.primaryListId);
    return { ...task, assigneeIds: [...task.assigneeIds] };
  }

  getStatuses(userId: string, listId: string): TaskStatus[] {
    const list = this.activeContainer(listId);
    if (list.type !== "list") throw new StoreError("INVALID_RESOURCE", "Statuses can only be read from a list.");
    this.assertAccess(userId, listId);
    return [...(this.data.statusesByList[listId] ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((status) => ({ ...status }));
  }

  private assertAccess(userId: string, resourceId: string): void {
    if (!this.canAccess(userId, resourceId)) {
      throw new StoreError("FORBIDDEN", "You do not have permission to access this workspace item.");
    }
  }

  private assertAdmin(userId: string): void {
    if (this.data.users.find((user) => user.id === userId)?.role !== "admin") {
      throw new StoreError("FORBIDDEN", "Only a workspace admin can manage containers.");
    }
  }

  createContainer(userId: string, input: Omit<Container, "id" | "position" | "archivedAt">): Container {
    this.assertAdmin(userId);
    if (input.type === "workspace") throw new StoreError("INVALID_RESOURCE", "A workspace already exists.");
    if (!input.name.trim()) throw new StoreError("INVALID_INPUT", "Name cannot be empty.");
    const parent = this.activeContainer(input.parentId ?? "");
    if (parent.type !== parentType[input.type]) throw new StoreError("INVALID_PARENT", `A ${input.type} must be inside a ${parentType[input.type]}.`);
    this.assertAccess(userId, parent.id);
    const siblings = this.data.containers.filter((item) => item.parentId === parent.id && !item.archivedAt);
    const created: Container = { ...input, name: input.name.trim(), id: `${input.type}-${crypto.randomUUID()}`, position: siblings.length, archivedAt: null };
    const next = clone(this.data);
    next.containers.push(created);
    if (created.type === "list") next.statusesByList[created.id] = (next.statusesByList["list-backlog"] ?? []).map((status) => ({ ...status }));
    this.commit(next);
    return { ...created };
  }

  renameContainer(userId: string, id: string, name: string): void {
    this.assertAdmin(userId);
    this.activeContainer(id);
    this.assertAccess(userId, id);
    if (!name.trim()) throw new StoreError("INVALID_INPUT", "Name cannot be empty.");
    const next = clone(this.data);
    next.containers = next.containers.map((container) => container.id === id ? { ...container, name: name.trim() } : container);
    this.commit(next);
  }

  reorderContainer(userId: string, id: string, position: number): void {
    this.assertAdmin(userId);
    const container = this.activeContainer(id);
    if (container.parentId === null) throw new StoreError("INVALID_RESOURCE", "The workspace cannot be reordered.");
    this.assertAccess(userId, id);
    const siblings = this.data.containers
      .filter((item) => item.parentId === container.parentId && !item.archivedAt && item.id !== id)
      .sort((a, b) => a.position - b.position);
    siblings.splice(Math.max(0, Math.min(position, siblings.length)), 0, container);
    const positions = new Map(siblings.map((item, index) => [item.id, index]));
    const next = clone(this.data);
    next.containers = next.containers.map((item) => positions.has(item.id) ? { ...item, position: positions.get(item.id) ?? item.position } : item);
    this.commit(next);
  }

  archiveContainer(userId: string, id: string): void {
    this.assertAdmin(userId);
    const root = this.activeContainer(id);
    if (root.type === "workspace") throw new StoreError("INVALID_RESOURCE", "The workspace cannot be archived.");
    this.assertAccess(userId, id);
    const archivedAt = new Date().toISOString();
    const next = clone(this.data);
    const descendants = new Set([id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const container of next.containers) {
        if (container.parentId && descendants.has(container.parentId) && !descendants.has(container.id)) {
          descendants.add(container.id);
          changed = true;
        }
      }
    }
    next.containers = next.containers.map((container) => descendants.has(container.id) ? { ...container, archivedAt } : container);
    next.tasks = next.tasks.map((task) => descendants.has(task.primaryListId) ? { ...task, archivedAt } : task);
    this.commit(next);
  }

  createTask(userId: string, listId: string, input: Pick<Task, "title"> & Partial<Omit<Task, "id" | "primaryListId" | "title">>): Task {
    const list = this.activeContainer(listId);
    if (list.type !== "list") throw new StoreError("INVALID_RESOURCE", "A task must belong to a list.");
    this.assertAccess(userId, listId);
    const title = input.title.trim();
    if (!title || title.length > 500) throw new StoreError("INVALID_INPUT", "Task title is required and must be 500 characters or fewer.");
    const statuses = this.getStatuses(userId, listId);
    const statusId = input.statusId ?? statuses[0]?.id;
    if (!statusId || !statuses.some((status) => status.id === statusId)) throw new StoreError("INVALID_STATUS", "Choose a status configured for this list.");
    const users = new Set(this.data.users.map((user) => user.id));
    if (input.assigneeIds?.some((assigneeId) => !users.has(assigneeId))) throw new StoreError("INVALID_ASSIGNEE", "One or more assignees do not exist.");
    const dueDate = input.dueDate ? normalizeDateTime(input.dueDate) : null;
    if (input.parentTaskId) {
      const parent = this.data.tasks.find((task) => task.id === input.parentTaskId && !task.archivedAt);
      if (!parent || parent.primaryListId !== listId || parent.parentTaskId) throw new StoreError("INVALID_PARENT_TASK", "Subtasks must be one level deep and in the same list.");
    }
    const now = new Date().toISOString();
    const siblings = this.data.tasks.filter((task) => task.primaryListId === listId && task.statusId === statusId && !task.archivedAt);
    const created: Task = {
      id: `task-${crypto.randomUUID()}`,
      primaryListId: listId,
      title,
      description: input.description ?? "",
      statusId,
      priority: input.priority ?? "normal",
      assigneeIds: input.assigneeIds ?? [],
      dueDate,
      position: siblings.length,
      createdAt: now,
      updatedAt: now,
      parentTaskId: input.parentTaskId ?? null,
      archivedAt: null,
    };
    const next = clone(this.data);
    next.tasks.push(created);
    this.commit(next);
    return { ...created, assigneeIds: [...created.assigneeIds] };
  }

  updateTask(userId: string, id: string, changes: Partial<Pick<Task, "title" | "description" | "statusId" | "priority" | "assigneeIds" | "dueDate">>): void {
    const current = this.data.tasks.find((task) => task.id === id && !task.archivedAt);
    if (!current) throw new StoreError("NOT_FOUND", "This task no longer exists.");
    this.assertAccess(userId, current.primaryListId);
    if (changes.title !== undefined && (!changes.title.trim() || changes.title.length > 500)) {
      throw new StoreError("INVALID_INPUT", "Task title is required and must be 500 characters or fewer.");
    }
    const statuses = this.getStatuses(userId, current.primaryListId);
    if (changes.statusId && !statuses.some((status) => status.id === changes.statusId)) {
      throw new StoreError("INVALID_STATUS", "Choose a status configured for this list.");
    }
    const dueDate = changes.dueDate === undefined ? undefined : changes.dueDate === null ? null : normalizeDateTime(changes.dueDate);
    if (changes.assigneeIds?.some((assigneeId) => !this.data.users.some((user) => user.id === assigneeId))) {
      throw new StoreError("INVALID_ASSIGNEE", "One or more assignees do not exist.");
    }
    const next = clone(this.data);
    const statusChanged = changes.statusId !== undefined && changes.statusId !== current.statusId;
    const nextPosition = statusChanged
      ? next.tasks.filter((task) => task.primaryListId === current.primaryListId && task.statusId === changes.statusId && !task.archivedAt).length
      : current.position;
    const updatedFields = dueDate === undefined ? changes : { ...changes, dueDate };
    next.tasks = next.tasks.map((task) => task.id === id
      ? { ...task, ...updatedFields, position: nextPosition, title: changes.title?.trim() ?? task.title, updatedAt: new Date().toISOString() }
      : task);
    this.commit(next);
  }

  moveTask(userId: string, id: string, targetListId: string, statusId?: string): void {
    const task = this.data.tasks.find((item) => item.id === id && !item.archivedAt);
    if (!task) throw new StoreError("NOT_FOUND", "This task no longer exists.");
    const target = this.activeContainer(targetListId);
    if (target.type !== "list") throw new StoreError("INVALID_RESOURCE", "Tasks can only be moved into lists.");
    this.assertAccess(userId, task.primaryListId);
    this.assertAccess(userId, targetListId);
    const statuses = this.getStatuses(userId, targetListId);
    const nextStatus = statusId ?? statuses[0]?.id;
    if (!nextStatus || !statuses.some((status) => status.id === nextStatus)) throw new StoreError("INVALID_STATUS", "Choose a status configured for the destination list.");
    const position = this.data.tasks.filter((item) => item.primaryListId === targetListId && item.statusId === nextStatus && !item.archivedAt).length;
    const next = clone(this.data);
    next.tasks = next.tasks.map((item) => item.id === id ? { ...item, primaryListId: targetListId, statusId: nextStatus, position, updatedAt: new Date().toISOString() } : item);
    this.commit(next);
  }

  reorderTask(userId: string, id: string, statusId: string, position: number): void {
    const task = this.data.tasks.find((item) => item.id === id && !item.archivedAt);
    if (!task) throw new StoreError("NOT_FOUND", "This task no longer exists.");
    this.assertAccess(userId, task.primaryListId);
    if (!this.getStatuses(userId, task.primaryListId).some((status) => status.id === statusId)) throw new StoreError("INVALID_STATUS", "Choose a status configured for this list.");
    const lane = this.data.tasks
      .filter((item) => item.primaryListId === task.primaryListId && item.statusId === statusId && !item.archivedAt && item.id !== id)
      .sort((a, b) => a.position - b.position);
    lane.splice(Math.max(0, Math.min(position, lane.length)), 0, { ...task, statusId });
    const positions = new Map(lane.map((item, index) => [item.id, index]));
    const next = clone(this.data);
    next.tasks = next.tasks.map((item) => positions.has(item.id) ? { ...item, statusId, position: positions.get(item.id) ?? item.position, updatedAt: new Date().toISOString() } : item);
    this.commit(next);
  }

  deleteTask(userId: string, id: string): void {
    const task = this.data.tasks.find((item) => item.id === id && !item.archivedAt);
    if (!task) throw new StoreError("NOT_FOUND", "This task no longer exists.");
    this.assertAccess(userId, task.primaryListId);
    const next = clone(this.data);
    next.tasks = next.tasks.map((item) => item.id === id ? { ...item, archivedAt: new Date().toISOString() } : item);
    this.commit(next);
  }
}
