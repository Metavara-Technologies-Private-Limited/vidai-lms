/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import dayjs from "dayjs";
import SocialCampaignModal from "../../../components/Layout/Campaign/SocialCampaignModal";

/* ================= MOCK MUI ================= */

vi.mock("@mui/material", async () => {
  const actual = await vi.importActual<any>("@mui/material");
  return {
    ...actual,
    Modal: ({ children }: any) => <div>{children}</div>,
    Select: ({ value, onChange }: any) => (
      <select
        data-testid="mock-select"
        value={value}
        onChange={(e) => onChange({ target: { value: e.target.value } })}
      >
        <option value="">Select</option>
        <option value="leads">Lead Generation</option>
        <option value="all">All Users</option>
      </select>
    ),
  };
});

/* ================= MOCK DATE PICKERS ================= */

vi.mock("@mui/x-date-pickers/LocalizationProvider", () => ({
  LocalizationProvider: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@mui/x-date-pickers/DatePicker", () => ({
  DatePicker: ({ onChange, label }: any) => (
    <input
      data-testid="mock-date"
      placeholder={label || "date"}
      onClick={() => onChange(dayjs("2024-01-01"))}
      onChange={() => onChange(dayjs("2024-01-01"))}
    />
  ),
}));

vi.mock("@mui/x-date-pickers/TimePicker", () => ({
  TimePicker: ({ onChange, label }: any) => (
    <input
      data-testid="mock-time"
      placeholder={label || "time"}
      onClick={() => onChange(dayjs("2024-01-01 10:00"))}
      onChange={() => onChange(dayjs("2024-01-01 10:00"))}
    />
  ),
}));

/* ================= MOCK API ================= */

const mockCreate = vi.fn(() =>
  Promise.resolve({ data: { id: 1 } })
);

vi.mock("../../../../src/services/campaign.api", () => ({
  CampaignAPI: {
    create: mockCreate,
  },
}));

/* ================= MOCK TOAST ================= */

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

/* ================================================= */

async function fillStep1() {
  fireEvent.change(
    screen.getByPlaceholderText(/New Product Launch/i),
    { target: { value: "Test Campaign" } }
  );

  fireEvent.change(
    screen.getByPlaceholderText(/Contains records/i),
    { target: { value: "Description" } }
  );

  const selects = screen.getAllByTestId("mock-select");
  fireEvent.change(selects[0], { target: { value: "leads" } });
  fireEvent.change(selects[1], { target: { value: "all" } });

  await act(async () => {
    const dates = screen.getAllByTestId("mock-date");
    fireEvent.click(dates[0]);
    fireEvent.click(dates[1]);
  });

  fireEvent.click(screen.getByText(/Next/i));

  // Target the <h6> heading specifically to avoid matching the stepper <span>
  await waitFor(() =>
    expect(
      screen.getByRole("heading", { name: /Content & Configuration/i })
    ).toBeInTheDocument()
  );
}

/* ================================================= */

describe("SocialCampaignModal - Buttons Flow", () => {
  beforeEach(() => {
    mockCreate.mockClear();
  });

  /* ---------------------------------------------- */
  test("Cancel button should call onClose", () => {
    const onClose = vi.fn();
    render(<SocialCampaignModal onClose={onClose} onSave={vi.fn()} />);
    fireEvent.click(screen.getByText(/Cancel/i));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  /* ---------------------------------------------- */
  test("Next button should move to next step (after valid inputs)", async () => {
    render(<SocialCampaignModal onClose={vi.fn()} onSave={vi.fn()} />);
    await fillStep1();
    expect(
      screen.getByRole("heading", { name: /Content & Configuration/i })
    ).toBeInTheDocument();
  });
});