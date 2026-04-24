import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BulkActionBar from "./BulkActionBar";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import type { ComponentProps } from "react";
import "@testing-library/jest-dom"; // Essential for .toBeInTheDocument()

// ---------------- MOCK leadSlice ----------------
vi.mock("../../store/leadSlice", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../store/leadSlice")>();

  type MockThunk = {
    (ids: string[]): { type: string; payload: string[] };
    fulfilled: {
      match: (action: unknown) => boolean;
    };
  };

  const deleteLeads: MockThunk = Object.assign(
    (ids: string[]) => ({
      type: "lead/deleteLeads",
      payload: ids,
    }),
    {
      fulfilled: {
        match: () => true,
      },
    }
  );

  return {
    ...actual,        // ✅ keeps selectors like selectDeletingIds
    deleteLeads,      // ✅ overrides only thunk
  };
});
// ---------------- MOCK LeadAPI ----------------
vi.mock("../../services/leads.api", () => ({
  LeadAPI: {
    inactivate: vi.fn(() => Promise.resolve()),
    activate: vi.fn(() => Promise.resolve()),
  },
}));

// ---------------- CREATE TEST STORE ----------------
function createTestStore() {
  return configureStore({
    reducer: {
      // MUST match selector expectation: state.leads
      leads: () => ({
        deletingIds: [],
        leads: [],
        archivedLeads: [],
        loading: false,
        error: null,
      }),
    },
  });
}


// ---------------- RENDER HELPER ----------------
type BulkProps = ComponentProps<typeof BulkActionBar>;

function renderComponent(overrideProps?: Partial<BulkProps>) {
  const store = createTestStore();

  const defaultProps: BulkProps = {
    selectedIds: ["Lead-1"],
    tab: "active",
    onDelete: vi.fn(),
    onArchive: vi.fn(),
    onSendEmail: vi.fn(),
  };

  const finalProps = { ...defaultProps, ...overrideProps };

  return {
    ...render(
      <Provider store={store}>
        <BulkActionBar {...finalProps} />
      </Provider>
    ),
    props: finalProps,
  };
}

// =====================================================
// TESTS
// =====================================================

describe("BulkActionBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when no selection", () => {
    const { container } = renderComponent({ selectedIds: [] });
    expect(container.firstChild).toBeNull();
  });

  it("renders action buttons when items selected", () => {
    renderComponent();
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("Archive")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("opens delete dialog", () => {
    renderComponent();
    fireEvent.click(screen.getByText("Delete"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("opens archive dialog", () => {
    renderComponent();
    fireEvent.click(screen.getByText("Archive"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("opens email selector dialog", () => {
    renderComponent();
    fireEvent.click(screen.getByText("Email"));
    expect(screen.getByText("New Email")).toBeInTheDocument();
    expect(screen.getByText("Select Email Template")).toBeInTheDocument();
  });

  it("selects an email template", () => {
    renderComponent();
    fireEvent.click(screen.getByText("Email"));
    // Assuming this text exists in your mock or component
    const template = screen.getByText("IVF Next Steps Form Request");
    fireEvent.click(template);
    expect(template).toBeInTheDocument();
  });

  it("opens compose email screen", () => {
    renderComponent();
    fireEvent.click(screen.getByText("Email"));
    fireEvent.click(screen.getByText("Compose New Email"));
    expect(screen.getByPlaceholderText("To :")).toBeInTheDocument();
  });

  it("enables Send button when fields are filled", () => {
    renderComponent();
    fireEvent.click(screen.getByText("Email"));
    fireEvent.click(screen.getByText("Compose New Email"));

    fireEvent.change(screen.getByPlaceholderText("To :"), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Subject :"), {
      target: { value: "Hello" },
    });
    fireEvent.change(screen.getByPlaceholderText("Type your message here..."), {
      target: { value: "Message body" },
    });

    expect(screen.getByText("Send")).not.toBeDisabled();
  });

  it("calls onSendEmail when Send clicked", () => {
    const onSendEmail = vi.fn();
    renderComponent({ onSendEmail });

    fireEvent.click(screen.getByText("Email"));
    fireEvent.click(screen.getByText("Compose New Email"));

    fireEvent.change(screen.getByPlaceholderText("To :"), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Subject :"), {
      target: { value: "Hello" },
    });
    fireEvent.change(screen.getByPlaceholderText("Type your message here..."), {
      target: { value: "Message body" },
    });

    fireEvent.click(screen.getByText("Send"));

    expect(onSendEmail).toHaveBeenCalledWith(
      "user@test.com",
      "Hello",
      "Message body",
      undefined
    );
  });

  it("shows Restore button when tab is archived", () => {
    renderComponent({ tab: "archived" });
    expect(screen.getByText("Restore")).toBeInTheDocument();
  });
});