/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import dayjs from "dayjs";
import EmailCampaignModal from "./EmailCampaignModal";

/* ---------------- MOCK TEMPLATE MODAL ---------------- */

vi.mock(
  "../../../components/Layout/Campaign/EmailTemplateModal",
  () => ({
    default: () => null,
  })
);

/* ---------------- MOCK MUI ---------------- */

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
        <option value="all">All Subscribers</option>
      </select>
    ),
  };
});

/* ---------------- MOCK DATE PICKER ---------------- */

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

/* ---------------- MOCK API ---------------- */

const mockCreate = vi.fn(() =>
  Promise.resolve({
    data: {
      id: 1,
      campaign_name: "Email Test",
      campaign_mode: 2,
      is_active: false,
      start_date: "2024-01-01",
      end_date: "2024-01-10",
      selected_start: "2024-01-01T10:00:00",
    },
  })
);

vi.mock("../../../../src/services/campaign.api", () => ({
  CampaignAPI: {
    create: mockCreate,
  },
}));

/* ---------------- MOCK TOAST ---------------- */

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

/* ================================================= */

async function fillStep1() {
  fireEvent.change(
    screen.getByPlaceholderText("e.g. New Product Launch"),
    { target: { value: "Test Campaign" } }
  );

  fireEvent.change(
    screen.getByPlaceholderText("Short description of campaign"),
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

  fireEvent.click(screen.getByText("Next"));

  await waitFor(() =>
    expect(
      screen.getByRole("heading", { name: /Email Setup/i, level: 2 })
    ).toBeInTheDocument()
  );
}

/* ================================================= */

describe("EmailCampaignModal Buttons", () => {
  beforeEach(() => {
    mockCreate.mockClear();
  });

  /* ---------------------------------------------- */
  test("Cancel button should call onClose", () => {
    const onClose = vi.fn();
    render(<EmailCampaignModal onClose={onClose} onSave={vi.fn()} />);
    fireEvent.click(screen.getAllByText("Cancel")[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  /* ---------------------------------------------- */
  test("Next button moves Step 1 → Step 2", async () => {
    render(<EmailCampaignModal onClose={vi.fn()} onSave={vi.fn()} />);
    await fillStep1();
    expect(
      screen.getByRole("heading", { name: /Email Setup/i, level: 2 })
    ).toBeInTheDocument();
  });
});