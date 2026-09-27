export type ContainerType = "workspace" | "space" | "folder" | "list";
export type Visibility = "public" | "private";
export type UserRole = "admin" | "member";
export type GrantMode = "allow" | "deny";
export type Priority = "urgent" | "high" | "normal" | "low" | "none";
export type StatusCategory = "not_started" | "active" | "completed";

export interface Container {
  id: string;
  name: string;
  type: ContainerType;
  parentId: string | null;
  position: number;
  visibility: Visibility;
  archivedAt: string | null;
}

export interface TaskStatus {
  id: string;
  name: string;
  category: StatusCategory;
  color: string;
  position: number;
}

export interface Task {
  id: string;
  primaryListId: string;
  title: string;
  description: string;
  statusId: string;
  priority: Priority;
  assigneeIds: string[];
  dueDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  parentTaskId: string | null;
  archivedAt: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: UserRole;
}

export interface Grant {
  resourceId: string;
  userId: string;
  mode: GrantMode;
}

export interface WorkspaceData {
  containers: Container[];
  statusesByList: Record<string, TaskStatus[]>;
  tasks: Task[];
  users: User[];
  grants: Grant[];
}

export interface StoreErrorShape {
  error: {
    code: string;
    message: string;
  };
}
