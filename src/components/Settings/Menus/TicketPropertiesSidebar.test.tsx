import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import TicketPropertiesSidebar from "./TicketPropertiesSidebar";
import type {
  TicketDetail,
  Employee,
  TicketStatus,
  TicketPriority,
} from "../../../types/tickets.types";

// ---- Minimal safe ticket fixture ----
const ticket = {
  id: "1",
  ticket_no: "TICK-001",
  subject: "System Error",
  lab_name: "Main Lab",
  created_at: "2024-01-01T10:00:00Z",
  requested_by: "John Doe",
  department_name: "Biochemistry",
  assigned_to: 2,
  timeline: [
    {
      id: "t1",
      action: "Ticket Created",
      created_at: "2024-01-01T10:00:00Z",
    },
  ],
} as unknown as TicketDetail;

const employees: Employee[] = [
  {
    id: 2,
    emp_name: "Dr Smith",
  } as Employee,
];

const statusValue: TicketStatus = "new";
const priorityValue: TicketPriority = "medium";

describe("TicketPropertiesSidebar", () => {
  const setTab = vi.fn();
  const setType = vi.fn();
  const setStatus = vi.fn();
  const setPriority = vi.fn();
  const setAssignTo = vi.fn();
  const handleUpdate = vi.fn();

  const baseProps = {
    ticket,
    employees,

    tab: 0,
    setTab,

    type: "Issue",
    setType,

    status: statusValue,
    setStatus,

    priority: priorityValue,
    setPriority,

    assignTo: 2,
    setAssignTo,

    handleUpdate,
    updating: false,

    ticketTypes: ["Issue", "Bug", "Request"],
  };

  test("renders nothing when ticket is null", () => {
    const { container } = render(
      <TicketPropertiesSidebar {...baseProps} ticket={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders ticket details", () => {
    render(<TicketPropertiesSidebar {...baseProps} />);

    expect(screen.getByText("Ticket Details")).toBeInTheDocument();
    expect(screen.getByText("System Error")).toBeInTheDocument();
    expect(screen.getByText("Main Lab")).toBeInTheDocument();
  });

  test("calls setTab when switching tabs", () => {
    render(<TicketPropertiesSidebar {...baseProps} />);

    fireEvent.click(screen.getByText("Timeline"));

    expect(setTab).toHaveBeenCalled();
  });

  test("calls handleUpdate when clicking Update button", () => {
    render(<TicketPropertiesSidebar {...baseProps} />);

    fireEvent.click(screen.getByText("Update"));

    expect(handleUpdate).toHaveBeenCalled();
  });

  test("renders timeline when tab = 1", () => {
    render(<TicketPropertiesSidebar {...baseProps} tab={1} />);

    expect(screen.getByText("Ticket Created")).toBeInTheDocument();
  });

  test("shows loading spinner when updating = true", () => {
    render(<TicketPropertiesSidebar {...baseProps} updating={true} />);

    const spinner = document.querySelector("svg"); // CircularProgress renders svg
    expect(spinner).not.toBeNull();
  });
});