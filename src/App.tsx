import {
  Archive,
  ArrowDownUp,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Command,
  Folder,
  FolderOpen,
  GripVertical,
  LayoutGrid,
  List,
  LockKeyhole,
  Pencil,
  Plus,
  Search,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { StoreError } from "./domain/errors";
import { seedData } from "./domain/seed";
import { FlowboardStore } from "./domain/store";
import type { Container, ContainerType, Priority, Task, TaskStatus, User } from "./domain/types";

const store = new FlowboardStore(seedData);
const priorityOrder: Record<Priority, number> = { urgent: 0, high: 1, normal: 2, low: 3, none: 4 };
const priorityStyle: Record<Priority, string> = {
  urgent: "bg-rose-50 text-rose-700 ring-rose-200",
  high: "bg-orange-50 text-orange-700 ring-orange-200",
  normal: "bg-blue-50 text-blue-700 ring-blue-200",
  low: "bg-slate-100 text-slate-600 ring-slate-200",
  none: "bg-slate-50 text-slate-400 ring-slate-200",
};
const statusStyle: Record<string, string> = {
  todo: "bg-slate-100 text-slate-600",
  in_progress: "bg-brand-50 text-brand-700",
  done: "bg-emerald-50 text-emerald-700",
};
const avatarColor: Record<string, string> = {
  alice: "bg-violet-500",
  bob: "bg-emerald-600",
  carol: "bg-orange-500",
};
const dateLabel = (value: string | null): string => {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
};

interface TaskDraft {
  title: string;
  description: string;
  statusId: string;
  priority: Priority;
  assigneeIds: string[];
  dueDate: string | null;
  primaryListId: string;
}

function TaskDrawer({
  task,
  listId,
  statuses,
  initialStatusId,
  lists,
  users,
  onClose,
  onSave,
  onDelete,
}: {
  task: Task | null;
  listId: string;
  statuses: TaskStatus[];
  initialStatusId: string;
  lists: Container[];
  users: User[];
  onClose: () => void;
  onSave: (draft: TaskDraft) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [statusId, setStatusId] = useState(task?.statusId ?? initialStatusId);
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "normal");
  const [assigneeIds, setAssigneeIds] = useState<string[]>(task?.assigneeIds ?? []);
  const [dueDate, setDueDate] = useState(task?.dueDate?.slice(0, 10) ?? "");
  const [primaryListId, setPrimaryListId] = useState(task?.primaryListId ?? listId);
  const titleRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    titleRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({ title, description, statusId, priority, assigneeIds, dueDate: dueDate || null, primaryListId });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-ink-900/35 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <aside aria-label={task ? "Task details" : "Create task"} className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl" role="dialog" aria-modal="true">
        <div className="flex items-center justify-between border-b border-ink-100 px-7 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">{task ? "Task details" : "New task"}</p>
            <h2 className="mt-1 text-lg font-semibold text-ink-900">{task ? "Make progress happen" : "Add to your workflow"}</h2>
          </div>
          <button aria-label="Close task details" className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 focus:outline-none focus:ring-2 focus:ring-brand-500" onClick={onClose} type="button"><X size={18} /></button>
        </div>
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
          <div className="flex-1 space-y-6 overflow-y-auto px-7 py-6">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-500">Task title</span>
              <input ref={titleRef} maxLength={500} required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs to get done?" className="w-full rounded-xl border border-ink-300 px-4 py-3 text-base font-semibold text-ink-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-500">Description</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} placeholder="Add a few details, notes, or acceptance criteria…" className="w-full resize-y rounded-xl border border-ink-300 px-4 py-3 text-sm leading-6 text-ink-700 outline-none transition placeholder:text-ink-500/70 focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-500">Status</span>
                <select value={statusId} onChange={(event) => setStatusId(event.target.value)} className="w-full rounded-xl border border-ink-300 bg-white px-3 py-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100">
                  {statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-500">Priority</span>
                <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)} className="w-full rounded-xl border border-ink-300 bg-white px-3 py-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100">
                  {(["urgent", "high", "normal", "low", "none"] as Priority[]).map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-500">Due date</span>
              <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="w-full rounded-xl border border-ink-300 px-3 py-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
            </label>
            {task && lists.length > 1 && (
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-500">Move to list</span>
                <select value={primaryListId} onChange={(event) => setPrimaryListId(event.target.value)} className="w-full rounded-xl border border-ink-300 bg-white px-3 py-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100">
                  {lists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}
                </select>
              </label>
            )}
            <fieldset>
              <legend className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-500">Assignees</legend>
              <div className="flex flex-wrap gap-2">
                {users.map((user) => {
                  const checked = assigneeIds.includes(user.id);
                  return (
                    <button key={user.id} type="button" aria-pressed={checked} onClick={() => setAssigneeIds(checked ? assigneeIds.filter((id) => id !== user.id) : [...assigneeIds, user.id])} className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-brand-500 ${checked ? "border-brand-200 bg-brand-50 text-brand-700" : "border-ink-300 bg-white text-ink-700 hover:bg-ink-100"}`}>
                      <span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold text-white ${avatarColor[user.id] ?? "bg-slate-500"}`}>{user.initials}</span>
                      {user.name.split(" ")[0]}
                      {checked && <Check size={13} />}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
          <div className="flex items-center justify-between border-t border-ink-100 px-7 py-5">
            {onDelete ? <button type="button" onClick={onDelete} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-300"><Archive size={15} /> Archive task</button> : <span className="text-xs text-ink-500">Changes are saved to this workspace.</span>}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="rounded-lg border border-ink-300 px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-100 focus:outline-none focus:ring-2 focus:ring-brand-500">Cancel</button>
              <button type="submit" className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-100">{task ? "Save changes" : "Create task"}</button>
            </div>
          </div>
        </form>
      </aside>
    </div>
  );
}

function ContainerDialog({
  mode,
  containers,
  initialContainer,
  onClose,
  onSubmit,
}: {
  mode: "create" | "rename";
  containers: Container[];
  initialContainer?: Container;
  onClose: () => void;
  onSubmit: (name: string, type: Exclude<ContainerType, "workspace">, parentId: string, visibility: "public" | "private") => void;
}) {
  const [type, setType] = useState<Exclude<ContainerType, "workspace">>("space");
  const [name, setName] = useState(initialContainer?.name ?? "");
  const [visibility, setVisibility] = useState<"public" | "private">(initialContainer?.visibility ?? "public");
  const validParentType: Record<Exclude<ContainerType, "workspace">, ContainerType> = { space: "workspace", folder: "space", list: "folder" };
  const parents = containers.filter((container) => container.type === validParentType[type]);
  const [selectedParentId, setSelectedParentId] = useState(parents[0]?.id ?? "");
  const parentId = parents.some((parent) => parent.id === selectedParentId) ? selectedParentId : parents[0]?.id ?? "";
  const inputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef(onClose);

  useEffect(() => {
    inputRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(name, type, parentId, visibility);
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink-900/35 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="presentation">
      <form role="dialog" aria-modal="true" aria-label={mode === "create" ? "Create workspace item" : "Rename workspace item"} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onSubmit={submit}>
        <div className="mb-5 flex items-start justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">{mode === "create" ? "Workspace structure" : "Edit name"}</p><h2 className="mt-1 text-xl font-semibold text-ink-900">{mode === "create" ? "Create a workspace item" : "Rename item"}</h2></div>
          <button type="button" aria-label="Close dialog" onClick={onClose} className="rounded-lg p-2 text-ink-500 hover:bg-ink-100"><X size={18} /></button>
        </div>
        <label className="mb-4 block"><span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-500">Name</span><input ref={inputRef} required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-ink-300 px-3 py-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" /></label>
        {mode === "create" && (
          <>
            <label className="mb-4 block"><span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-500">Item type</span><select value={type} onChange={(event) => setType(event.target.value as Exclude<ContainerType, "workspace">)} className="w-full rounded-xl border border-ink-300 bg-white px-3 py-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"><option value="space">Space</option><option value="folder">Folder</option><option value="list">List</option></select></label>
            <label className="mb-4 block"><span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-500">Parent</span><select value={parentId} onChange={(event) => setSelectedParentId(event.target.value)} required className="w-full rounded-xl border border-ink-300 bg-white px-3 py-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100">{parents.map((parent) => <option key={parent.id} value={parent.id}>{parent.name}</option>)}</select></label>
            <label className="mb-6 flex items-center gap-2 text-sm text-ink-700"><input type="checkbox" checked={visibility === "private"} onChange={(event) => setVisibility(event.target.checked ? "private" : "public")} className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500" /> Make private</label>
          </>
        )}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-ink-300 px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-100">Cancel</button><button type="submit" disabled={mode === "create" && !parentId} className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50">{mode === "create" ? "Create item" : "Save name"}</button></div>
      </form>
    </div>
  );
}

function TaskCard({
  task,
  users,
  status,
  onOpen,
  onDrop,
}: {
  task: Task;
  users: User[];
  status: TaskStatus;
  onOpen: () => void;
  onDrop: (taskId: string, position: number) => void;
}) {
  return (
    <article
      draggable
      onDragStart={(event) => { event.dataTransfer.setData("text/plain", task.id); event.dataTransfer.effectAllowed = "move"; }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => { event.preventDefault(); onDrop(event.dataTransfer.getData("text/plain"), task.position); }}
      className="group cursor-grab rounded-xl border border-ink-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-panel active:cursor-grabbing"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <button type="button" aria-label={`Edit task: ${task.title}`} onClick={onOpen} className="text-left text-sm font-semibold leading-5 text-ink-900 hover:text-brand-700 focus:outline-none focus:underline">{task.title}</button>
        <button type="button" aria-label={`Open task details: ${task.title}`} onClick={onOpen} className="rounded-md p-1.5 text-ink-500 transition hover:bg-brand-50 hover:text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500"><Pencil size={14} /></button>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${priorityStyle[task.priority]}`}>{task.priority === "none" ? "No priority" : task.priority}</span>
        <span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${statusStyle[status.id] ?? "bg-slate-100 text-slate-600"}`}>{status.name}</span>
      </div>
      <div className="flex items-center justify-between border-t border-ink-100 pt-3">
        <div className="flex -space-x-2" aria-label="Assignees">
          {task.assigneeIds.map((id) => users.find((user) => user.id === id)).filter((user): user is User => Boolean(user)).map((user) => <span key={user.id} title={user.name} className={`grid h-7 w-7 place-items-center rounded-full border-2 border-white text-[9px] font-bold text-white ${avatarColor[user.id] ?? "bg-slate-500"}`}>{user.initials}</span>)}
          {task.assigneeIds.length === 0 && <span className="text-xs text-ink-500">Unassigned</span>}
        </div>
        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10) ? "text-rose-600" : "text-ink-500"}`}><CalendarDays size={12} />{dateLabel(task.dueDate)}</span>
      </div>
    </article>
  );
}

function App() {
  useSyncExternalStore(store.subscribe, store.getRevision, store.getRevision);
  const users = store.getUsers();
  const [userId, setUserId] = useState("alice");
  const [selectedListId, setSelectedListId] = useState("list-backlog");
  const [activeView, setActiveView] = useState<"board" | "list">("board");
  const [sortBy, setSortBy] = useState<"position" | "due" | "priority">("position");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(["space-product", "space-operations", "folder-platform", "folder-launch"]));
  const [drawerTask, setDrawerTask] = useState<Task | null | undefined>(undefined);
  const [newTaskStatusId, setNewTaskStatusId] = useState("todo");
  const [containerDialog, setContainerDialog] = useState<"create" | Container | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [loadingTree, setLoadingTree] = useState(true);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const currentUser = users.find((user) => user.id === userId) ?? users[0];
  const visibleContainers = store.getVisibleContainers(userId);
  const lists = visibleContainers.filter((container) => container.type === "list");
  const selectedList = lists.find((list) => list.id === selectedListId) ?? lists[0];
  const statuses = selectedList ? store.getStatuses(userId, selectedList.id) : [];
  const selectedFolder = selectedList?.parentId ? visibleContainers.find((container) => container.id === selectedList.parentId) : undefined;
  const selectedSpace = selectedFolder?.parentId ? visibleContainers.find((container) => container.id === selectedFolder.parentId) : selectedFolder;
  const tasks = selectedList ? store.getTasksForList(userId, selectedList.id) : [];
  const visibleTasks = tasks.filter((task) => `${task.title} ${task.description}`.toLowerCase().includes(search.trim().toLowerCase()));
  const sortedTasks = [...visibleTasks].sort((a, b) => {
    if (sortBy === "due") return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
    if (sortBy === "priority") return priorityOrder[a.priority] - priorityOrder[b.priority];
    return a.position - b.position;
  });

  useEffect(() => {
    if (!loadingBoard && !loadingTree) return;
    const timer = window.setTimeout(() => {
      setLoadingBoard(false);
      setLoadingTree(false);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [loadingBoard, loadingTree]);

  function selectList(id: string) {
    setSelectedListId(id);
    setLoadingBoard(true);
    setLoadingTree(true);
  }

  function switchUser(id: string) {
    setUserId(id);
    setLoadingBoard(true);
    setLoadingTree(true);
  }

  function closeTaskDrawer() {
    setDrawerTask(undefined);
    window.requestAnimationFrame(() => openerRef.current?.focus());
  }

  function act(action: () => void) {
    try {
      setErrorMessage("");
      action();
    } catch (error) {
      setErrorMessage(error instanceof StoreError ? error.error.message : error instanceof Error ? error.message : "The action could not be completed.");
    }
  }

  const byParent = (parentId: string) => visibleContainers.filter((container) => container.parentId === parentId).sort((a, b) => a.position - b.position);

  function openTask(task: Task | null, statusId?: string) {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!task) setNewTaskStatusId(statusId ?? statuses[0]?.id ?? "todo");
    setDrawerTask(task);
  }

  function saveTask(draft: TaskDraft) {
    if (!selectedList) return;
    act(() => {
      if (drawerTask) {
        if (draft.primaryListId !== drawerTask.primaryListId) store.moveTask(userId, drawerTask.id, draft.primaryListId, draft.statusId);
        store.updateTask(userId, drawerTask.id, {
          title: draft.title,
          description: draft.description,
          statusId: draft.statusId,
          priority: draft.priority,
          assigneeIds: draft.assigneeIds,
          dueDate: draft.dueDate,
        });
      } else {
        store.createTask(userId, selectedList.id, {
          title: draft.title,
          description: draft.description,
          statusId: draft.statusId,
          priority: draft.priority,
          assigneeIds: draft.assigneeIds,
          dueDate: draft.dueDate,
        });
      }
      setDrawerTask(undefined);
    });
  }

  function commitContainer(name: string, type: Exclude<ContainerType, "workspace">, parentId: string, visibility: "public" | "private") {
    if (!containerDialog) return;
    act(() => {
      if (containerDialog === "create") {
        const created = store.createContainer(userId, { name, type, parentId, visibility });
        if (created.type === "list") selectList(created.id);
      } else {
        store.renameContainer(userId, containerDialog.id, name);
      }
      setContainerDialog(null);
    });
  }

  function archiveContainerItem(container: Container) {
    if (!window.confirm(`Archive "${container.name}" and its descendants?`)) return;
    act(() => {
      store.archiveContainer(userId, container.id);
      if (selectedList && !store.getVisibleContainers(userId).some((item) => item.id === selectedList.id)) {
        const fallback = store.getVisibleContainers(userId).find((item) => item.type === "list");
        if (fallback) selectList(fallback.id);
        else setSelectedListId("");
      }
    });
  }

  function renderContainerActions(container: Container) {
    if (currentUser.role !== "admin") return null;
    return (
      <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button type="button" aria-label={`Rename ${container.name}`} onClick={() => setContainerDialog(container)} className="rounded p-1 text-ink-500 hover:bg-white hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"><Settings2 size={13} /></button>
        <button type="button" aria-label={`Archive ${container.name}`} onClick={() => archiveContainerItem(container)} className="rounded p-1 text-ink-500 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-300"><Archive size={13} /></button>
      </div>
    );
  }

  function renderListItem(list: Container) {
    const count = store.getTasksForList(userId, list.id).length;
    return (
      <div key={list.id} className="group ml-7 flex w-[calc(100%-1.75rem)] items-center rounded-lg">
        <button type="button" onClick={() => selectList(list.id)} className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition focus:outline-none focus:ring-2 focus:ring-brand-500 ${selectedList?.id === list.id ? "bg-brand-50 font-semibold text-brand-700" : "text-ink-700 hover:bg-white hover:text-ink-900"}`}>
          <List size={15} className={selectedList?.id === list.id ? "text-brand-600" : "text-ink-500"} /><span className="min-w-0 flex-1 truncate">{list.name}</span><span className="text-[10px] tabular-nums text-ink-500">{count}</span>
        </button>
        {renderContainerActions(list)}
      </div>
    );
  }

  function renderFolder(folder: Container) {
    const isOpen = expanded.has(folder.id);
    const listsInside = byParent(folder.id).filter((container) => container.type === "list");
    return (
      <div key={folder.id} className="group mt-1">
        <div className="flex items-center">
          <button type="button" onClick={() => setExpanded((items) => { const next = new Set(items); if (isOpen) next.delete(folder.id); else next.add(folder.id); return next; })} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-ink-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}{isOpen ? <FolderOpen size={15} className="text-amber-500" /> : <Folder size={15} className="text-amber-500" />}<span className="min-w-0 flex-1 truncate">{folder.name}</span>{folder.visibility === "private" && <LockKeyhole size={12} className="text-ink-500" />}
          </button>
          {renderContainerActions(folder)}
        </div>
        {isOpen && <div className="pb-1">{listsInside.map(renderListItem)}</div>}
      </div>
    );
  }

  function renderSpace(space: Container) {
    const isOpen = expanded.has(space.id);
    const folders = byParent(space.id).filter((container) => container.type === "folder");
    const directLists = byParent(space.id).filter((container) => container.type === "list");
    return (
      <div key={space.id} className="group mt-2">
        <div className="flex items-center">
          <button type="button" onClick={() => setExpanded((items) => { const next = new Set(items); if (isOpen) next.delete(space.id); else next.add(space.id); return next; })} className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-semibold text-ink-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
            {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}<span className="grid h-6 w-6 place-items-center rounded-md bg-violet-100 text-[10px] font-bold text-violet-700">{space.name.slice(0, 1)}</span><span className="min-w-0 flex-1 truncate">{space.name}</span>{space.visibility === "private" && <LockKeyhole size={12} className="text-ink-500" />}
          </button>
          {renderContainerActions(space)}
        </div>
        {isOpen && <div className="ml-3 border-l border-ink-300 pl-2">{folders.map(renderFolder)}{directLists.map(renderListItem)}</div>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-ink-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-[264px] shrink-0 flex-col border-r border-ink-100 bg-[#f4f5fa] lg:flex">
          <div className="flex h-[72px] items-center gap-3 border-b border-ink-100 px-5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm"><Command size={19} strokeWidth={2.4} /></div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold tracking-tight text-ink-900">flowboard</p><p className="text-[10px] font-medium uppercase tracking-[0.15em] text-ink-500">Workspace</p></div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-5">
            <div className="mb-2 flex items-center justify-between px-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">Your workspace</span>
              {currentUser.role === "admin" && <button aria-label="Add workspace item" type="button" onClick={() => setContainerDialog("create")} className="rounded-md p-1 text-ink-500 hover:bg-white hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"><Plus size={15} /></button>}
            </div>
            {loadingTree ? (
              <div aria-label="Loading workspace tree" className="space-y-3 px-3 py-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-ink-300/60" />
                <div className="ml-4 h-4 w-2/3 animate-pulse rounded bg-ink-300/50" />
                <div className="ml-8 h-4 w-1/2 animate-pulse rounded bg-ink-300/40" />
              </div>
            ) : (
              <>
                {visibleContainers.filter((container) => container.type === "space").map(renderSpace)}
                {visibleContainers.filter((container) => container.type === "workspace").length === 0 && <p className="px-3 py-4 text-xs text-ink-500">No workspace access.</p>}
              </>
            )}
            <div className="mt-8 px-3">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">Shortcuts</p>
              <button type="button" onClick={() => setSearch("")} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-xs text-ink-700 hover:bg-white"><Search size={15} className="text-ink-500" />Clear search</button>
            </div>
          </div>
          <div className="m-3 rounded-xl border border-brand-100 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-2"><Sparkles size={14} className="text-brand-600" /><span className="text-xs font-semibold text-ink-900">A little more focus</span></div>
            <p className="text-[11px] leading-5 text-ink-500">Keep the important work moving, one clear next step at a time.</p>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="flex min-h-[72px] flex-wrap items-center justify-between gap-4 border-b border-ink-100 bg-white px-5 py-3 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <div className="lg:hidden grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white"><Command size={18} /></div>
              <div className="min-w-0"><div className="flex items-center gap-2 text-[11px] font-medium text-ink-500"><span>Acme Studio</span>{selectedSpace && <><ChevronRight size={12} /><span>{selectedSpace.name}</span></>}{selectedFolder?.type === "folder" && <><ChevronRight size={12} /><span>{selectedFolder.name}</span></>}</div><div className="mt-0.5 flex items-center gap-2"><h1 className="truncate text-lg font-bold tracking-tight text-ink-900 sm:text-xl">{selectedList?.name ?? "Your workspace"}</h1>{selectedList?.visibility === "private" && <LockKeyhole size={14} className="text-ink-500" />}</div></div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <label className="relative hidden sm:block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks…" className="w-48 rounded-lg border border-ink-100 bg-[#f8f9fc] py-2 pl-9 pr-3 text-xs outline-none placeholder:text-ink-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></label>
              <label className="sr-only" htmlFor="user-switcher">Switch user</label>
              <select id="user-switcher" value={userId} onChange={(event) => switchUser(event.target.value)} className="max-w-[135px] rounded-lg border border-ink-100 bg-white py-2 pl-2 pr-7 text-xs font-semibold text-ink-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:max-w-none sm:px-3">
                {users.map((user) => <option key={user.id} value={user.id}>{user.name.split(" ")[0]} · {user.role}</option>)}
              </select>
              <span title={currentUser.email} className={`hidden h-9 w-9 place-items-center rounded-full text-xs font-bold text-white sm:grid ${avatarColor[currentUser.id] ?? "bg-slate-500"}`}>{currentUser.initials}</span>
            </div>
          </header>

          {errorMessage && <div role="alert" className="mx-5 mt-4 flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:mx-8"><span>{errorMessage}</span><button type="button" aria-label="Dismiss error" onClick={() => setErrorMessage("")} className="rounded p-1 hover:bg-rose-100"><X size={16} /></button></div>}

          <section className="px-5 py-6 sm:px-8">
            {!selectedList ? (
              <div className="mx-auto mt-20 max-w-md rounded-2xl border border-ink-100 bg-white p-8 text-center shadow-panel">
                <LockKeyhole size={24} className="mx-auto text-ink-500" /><h2 className="mt-4 text-lg font-semibold">No lists available</h2><p className="mt-2 text-sm leading-6 text-ink-500">This user has no access to a visible list. Switch users or ask an admin to grant access.</p>
              </div>
            ) : (
              <>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div><div className="mb-2 flex items-center gap-2"><span className="rounded-md bg-brand-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-700">Team space</span><span className="text-[11px] text-ink-500">{tasks.length} tasks · Updated just now</span></div><h2 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-[28px]">{selectedList.name}</h2><p className="mt-1 max-w-xl text-sm text-ink-500">Keep your team aligned and make the next step obvious.</p></div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => openTask(null)} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-100"><Plus size={16} />New task</button>
                  </div>
                </div>

                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-ink-100">
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setActiveView("board")} className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold ${activeView === "board" ? "border-brand-600 text-brand-700" : "border-transparent text-ink-500 hover:text-ink-900"}`}><LayoutGrid size={15} />Board</button>
                    <button type="button" onClick={() => setActiveView("list")} className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold ${activeView === "list" ? "border-brand-600 text-brand-700" : "border-transparent text-ink-500 hover:text-ink-900"}`}><List size={15} />List</button>
                    <span className="ml-1 rounded bg-ink-100 px-1.5 py-0.5 text-[9px] font-semibold text-ink-500">2</span>
                  </div>
                  {activeView === "list" && <div className="flex items-center gap-2 pb-2">
                    <label className="sr-only" htmlFor="sort-tasks">Sort tasks</label><span className="text-[11px] text-ink-500"><ArrowDownUp size={13} className="mr-1 inline" />Sort</span><select id="sort-tasks" value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="rounded-md border border-ink-100 bg-white px-2 py-1.5 text-[11px] text-ink-700 outline-none focus:border-brand-500"><option value="position">Manual order</option><option value="due">Due date</option><option value="priority">Priority</option></select>
                  </div>}
                </div>

                {loadingBoard ? (
                  <div aria-label="Loading task view" className="grid min-w-[720px] grid-cols-3 gap-4">
                    {statuses.map((status) => <div key={status.id} className="min-h-[390px] animate-pulse rounded-xl bg-ink-100 p-4"><div className="mb-6 h-4 w-28 rounded bg-ink-300/70" /><div className="space-y-3"><div className="h-28 rounded-xl bg-white" /><div className="h-24 rounded-xl bg-white" /></div></div>)}
                  </div>
                ) : activeView === "board" ? (
                  <div className="grid min-w-[720px] grid-cols-3 gap-4 overflow-x-auto pb-5">
                    {statuses.map((status) => {
                      const columnTasks = visibleTasks.filter((task) => task.statusId === status.id).sort((a, b) => a.position - b.position);
                      return (
                        <section key={status.id} onDragEnter={() => setDropTarget(status.id)} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropTarget(null); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/plain"); setDropTarget(null); if (id) act(() => store.reorderTask(userId, id, status.id, columnTasks.length)); }} className={`min-h-[390px] rounded-xl p-3 transition-colors ${dropTarget === status.id ? "bg-brand-100 ring-2 ring-brand-300" : "bg-[#f0f1f7]"}`}>
                          <div className="mb-3 flex items-center justify-between px-1">
                            <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${status.id === "todo" ? "bg-slate-400" : status.id === "in_progress" ? "bg-brand-500" : "bg-emerald-500"}`} /><h3 className="text-xs font-bold text-ink-900">{status.name}</h3><span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold text-ink-500">{columnTasks.length}</span></div>
                            <button type="button" onClick={() => openTask(null, status.id)} aria-label={`Add task to ${status.name}`} className="rounded-md p-1 text-ink-500 hover:bg-white hover:text-brand-600"><Plus size={15} /></button>
                          </div>
                          <div className="space-y-2.5">
                                {columnTasks.map((task) => <TaskCard key={task.id} task={task} users={users} status={status} onOpen={() => openTask(task)} onDrop={(taskId, position) => act(() => store.reorderTask(userId, taskId, status.id, position))} />)}
                            {columnTasks.length === 0 && <div className="grid min-h-28 place-items-center rounded-xl border border-dashed border-ink-300 bg-white/50 px-3 text-center text-xs text-ink-500">Drop a task here or add one to get started.</div>}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-sm">
                    <div className="grid grid-cols-[minmax(220px,1.8fr)_minmax(110px,0.8fr)_minmax(120px,1fr)_100px_110px] gap-3 border-b border-ink-100 bg-[#fafbfe] px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-ink-500"><span>Task</span><span>Status</span><span>Assignees</span><span>Priority</span><span>Due date</span></div>
                    {sortedTasks.map((task) => {
                      const status = statuses.find((item) => item.id === task.statusId);
                      return <button key={task.id} type="button" onClick={() => openTask(task)} className="grid w-full grid-cols-[minmax(220px,1.8fr)_minmax(110px,0.8fr)_minmax(120px,1fr)_100px_110px] items-center gap-3 border-b border-ink-100 px-4 py-3 text-left text-xs transition last:border-b-0 hover:bg-brand-50/40 focus:outline-none focus:bg-brand-50"><span className="truncate font-semibold text-ink-900">{task.title}</span><span><span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${statusStyle[task.statusId] ?? "bg-slate-100 text-slate-700"}`}>{status?.name}</span></span><span className="flex -space-x-2">{task.assigneeIds.map((id) => users.find((user) => user.id === id)).filter((user): user is User => Boolean(user)).map((user) => <span key={user.id} title={user.name} className={`grid h-6 w-6 place-items-center rounded-full border-2 border-white text-[8px] font-bold text-white ${avatarColor[user.id] ?? "bg-slate-500"}`}>{user.initials}</span>)}{task.assigneeIds.length === 0 && <span className="text-[10px] text-ink-500">Unassigned</span>}</span><span className={`w-fit rounded-md px-2 py-1 text-[10px] font-bold uppercase ring-1 ring-inset ${priorityStyle[task.priority]}`}>{task.priority}</span><span className="inline-flex items-center gap-1 text-[11px] text-ink-500"><Clock3 size={12} />{dateLabel(task.dueDate)}</span></button>;
                    })}
                    {sortedTasks.length === 0 && <div className="px-6 py-16 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600"><Search size={18} /></div><p className="mt-4 text-sm font-semibold text-ink-900">No tasks found</p><p className="mt-1 text-xs text-ink-500">Try a different search or create a task for this list.</p></div>}
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between text-[10px] text-ink-500"><span>Showing {visibleTasks.length} of {tasks.length} tasks</span><span className="hidden items-center gap-1 sm:flex"><GripVertical size={12} />Drag cards to update status and order</span></div>
              </>
            )}
          </section>
          <footer className="mx-5 mt-3 flex items-center justify-between border-t border-ink-100 px-1 py-4 text-[10px] text-ink-500 sm:mx-8"><span>Flowboard · Built for teams that like clarity</span><span>All changes are local to this demo</span></footer>
        </main>
      </div>
      {drawerTask !== undefined && selectedList && <TaskDrawer task={drawerTask} listId={selectedList.id} statuses={statuses} initialStatusId={newTaskStatusId} lists={lists} users={users} onClose={closeTaskDrawer} onSave={saveTask} onDelete={drawerTask ? () => act(() => { store.deleteTask(userId, drawerTask.id); closeTaskDrawer(); }) : undefined} />}
      {containerDialog && <ContainerDialog mode={containerDialog === "create" ? "create" : "rename"} containers={visibleContainers} initialContainer={containerDialog === "create" ? undefined : containerDialog} onClose={() => setContainerDialog(null)} onSubmit={commitContainer} />}
    </div>
  );
}

export default App;
