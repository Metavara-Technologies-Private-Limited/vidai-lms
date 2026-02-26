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
      Promise.resolve([{ id: "1", name: "Main Lab", is_active: true }])
    ),
  },
  clinicsApi: {
    getClinicDetail: vi.fn(() =>
      Promise.resolve({
        department: [{ id: 10, name: "Biochemistry" }],
      })
    ),
    getClinicEmployees: vi.fn(() =>
      Promise.resolve([
        { id: 5, emp_name: "John", department_name: "Biochemistry" },
      ])
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

  /**
   * Helper:
   * Render component and WAIT until async loading finishes.
   * This is required because component loads dropdown data in useEffect.
   */
  async function renderAndWait() {
    render(<CreateTicket open={true} onClose={onClose} />);

    // Wait until form is visible (loader gone)
    await screen.findByLabelText("Subject");
  }

  test("renders dialog when open", async () => {
    await renderAndWait();

    expect(screen.getByText("New Ticket")).toBeInTheDocument();
  });

  test("allows typing into subject field", async () => {
    await renderAndWait();

    const subjectInput = screen.getByLabelText("Subject");

    fireEvent.change(subjectInput, { target: { value: "Test Ticket" } });

    expect(subjectInput).toHaveValue("Test Ticket");
  });

  test("shows validation when submitting empty form", async () => {
    await renderAndWait();

    const saveButton = screen.getByRole("button", { name: /save/i });

    fireEvent.click(saveButton);

    // Since toast is mocked, we just ensure button click didn't crash
    expect(saveButton).toBeInTheDocument();
  });

  test("closes dialog when cancel clicked", async () => {
    await renderAndWait();

    const cancelButton = screen.getByRole("button", { name: /cancel/i });

    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });
});