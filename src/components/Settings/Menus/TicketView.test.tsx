import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import TicketView from "./TicketView";
import type { TicketDetail } from "../../../types/tickets.types";

// ✅ Import after mocks typing
import { ticketsApi, clinicsApi } from "../../../services/tickets.api";
import TemplateService from "../../../services/templates.api";

// ✅ Mock APIs
vi.mock("../../../services/tickets.api", () => ({
  ticketsApi: {
    getTicketById: vi.fn(),
    updateTicketStatus: vi.fn(),
    assignTicket: vi.fn(),
    updateTicket: vi.fn(),
  },
  clinicsApi: {
    getClinicEmployees: vi.fn(),
  },
}));

vi.mock("../../../services/templates.api", () => ({
  default: {
    getTemplates: vi.fn(),
  },
}));

// ✅ Mock children (unit isolation)
vi.mock("../Menus/TicketContentPanel", () => ({
  default: () => <div data-testid="ticket-content">Ticket Content Panel</div>,
}));

vi.mock("../Menus/TicketPropertiesSidebar", () => ({
  default: ({
    handleUpdate,
    setStatus,
  }: {
    handleUpdate: () => void;
    setStatus: (value: string) => void;
  }) => (
    <div>
      <button
        data-testid="change-status"
        onClick={() => setStatus("closed")}
      >
        Change Status
      </button>

      <button data-testid="update-btn" onClick={handleUpdate}>
        Update
      </button>
    </div>
  ),
}));


vi.mock("../Menus/TicketDailogs", () => ({
  default: () => <div data-testid="ticket-dialogs" />,
}));

// ✅ Mock toast (typed)
vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// ✅ Create typed mocked versions
const mockedTicketsApi = vi.mocked(ticketsApi);
const mockedClinicsApi = vi.mocked(clinicsApi);
const mockedTemplateService = vi.mocked(TemplateService);

// ✅ Test Data (STRICT TYPES)

const mockTicket: TicketDetail = {
  id: "1",
  ticket_no: "TICKET-001",
  subject: "Test Ticket",
  description: "Test Description",

  priority: "low",
  status: "new",

  lab: "1",
  department: 1,
  lab_name: "Main Lab",
  department_name: "Microbiology",

  requested_by: "user@test.com",
  assigned_to: 2,

  created_at: "2024-01-01T10:00:00Z",
  updated_at: "2024-01-01T10:00:00Z",
  is_deleted: false,
};

const mockEmployees = [
  {
    id: 2,
    emp_name: "John",
    emp_type: "staff",
    department_name: "Lab",
  },
];

const renderComponent = () =>
  render(
    <MemoryRouter initialEntries={["/tickets/1"]}>
      <Routes>
        <Route path="/tickets/:id" element={<TicketView />} />
      </Routes>
    </MemoryRouter>
  );

describe("TicketView", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedTicketsApi.getTicketById.mockResolvedValue(mockTicket);
    mockedClinicsApi.getClinicEmployees.mockResolvedValue(mockEmployees);
    mockedTemplateService.getTemplates.mockResolvedValue([]);
  });

  it("shows loader initially", () => {
    renderComponent();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("loads and displays ticket number", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("TN-001")).toBeInTheDocument();
    });
  });

  it("renders child panels", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("ticket-content")).toBeInTheDocument();
      expect(screen.getByTestId("ticket-dialogs")).toBeInTheDocument();
    });
  });

  it("calls update flow", async () => {
    mockedTicketsApi.updateTicketStatus.mockResolvedValue({} as never);
    mockedTicketsApi.assignTicket.mockResolvedValue({} as never);
    mockedTicketsApi.updateTicketStatus.mockResolvedValue({} as never);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("update-btn")).toBeInTheDocument();
    });

fireEvent.click(screen.getByTestId("change-status"));

// ✅ wait for React state update to flush
await waitFor(() => {
  // nothing to check — just allow re-render
  expect(true).toBe(true);
});

fireEvent.click(screen.getByTestId("update-btn"));

await waitFor(() => {
  expect(mockedTicketsApi.updateTicketStatus).toHaveBeenCalled();
});
  });

  it("handles API error", async () => {
    mockedTicketsApi.getTicketById.mockRejectedValue(new Error("API Error"));

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load ticket details from server.")
      ).toBeInTheDocument();
    });
  });
});







