import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import FilterTickets from "./FilterTicket";

// ---- MOCK API ----
vi.mock("../../../services/tickets.api", () => ({
  clinicsApi: {
    getClinicDetail: vi.fn(() =>
      Promise.resolve({
        department: [
          { id: 1, name: "Biochemistry" },
          { id: 2, name: "Microbiology" },
        ],
      })
    ),
  },
}));

describe("FilterTickets Component", () => {
  const onClose = vi.fn();
  const onApply = vi.fn();

  async function renderAndWait() {
    render(<FilterTickets open={true} onClose={onClose} onApply={onApply} />);

    // Wait until Department dropdown appears (API finished)
    await screen.findByLabelText("Department");
  }

  test("renders dialog", async () => {
    await renderAndWait();
    expect(screen.getByText("Filter By")).toBeInTheDocument();
  });

  test("allows selecting priority", async () => {
    await renderAndWait();

    const priorityField = screen.getByLabelText("Priority");
    fireEvent.mouseDown(priorityField);

    const option = await screen.findByText("High");
    fireEvent.click(option);

    expect(priorityField).toBeInTheDocument();
  });

  test("apply button sends selected filters", async () => {
    await renderAndWait();

    fireEvent.click(screen.getByRole("button", { name: /apply/i }));

    expect(onApply).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  test("clear button resets filters and closes dialog", async () => {
    await renderAndWait();

    fireEvent.click(screen.getByRole("button", { name: /clear all/i }));

    expect(onApply).toHaveBeenCalledWith(null);
    expect(onClose).toHaveBeenCalled();
  });
});