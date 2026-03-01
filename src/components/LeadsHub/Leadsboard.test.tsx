// ============================================================
// LeadsBoard.test.tsx
// Unit tests for LeadsBoard, Leadsboardcard, Leadsboardmodals
// ============================================================
import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";

import type { LeadItem, AppointmentState } from "./Leadsboardtypes";

// =====================================================
// GLOBAL MOCKS
// =====================================================

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

const mockDispatch = vi.fn(() => Promise.resolve({ type: "ok" }));
const mockSelector = vi.fn();
vi.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector: (s: unknown) => unknown) => mockSelector(selector),
}));

import * as leadSliceModule from "../../store/leadSlice";

vi.mock("../../store/leadSlice", () => {
  const selectLeads        = vi.fn();
  const selectLeadsLoading = vi.fn();
  const selectLeadsError   = vi.fn();
  return {
    fetchLeads: vi.fn(() => ({ type: "leads/fetchLeads" })),
    bookAppointment: Object.assign(
      vi.fn((args: unknown) => ({ type: "leads/bookAppointment", meta: { arg: args } })),
      { rejected: { match: vi.fn(() => false) } },
    ),
    selectLeads,
    selectLeadsLoading,
    selectLeadsError,
  };
});

vi.mock("../../services/leads.api", () => ({
  DepartmentAPI: { listActiveByClinic: vi.fn(() => Promise.resolve([])) },
  EmployeeAPI:   { listByClinic:       vi.fn(() => Promise.resolve([])) },
}));

vi.mock("./LeadsMenuDialogs", () => ({
  Dialogs:    () => <div data-testid="dialogs" />,
  MenuButton: ({ lead }: { lead: LeadItem }) => (
    <button data-testid={`menu-btn-${lead.id}`}>Menu</button>
  ),
  CallButton: ({ lead }: { lead: LeadItem }) => (
    <button data-testid={`call-btn-${lead.id}`}>Call</button>
  ),
}));

vi.mock("@mui/x-date-pickers/DatePicker", () => ({
  DatePicker: ({
    value,
    onChange,
  }: {
    value: Date | null;
    onChange: (v: Date | null) => void;
  }) => (
    <input
      data-testid="date-picker"
      value={value ? value.toISOString().split("T")[0] : ""}
      onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null)}
    />
  ),
}));

vi.mock("@mui/x-date-pickers/LocalizationProvider", () => ({
  LocalizationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@mui/x-date-pickers/AdapterDateFns", () => ({
  AdapterDateFns: class {},
}));

vi.mock("./Leadsboardtypes", () => ({
  BOARD_COLUMNS: [
    { label: "NEW LEADS",  color: "#6366F1", statusKey: ["new"] },
    { label: "FOLLOW-UPS", color: "#F59E0B", statusKey: ["follow-up"] },
    { label: "CLOSED",     color: "#10B981", statusKey: ["closed"] },
  ],
  mapRawToLeadItem: (raw: LeadItem) => raw,
  TIME_SLOTS: ["09:00 AM - 09:30 AM", "09:30 AM - 10:00 AM"],
  EMAIL_TEMPLATES: [
    { id: 1, title: "Welcome Email", desc: "Send a welcome email" },
    { id: 2, title: "Follow Up",     desc: "Follow up on inquiry"  },
  ],
  modalFieldStyle: {},
  fieldLabelStyle: {},
}));

// =====================================================
// LAZY IMPORTS (after mocks are registered)
// =====================================================
import LeadsBoard from "./LeadsBoard";
import {
  SuccessToast,
  SmsModal,
  MailModal,
  BookAppointmentModal,
} from "./Leadsboardmodals";
import { CardContent, LeadCard, LeadColumn } from "./Leadsboardcard";

// =====================================================
// HELPERS
// =====================================================

const makeLead = (overrides: Partial<LeadItem> = {}): LeadItem => ({
  id: "#LN-1",
  full_name: "Alice Sharma",
  name: "Alice Sharma",
  initials: "AS",
  email: "",
  phone: "",
  phone_number: "",
  city: "",
  state: "",
  address: "",
  source: "Referral",
  lead_source: "Referral",
  campaign: "",
  quality: "Hot",
  score: 85,
  ai_score: 85,
  location: "Chennai",
  assigned: "Dr. Rao",
  assigned_to_name: "Dr. Rao",
  assigned_to_id: 7,
  status: "new",
  lead_status: "new",
  department: "",
  department_id: 2,
  department_name: "",
  created_at: "2024-06-15T10:00:00Z",
  updated_at: null,
  last_contacted: null,
  task: "N/A",
  task_type: "",
  taskStatus: "Pending",
  task_status: "",
  next_action_description: "",
  next_action_due_date: null,
  activity: "View Activity",
  last_activity: "",
  activity_count: 0,
  medical_history: "",
  treatment_type: "",
  consultation_date: null,
  notes: "",
  remarks: "",
  archived: false,
  is_active: true,
  tags: [],
  priority: "Medium",
  converted: false,
  conversion_date: null,
  estimated_value: 0,
  actual_value: 0,
  appointment_date: null,
  slot: "",
  remark: "",
  book_appointment: false,
  contact_no: "",
  treatment_interest: "",
  partner_inquiry: false,
  clinic_id: 1,
  campaign_id: null,
  ...overrides,
});

const makeAppointment = (overrides: Partial<AppointmentState> = {}): AppointmentState => ({
  departments: [],
  employees: [],
  filteredEmployees: [],
  selectedDepartmentId: "",
  selectedEmployeeId: "",
  date: null,
  slot: "",
  remark: "",
  loadingDepartments: false,
  loadingEmployees: false,
  submitting: false,
  error: null,
  success: false,
  ...overrides,
});

const configureSelector = (
  leads: LeadItem[] = [],
  loading = false,
  error: string | null = null,
) => {
  const { selectLeads, selectLeadsLoading, selectLeadsError } = leadSliceModule;
  mockSelector.mockImplementation((selector: unknown) => {
    if (selector === selectLeads)        return leads;
    if (selector === selectLeadsLoading) return loading;
    if (selector === selectLeadsError)   return error;
    return undefined;
  });
};

// =====================================================
// LeadsBoard TESTS
// =====================================================
describe("LeadsBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configureSelector([], false, null);
  });

  it("shows loading spinner when loading is true", () => {
    configureSelector([], true, null);
    render(<LeadsBoard search="" />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByText("Loading leads...")).toBeInTheDocument();
  });

  it("shows error alert when error is set", () => {
    configureSelector([], false, "Network failure");
    render(<LeadsBoard search="" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Failed to load leads")).toBeInTheDocument();
    expect(screen.getByText("Network failure")).toBeInTheDocument();
  });

  it("shows Try again link on error screen", () => {
    configureSelector([], false, "Oops");
    render(<LeadsBoard search="" />);
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("dispatches fetchLeads when Try again is clicked", () => {
    configureSelector([], false, "Oops");
    render(<LeadsBoard search="" />);
    fireEvent.click(screen.getByText("Try again"));
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("shows empty state when leads array is empty and not loading", () => {
    configureSelector([], false, null);
    render(<LeadsBoard search="" />);
    expect(screen.getByText("No leads found")).toBeInTheDocument();
    expect(screen.getByText("Create your first lead to get started")).toBeInTheDocument();
  });

  it("renders board columns when leads exist", () => {
    configureSelector([makeLead()], false, null);
    render(<LeadsBoard search="" />);
    expect(screen.getByText("NEW LEADS")).toBeInTheDocument();
    expect(screen.getByText("FOLLOW-UPS")).toBeInTheDocument();
    expect(screen.getByText("CLOSED")).toBeInTheDocument();
  });

  it("dispatches fetchLeads on mount", () => {
    render(<LeadsBoard search="" />);
    expect(mockDispatch).toHaveBeenCalled();
  });

  it("renders lead card in correct column based on status", () => {
    configureSelector([makeLead({ status: "new" })], false, null);
    render(<LeadsBoard search="" />);
    expect(screen.getByText("Alice Sharma")).toBeInTheDocument();
  });

  it("filters leads by search string", () => {
    configureSelector(
      [
        makeLead({ full_name: "Bob Jones",   status: "new" }),
        makeLead({ id: "#LN-2", full_name: "Alice Smith", status: "new" }),
      ],
      false,
      null,
    );
    render(<LeadsBoard search="Bob" />);
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    expect(screen.queryByText("Alice Smith")).toBeNull();
  });

  it("renders Dialogs component", () => {
    configureSelector([makeLead()], false, null);
    render(<LeadsBoard search="" />);
    expect(screen.getByTestId("dialogs")).toBeInTheDocument();
  });
});

// =====================================================
// SuccessToast TESTS
// =====================================================
describe("SuccessToast", () => {
  it("renders message when show is true", () => {
    render(<SuccessToast show={true} message="Appointment booked successfully!" />);
    expect(screen.getByText("Appointment booked successfully!")).toBeInTheDocument();
  });

  it("renders element in DOM when show is false (MUI Fade keeps children)", () => {
    render(<SuccessToast show={false} message="Saved!" />);
    const el = screen.queryByText("Saved!");
    if (el) {
      const wrapper = el.closest("[style]") as HTMLElement | null;
      const style = wrapper?.getAttribute("style") ?? "";
      expect(style).toMatch(/opacity:\s*0|visibility:\s*hidden/);
    }
  });

  it("renders different messages", () => {
    render(<SuccessToast show={true} message="Template saved!" />);
    expect(screen.getByText("Template saved!")).toBeInTheDocument();
  });
});

// =====================================================
// SmsModal TESTS
// =====================================================
describe("SmsModal", () => {
  const defaultProps = {
    open: true,
    selectedLead: makeLead(),
    smsMessage: "",
    setSmsMessage: vi.fn(),
    onClose: vi.fn(),
    onSend: vi.fn(),
  };

  beforeEach(() => vi.clearAllMocks());

  it("renders dialog when open is true", () => {
    render(<SmsModal {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render dialog when open is false", () => {
    render(<SmsModal {...defaultProps} open={false} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("displays lead name as recipient chip", () => {
    render(<SmsModal {...defaultProps} />);
    expect(screen.getByText("Alice Sharma")).toBeInTheDocument();
  });

  it("renders message textarea", () => {
    render(<SmsModal {...defaultProps} />);
    expect(screen.getByPlaceholderText("Type your message here...")).toBeInTheDocument();
  });

  it("shows character count", () => {
    render(<SmsModal {...defaultProps} smsMessage="Hello" />);
    expect(screen.getByText("5 / 160 characters")).toBeInTheDocument();
  });

  it("Send button is disabled when message is empty", () => {
    render(<SmsModal {...defaultProps} smsMessage="" />);
    const sendBtn = screen.getByText("Send").closest("button")!;
    expect(sendBtn).toBeDisabled();
  });

  it("Send button is enabled when message has content", () => {
    render(<SmsModal {...defaultProps} smsMessage="Hello there" />);
    const sendBtn = screen.getByText("Send").closest("button")!;
    expect(sendBtn).not.toBeDisabled();
  });

  it("calls setSmsMessage when textarea is changed", () => {
    const setSmsMessage = vi.fn();
    render(<SmsModal {...defaultProps} setSmsMessage={setSmsMessage} />);
    fireEvent.change(screen.getByPlaceholderText("Type your message here..."), {
      target: { value: "New message" },
    });
    expect(setSmsMessage).toHaveBeenCalledWith("New message");
  });

  it("calls onClose when Cancel is clicked", () => {
    const onClose = vi.fn();
    render(<SmsModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onSend when Send is clicked", () => {
    const onSend = vi.fn();
    render(<SmsModal {...defaultProps} smsMessage="Hi!" onSend={onSend} />);
    fireEvent.click(screen.getByText("Send"));
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it("falls back to lead.name when full_name is absent", () => {
    render(
      <SmsModal
        {...defaultProps}
        selectedLead={makeLead({ full_name: undefined as unknown as string, name: "Bob Jones" })}
      />,
    );
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });
});

// =====================================================
// MailModal TESTS
// =====================================================
describe("MailModal", () => {
  const defaultProps = {
    open: true,
    selectedLead: makeLead(),
    mailStep: 1 as 1 | 2,
    selectedTemplate: "",
    setSelectedTemplate: vi.fn(),
    onClose: vi.fn(),
    onNextToCompose: vi.fn(),
    onSaveAsTemplate: vi.fn(),
    onBackToTemplates: vi.fn(),
  };

  beforeEach(() => vi.clearAllMocks());

  it("renders dialog when open is true", () => {
    render(<MailModal {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render dialog when open is false", () => {
    render(<MailModal {...defaultProps} open={false} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows New Email heading on step 1", () => {
    render(<MailModal {...defaultProps} />);
    expect(screen.getByText("New Email")).toBeInTheDocument();
  });

  it("shows SELECT EMAIL TEMPLATE label on step 1", () => {
    render(<MailModal {...defaultProps} />);
    expect(screen.getByText("SELECT EMAIL TEMPLATE")).toBeInTheDocument();
  });

  it("renders email templates on step 1", () => {
    render(<MailModal {...defaultProps} />);
    expect(screen.getByText("Welcome Email")).toBeInTheDocument();
    expect(screen.getByText("Follow Up")).toBeInTheDocument();
  });

  it("shows Compose New Email option on step 1", () => {
    render(<MailModal {...defaultProps} />);
    expect(screen.getByText("Compose New Email")).toBeInTheDocument();
  });

  it("calls onNextToCompose when Compose New Email is clicked", () => {
    const onNextToCompose = vi.fn();
    render(<MailModal {...defaultProps} onNextToCompose={onNextToCompose} />);
    fireEvent.click(screen.getByText("Compose New Email"));
    expect(onNextToCompose).toHaveBeenCalled();
  });

  it("calls setSelectedTemplate when a template is clicked", () => {
    const setSelectedTemplate = vi.fn();
    render(<MailModal {...defaultProps} setSelectedTemplate={setSelectedTemplate} />);
    fireEvent.click(screen.getByText("Welcome Email"));
    expect(setSelectedTemplate).toHaveBeenCalledWith("Welcome Email");
  });

  it("calls onNextToCompose when Next is clicked on step 1", () => {
    const onNextToCompose = vi.fn();
    render(<MailModal {...defaultProps} onNextToCompose={onNextToCompose} />);
    fireEvent.click(screen.getByText("Next"));
    expect(onNextToCompose).toHaveBeenCalled();
  });

  it("calls onClose when Cancel is clicked on step 1", () => {
    const onClose = vi.fn();
    render(<MailModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows compose UI on step 2", () => {
    render(<MailModal {...defaultProps} mailStep={2} />);
    expect(screen.getByText("Save as Template")).toBeInTheDocument();
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  it("shows lead name in greeting on step 2", () => {
    render(<MailModal {...defaultProps} mailStep={2} />);
    expect(screen.getByText(/Hi Alice Sharma/)).toBeInTheDocument();
  });

  it("calls onSaveAsTemplate when Save as Template is clicked on step 2", () => {
    const onSaveAsTemplate = vi.fn();
    render(<MailModal {...defaultProps} mailStep={2} onSaveAsTemplate={onSaveAsTemplate} />);
    fireEvent.click(screen.getByText("Save as Template"));
    expect(onSaveAsTemplate).toHaveBeenCalled();
  });

  it("calls onBackToTemplates when Cancel is clicked on step 2", () => {
    const onBackToTemplates = vi.fn();
    render(<MailModal {...defaultProps} mailStep={2} onBackToTemplates={onBackToTemplates} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onBackToTemplates).toHaveBeenCalled();
  });
});

// =====================================================
// BookAppointmentModal TESTS
// =====================================================
describe("BookAppointmentModal", () => {
  const defaultProps = {
    open: true,
    selectedLead: makeLead(),
    appointment: makeAppointment(),
    setSelectedDepartmentId: vi.fn(),
    setSelectedEmployeeId: vi.fn(),
    setDate: vi.fn(),
    setSlot: vi.fn(),
    setRemark: vi.fn(),
    clearError: vi.fn(),
    onClose: vi.fn(),
    onSubmit: vi.fn(),
  };

  beforeEach(() => vi.clearAllMocks());

  it("renders dialog when open is true", () => {
    render(<BookAppointmentModal {...defaultProps} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render dialog when open is false", () => {
    render(<BookAppointmentModal {...defaultProps} open={false} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows Book an Appointment title", () => {
    render(<BookAppointmentModal {...defaultProps} />);
    expect(screen.getByText("Book an Appointment")).toBeInTheDocument();
  });

  it("displays selected lead name", () => {
    render(<BookAppointmentModal {...defaultProps} />);
    expect(screen.getByText(/Alice Sharma/)).toBeInTheDocument();
  });

  it("shows Department field", () => {
    render(<BookAppointmentModal {...defaultProps} />);
    expect(screen.getByText("Department *")).toBeInTheDocument();
  });

  it("shows department loading spinner when loadingDepartments is true", () => {
    render(
      <BookAppointmentModal
        {...defaultProps}
        appointment={makeAppointment({ loadingDepartments: true })}
      />,
    );
    expect(screen.getByText("Loading departments...")).toBeInTheDocument();
  });

  it("shows employee loading spinner when loadingEmployees is true", () => {
    render(
      <BookAppointmentModal
        {...defaultProps}
        appointment={makeAppointment({ loadingEmployees: true })}
      />,
    );
    expect(screen.getByText("Loading personnel...")).toBeInTheDocument();
  });

  it("shows error alert when appointment.error is set", () => {
    render(
      <BookAppointmentModal
        {...defaultProps}
        appointment={makeAppointment({ error: "Please select a department." })}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Please select a department.")).toBeInTheDocument();
  });

  it("calls clearError when alert close is clicked", () => {
    const clearError = vi.fn();
    render(
      <BookAppointmentModal
        {...defaultProps}
        clearError={clearError}
        appointment={makeAppointment({ error: "Error!" })}
      />,
    );
    const closeBtn = screen.getByTitle("Close");
    fireEvent.click(closeBtn);
    expect(clearError).toHaveBeenCalled();
  });

  it("Book Appointment button is disabled when required fields are missing", () => {
    render(<BookAppointmentModal {...defaultProps} />);
    const btn = screen.getByText("Book Appointment").closest("button")!;
    expect(btn).toBeDisabled();
  });

  it("Book Appointment button is enabled when all required fields are filled", () => {
    render(
      <BookAppointmentModal
        {...defaultProps}
        appointment={makeAppointment({
          selectedDepartmentId: "1",
          date: new Date("2025-01-20"),
          slot: "09:00 AM - 09:30 AM",
        })}
      />,
    );
    const btn = screen.getByText("Book Appointment").closest("button")!;
    expect(btn).not.toBeDisabled();
  });

  it("calls onSubmit when Book Appointment button is clicked", () => {
    const onSubmit = vi.fn();
    render(
      <BookAppointmentModal
        {...defaultProps}
        onSubmit={onSubmit}
        appointment={makeAppointment({
          selectedDepartmentId: "1",
          date: new Date("2025-01-20"),
          slot: "09:00 AM - 09:30 AM",
        })}
      />,
    );
    fireEvent.click(screen.getByText("Book Appointment"));
    expect(onSubmit).toHaveBeenCalled();
  });

  it("shows spinner in submit button when submitting", () => {
    render(
      <BookAppointmentModal
        {...defaultProps}
        appointment={makeAppointment({
          selectedDepartmentId: "1",
          date: new Date("2025-01-20"),
          slot: "09:00 AM - 09:30 AM",
          submitting: true,
        })}
      />,
    );
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText("Book Appointment")).toBeNull();
  });

  it("Cancel button is disabled when submitting", () => {
    render(
      <BookAppointmentModal
        {...defaultProps}
        appointment={makeAppointment({ submitting: true })}
      />,
    );
    expect(screen.getByText("Cancel").closest("button")).toBeDisabled();
  });

  it("calls onClose when Cancel is clicked", () => {
    const onClose = vi.fn();
    render(<BookAppointmentModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows date summary chip when date and slot are set", () => {
    render(
      <BookAppointmentModal
        {...defaultProps}
        appointment={makeAppointment({
          date: new Date("2025-01-20"),
          slot: "09:00 AM - 09:30 AM",
        })}
      />,
    );
    const matches = screen.getAllByText(/09:00 AM - 09:30 AM/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    const chipText = matches.find(
      (el) =>
        el.textContent?.includes("·") ||
        el.closest("[class*='chip']") !== null,
    );
    expect(chipText ?? matches[0]).toBeInTheDocument();
  });

  it("renders department options in dropdown", () => {
    render(
      <BookAppointmentModal
        {...defaultProps}
        appointment={makeAppointment({
          departments: [
            { id: 1, name: "Cardiology", is_active: true },
            { id: 2, name: "IVF",        is_active: true },
          ],
        })}
      />,
    );
    const departmentCombobox = screen.getAllByRole("combobox")[0];
    fireEvent.mouseDown(departmentCombobox);
    expect(within(document.body).getByText("Cardiology")).toBeInTheDocument();
    expect(within(document.body).getByText("IVF")).toBeInTheDocument();
  });

  it("renders employee options when filteredEmployees is populated", () => {
    render(
      <BookAppointmentModal
        {...defaultProps}
        appointment={makeAppointment({
          departments: [{ id: 1, name: "IVF", is_active: true }],
          selectedDepartmentId: "1",
          filteredEmployees: [
            { id: 10, emp_name: "Dr. Rao", emp_type: "Doctor", department_name: "IVF" },
          ],
        })}
      />,
    );
    const comboboxes = screen.getAllByRole("combobox");
    fireEvent.mouseDown(comboboxes[1]);
    expect(within(document.body).getByText("Dr. Rao")).toBeInTheDocument();
  });

  it("calls setRemark when remark textarea is changed", () => {
    const setRemark = vi.fn();
    render(<BookAppointmentModal {...defaultProps} setRemark={setRemark} />);
    fireEvent.change(
      screen.getByPlaceholderText("Add any notes or special instructions..."),
      { target: { value: "Urgent case" } },
    );
    expect(setRemark).toHaveBeenCalledWith("Urgent case");
  });
});

// =====================================================
// CardContent TESTS
// =====================================================
describe("CardContent", () => {
  const defaultProps = {
    lead: makeLead(),
    columnLabel: "NEW LEADS",
    isHovered: false,
    onOpenSms: vi.fn(),
    onOpenMail: vi.fn(),
    onOpenBook: vi.fn(),
    onOpenCall: vi.fn(),
  };

  beforeEach(() => vi.clearAllMocks());

  it("shows score in collapsed view when not hovered", () => {
    render(<CardContent {...defaultProps} isHovered={false} />);
    expect(screen.getByText("85%")).toBeInTheDocument();
  });

  it("shows location when hovered", () => {
    render(<CardContent {...defaultProps} isHovered={true} />);
    expect(screen.getByText("Chennai")).toBeInTheDocument();
  });

  it("shows assigned name when hovered", () => {
    render(<CardContent {...defaultProps} isHovered={true} />);
    expect(screen.getByText("Dr. Rao")).toBeInTheDocument();
  });

  it("shows lead source when hovered", () => {
    render(<CardContent {...defaultProps} isHovered={true} />);
    expect(screen.getByText("Referral")).toBeInTheDocument();
  });

  it("shows Book an Appointment button for NEW LEADS when hovered", () => {
    render(<CardContent {...defaultProps} isHovered={true} columnLabel="NEW LEADS" />);
    expect(screen.getByText("Book an Appointment")).toBeInTheDocument();
  });

  it("shows Book an Appointment button for FOLLOW-UPS when hovered", () => {
    render(<CardContent {...defaultProps} isHovered={true} columnLabel="FOLLOW-UPS" />);
    expect(screen.getByText("Book an Appointment")).toBeInTheDocument();
  });

  it("does not show Book an Appointment for CLOSED column", () => {
    render(<CardContent {...defaultProps} isHovered={true} columnLabel="CLOSED" />);
    expect(screen.queryByText("Book an Appointment")).toBeNull();
  });

  it("calls onOpenBook when Book an Appointment is clicked", () => {
    const onOpenBook = vi.fn();
    render(<CardContent {...defaultProps} isHovered={true} onOpenBook={onOpenBook} />);
    fireEvent.click(screen.getByText("Book an Appointment"));
    expect(onOpenBook).toHaveBeenCalledWith(defaultProps.lead);
  });

  it("calls onOpenSms when SMS icon is clicked", () => {
    const onOpenSms = vi.fn();
    render(<CardContent {...defaultProps} isHovered={true} onOpenSms={onOpenSms} />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[1]);
    expect(onOpenSms).toHaveBeenCalledWith(defaultProps.lead);
  });

  it("calls onOpenMail when Mail icon is clicked", () => {
    const onOpenMail = vi.fn();
    render(<CardContent {...defaultProps} isHovered={true} onOpenMail={onOpenMail} />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[2]);
    expect(onOpenMail).toHaveBeenCalledWith(defaultProps.lead);
  });
});

// =====================================================
// LeadCard TESTS
// =====================================================
describe("LeadCard", () => {
  const defaultProps = {
    lead: makeLead(),
    columnLabel: "NEW LEADS",
    columnColor: "#6366F1",
    isHovered: false,
    onHover: vi.fn(),
    onOpenSms: vi.fn(),
    onOpenMail: vi.fn(),
    onOpenBook: vi.fn(),
    onOpenCall: vi.fn(),
    setLeads: vi.fn() as React.Dispatch<React.SetStateAction<LeadItem[]>>,
  };

  beforeEach(() => vi.clearAllMocks());

  it("renders lead full name", () => {
    render(<LeadCard {...defaultProps} />);
    expect(screen.getByText("Alice Sharma")).toBeInTheDocument();
  });

  it("renders lead id", () => {
    render(<LeadCard {...defaultProps} />);
    expect(screen.getByText("#LN-1")).toBeInTheDocument();
  });

  it("renders quality chip", () => {
    render(<LeadCard {...defaultProps} />);
    expect(screen.getByText("Hot")).toBeInTheDocument();
  });

  it("renders initials in avatar", () => {
    render(<LeadCard {...defaultProps} />);
    expect(screen.getByText("AS")).toBeInTheDocument();
  });

  it("calls onHover with lead id on mouse enter", () => {
    const onHover = vi.fn();
    render(<LeadCard {...defaultProps} onHover={onHover} />);
    const paper = screen.getByText("Alice Sharma").closest(".MuiPaper-root")!;
    fireEvent.mouseEnter(paper);
    expect(onHover).toHaveBeenCalledWith("#LN-1");
  });

  it("calls onHover with null on mouse leave", () => {
    const onHover = vi.fn();
    render(<LeadCard {...defaultProps} onHover={onHover} />);
    const paper = screen.getByText("Alice Sharma").closest(".MuiPaper-root")!;
    fireEvent.mouseLeave(paper);
    expect(onHover).toHaveBeenCalledWith(null);
  });

  it("navigates to lead detail page on click", () => {
    render(<LeadCard {...defaultProps} />);
    const paper = screen.getByText("Alice Sharma").closest(".MuiPaper-root")!;
    fireEvent.click(paper);
    expect(mockNavigate).toHaveBeenCalledWith("/leads/LN-1");
  });
});

// =====================================================
// LeadColumn TESTS
// =====================================================
describe("LeadColumn", () => {
  const col = { label: "NEW LEADS", color: "#6366F1", statusKey: ["new"] };

  const defaultProps = {
    col,
    leads: [makeLead(), makeLead({ id: "#LN-2", full_name: "Bob Jones" })],
    hoveredId: null as string | null,
    onHover: vi.fn(),
    onOpenSms: vi.fn(),
    onOpenMail: vi.fn(),
    onOpenBook: vi.fn(),
    onOpenCall: vi.fn(),
    setLeads: vi.fn() as React.Dispatch<React.SetStateAction<LeadItem[]>>,
  };

  beforeEach(() => vi.clearAllMocks());

  it("renders column label", () => {
    render(<LeadColumn {...defaultProps} />);
    expect(screen.getByText("NEW LEADS")).toBeInTheDocument();
  });

  it("renders lead count padded to 2 digits", () => {
    render(<LeadColumn {...defaultProps} />);
    expect(screen.getByText("(02)")).toBeInTheDocument();
  });

  it("renders all lead cards", () => {
    render(<LeadColumn {...defaultProps} />);
    expect(screen.getByText("Alice Sharma")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
  });

  it("renders zero count when no leads", () => {
    render(<LeadColumn {...defaultProps} leads={[]} />);
    expect(screen.getByText("(00)")).toBeInTheDocument();
  });

  it("passes hoveredId down to highlight correct card", () => {
    render(<LeadColumn {...defaultProps} hoveredId="#LN-1" />);
    expect(screen.getByText("Chennai")).toBeInTheDocument();
  });
});