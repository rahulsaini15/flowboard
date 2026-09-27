import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";

describe("Flowboard", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("renders the workspace board, supports task creation, and reflects user permissions", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("Tighten sign-in error states")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Backlog" })).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "New task" }));
    await user.type(screen.getByPlaceholderText("What needs to get done?"), "Ship the assessment");
    await user.click(screen.getByRole("button", { name: "Create task" }));
    expect(screen.getByText("Ship the assessment")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Switch user"), "bob");
    await waitFor(() => expect(screen.getByRole("button", { name: /Sprint 24/ })).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /Launch checklist/ })).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Switch user"), "carol");
    await waitFor(() => expect(screen.getByRole("button", { name: /Launch checklist/ })).toBeInTheDocument());
  });

  it("opens task details and closes them with Escape", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findAllByRole("button", { name: "Edit task: Tighten sign-in error states" });
    await user.click(screen.getAllByRole("button", { name: "Edit task: Tighten sign-in error states" })[0]);
    expect(screen.getByRole("dialog", { name: "Task details" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Task details" })).not.toBeInTheDocument();
  });

  it("edits and saves a task directly from its board card", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Tighten sign-in error states");
    await user.click(screen.getAllByRole("button", { name: "Edit task: Tighten sign-in error states" })[0]);
    const title = screen.getByRole("textbox", { name: "Task title" });
    await user.clear(title);
    await user.type(title, "Updated directly from the board");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("button", { name: "Edit task: Updated directly from the board" })).toBeInTheDocument();
  });
});
