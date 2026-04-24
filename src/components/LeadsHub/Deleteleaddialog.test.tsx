import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import DeleteLeadDialog from "./DeleteLeadDialog";

// ---------------- RENDER HELPER ----------------
function renderComponent(overrideProps?: Partial<React.ComponentProps<typeof DeleteLeadDialog>>) {
  const defaultProps = {
    open: true,
    leadName: "John Smith",
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  const finalProps = { ...defaultProps, ...overrideProps };

  return {
    ...render(<DeleteLeadDialog {...finalProps} />),
    props: finalProps,
  };
}

// =====================================================
// TESTS
// =====================================================

describe("DeleteLeadDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- Rendering ----

  it("renders nothing when open is false", () => {
    const { container } = renderComponent({ open: false });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("renders dialog when open is true", () => {
    renderComponent();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows the Delete Lead title", () => {
    renderComponent();
    expect(screen.getByText("Delete Lead")).toBeInTheDocument();
  });

  it("displays the lead name in the confirmation message", () => {
    renderComponent({ leadName: "Jane Doe" });
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("renders Cancel and Delete buttons", () => {
    renderComponent();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  // ---- Lead ID ----

  it("does not show lead ID section when leadId is not provided", () => {
    renderComponent();
    expect(screen.queryByText(/^ID:/)).toBeNull();
  });

  it("shows lead ID when provided", () => {
    renderComponent({ leadId: "LEAD-42" });
    expect(screen.getByText("ID: LEAD-42")).toBeInTheDocument();
  });

  // ---- Error state ----

  it("does not show error alert by default", () => {
    renderComponent();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows error alert when error prop is provided", () => {
    renderComponent({ error: "Something went wrong" });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("does not show error alert when error is null", () => {
    renderComponent({ error: null });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  // ---- Deleting state ----

  it("shows 'Deleting...' text when isDeleting is true", () => {
    renderComponent({ isDeleting: true });
    expect(screen.getByText("Deleting...")).toBeInTheDocument();
  });

  it("shows spinner when isDeleting is true", () => {
    renderComponent({ isDeleting: true });
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("disables Cancel button when isDeleting is true", () => {
    renderComponent({ isDeleting: true });
    expect(screen.getByText("Cancel").closest("button")).toBeDisabled();
  });

  it("disables Delete button when isDeleting is true", () => {
    renderComponent({ isDeleting: true });
    expect(screen.getByText("Deleting...").closest("button")).toBeDisabled();
  });

  it("Cancel and Delete buttons are enabled when not deleting", () => {
    renderComponent({ isDeleting: false });
    expect(screen.getByText("Cancel").closest("button")).not.toBeDisabled();
    expect(screen.getByText("Delete").closest("button")).not.toBeDisabled();
  });

  // ---- Callbacks ----

  it("calls onClose when Cancel is clicked", () => {
    const onClose = vi.fn();
    renderComponent({ onClose });
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when Delete is clicked", () => {
    const onConfirm = vi.fn();
    renderComponent({ onConfirm });
    fireEvent.click(screen.getByText("Delete"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("does not call onConfirm when Delete button is disabled", () => {
    const onConfirm = vi.fn();
    renderComponent({ onConfirm, isDeleting: true });
    fireEvent.click(screen.getByText("Deleting...").closest("button")!);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("does not call onClose when Cancel button is disabled", () => {
    const onClose = vi.fn();
    renderComponent({ onClose, isDeleting: true });
    fireEvent.click(screen.getByText("Cancel").closest("button")!);
    expect(onClose).not.toHaveBeenCalled();
  });
});