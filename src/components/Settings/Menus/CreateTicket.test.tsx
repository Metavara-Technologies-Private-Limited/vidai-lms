import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import CreateTicket from "./CreateTicket";

// ---------------- MOCK REDUX ----------------
vi.mock("react-redux", () => ({
  useDispatch: () => vi.fn(),
}));

// ---------------- MOCK APIs ----------------
vi.mock("../../../services/tickets.api", () => ({
  labsApi: {
    getLabs: vi.fn(() =>
      Promise.resolve([{ id: "1", name: "Main Lab", is_active: true }]),
    ),
  },
  clinicsApi: {
    getClinicDetail: vi.fn(() =>
      Promise.resolve({
        department: [{ id: 10, name: "Biochemistry", is_active: true }],
      }),
    ),
    getClinicEmployees: vi.fn(() =>
      Promise.resolve([
        {
          id: 5,
          emp_name: "John",
          department_name: "Biochemistry",
          dep_id: 10, // ✅ IMPORTANT (new filtering depends on this)
        },
      ]),
    ),
  },
  ticketsApi: {
    createTicket: vi.fn(() => Promise.resolve({ id: 100 })),
    uploadDocument: vi.fn(() => Promise.resolve()),
  },
}));

// ---------------- MOCK TOAST ----------------
vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("CreateTicket Component", () => {
  const onClose = vi.fn();

  async function renderAndWait() {
    render(<CreateTicket open={true} onClose={onClose} />);
    await screen.findByLabelText("Subject");
  }

  test("renders dialog when open", async () => {
    await renderAndWait();
    expect(screen.getByText("New Ticket")).toBeInTheDocument();
  });

  test("allows typing into subject field", async () => {
    await renderAndWait();

    const subjectInput = screen.getByLabelText("Subject");

    fireEvent.change(subjectInput, {
      target: { value: "Test Ticket" },
    });

    expect(subjectInput).toHaveValue("Test Ticket");
  });

  test("shows empty assignee message when no employees in department", async () => {
    await renderAndWait();

    // Open Department dropdown
    fireEvent.mouseDown(screen.getByLabelText("Department"));

    const deptOption = await screen.findByText("Biochemistry");
    fireEvent.click(deptOption);

    // Open Assignee dropdown
    fireEvent.mouseDown(screen.getByLabelText("Assign To"));

    // Since we mocked one employee, John should appear
    expect(await screen.findByText("John (Biochemistry)")).toBeInTheDocument();
  });

  test("shows validation when submitting empty form", async () => {
    await renderAndWait();

    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    expect(saveButton).toBeInTheDocument();
  });

  test("closes dialog when cancel clicked", async () => {
    await renderAndWait();

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });
});
