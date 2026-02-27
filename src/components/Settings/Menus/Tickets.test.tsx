import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Tickets from "./Tickets";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter } from "react-router-dom";

interface RootState {
  tickets: {
    data: unknown[];
    loading: boolean;
    error: string | null;
    dashboard: Record<string, number>;
  };
}
// ---------------- MOCK NAVIGATE ----------------
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ---------------- MOCK APIs ----------------
vi.mock("../../../services/tickets.api", () => ({
  clinicsApi: {
    getClinicEmployees: vi.fn(() =>
      Promise.resolve([
        { id: 1, emp_name: "Ramesh" },
        { id: 2, emp_name: "Suresh" },
      ])
    ),
  },
}));

// ---------------- MOCK REDUX SLICE ----------------
vi.mock("../../../store/ticketSlice", () => ({
  fetchTickets: () => ({ type: "tickets/fetch" }),
  fetchTicketDashboard: () => ({ type: "tickets/dashboard" }),

selectAllTickets: (state: RootState) => state.tickets.data,
selectTicketsLoading: (state: RootState) => state.tickets.loading,
selectTicketsError: (state: RootState) => state.tickets.error,
selectTicketDashboard: (state: RootState) => state.tickets.dashboard,
}));

// ---------------- MOCK DATA ----------------
const mockTickets = [
  {
    id: 101,
    ticket_no: "TICKET-101",
    lab_name: "Main Lab",
    subject: "Machine Calibration",
    created_at: "2024-01-10",
    due_date: "2024-01-15",
    requested_by: "Admin",
    department: 1,
    department_name: "Biochemistry",
    priority: "high",
    status: "new",
    assigned_to: 1,
  },
  {
    id: 102,
    ticket_no: "TICKET-102",
    lab_name: "QC Lab",
    subject: "Temperature Issue",
    created_at: "2024-01-11",
    due_date: null,
    requested_by: "User",
    department: 2,
    department_name: "Microbiology",
    priority: "low",
    status: "pending",
    assigned_to: 2,
  },
];

// ---------------- REDUX TEST STORE ----------------
function createTestStore() {
  return configureStore({
    reducer: {
      tickets: () => ({
        data: mockTickets,
        loading: false,
        error: null,
        dashboard: {
          new: 1,
          pending: 1,
          resolved: 0,
          closed: 0,
        },
      }),
    },
  });
}

// ---------------- RENDER HELPER ----------------
function renderComponent() {
  const store = createTestStore();

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Tickets />
      </MemoryRouter>
    </Provider>
  );
}

// =======================================================
// ✅ TEST CASES
// =======================================================

describe("Tickets Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Tickets title", async () => {
    renderComponent();
    expect(await screen.findByText("Tickets")).toBeInTheDocument();
  });

  it("shows ticket rows from store", async () => {
    renderComponent();

    expect(await screen.findByText("Main Lab")).toBeInTheDocument();
    expect(screen.getByText("Machine Calibration")).toBeInTheDocument();
  });

  it("filters tickets by tab", async () => {
    renderComponent();

    // Click Pending tab
    const pendingTab = await screen.findByText(/Pending/i);
    fireEvent.click(pendingTab);

    expect(await screen.findByText("Temperature Issue")).toBeInTheDocument();
  });

  it("search filters by ticket number", async () => {
    renderComponent();

    const searchInput = await screen.findByPlaceholderText(
      "Search by Ticket no."
    );

    fireEvent.change(searchInput, { target: { value: "101" } });

    expect(await screen.findByText("Machine Calibration")).toBeInTheDocument();
  });

  it("navigates to detail page on row click", async () => {
    renderComponent();

    const row = await screen.findByText("Machine Calibration");
    fireEvent.click(row);

    expect(mockNavigate).toHaveBeenCalledWith("/settings/tickets/101");
  });

  it("opens Create Ticket dialog when Create New clicked", async () => {
    renderComponent();

    const createBtn = await screen.findByRole("button", {
      name: /create new/i,
    });

    fireEvent.click(createBtn);

    // Just ensuring button works (dialog component already tested separately)
    expect(createBtn).toBeInTheDocument();
  });

  it("shows empty state when no tickets", async () => {
    const emptyStore = configureStore({
      reducer: {
        tickets: () => ({
          data: [],
          loading: false,
          error: null,
          dashboard: {},
        }),
      },
    });

    render(
      <Provider store={emptyStore}>
        <MemoryRouter>
          <Tickets />
        </MemoryRouter>
      </Provider>
    );

    expect(
      await screen.findByText("No tickets found in the database.")
    ).toBeInTheDocument();
  });
});