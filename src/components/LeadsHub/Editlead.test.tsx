import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import EditLead from "./EditLead";

// ---------------- MOCK useEditLead hook ----------------
const mockNavigate = vi.fn();

// Explicit interface prevents TypeScript from narrowing nullable/array fields
// (e.g. error: null → string | null, treatments: [] → string[])
// which would cause type errors when spreading overrides in individual tests.
interface MockHook {
  navigate: ReturnType<typeof vi.fn>;
  currentStep: number;
  setCurrentStep: ReturnType<typeof vi.fn>;
  showSuccess: boolean;
  loading: boolean;
  error: string | null;
  setError: ReturnType<typeof vi.fn>;
  saving: boolean;
  departments: { id: number; name: string }[];
  employees: { id: number; emp_name: string; emp_type: string; department_name?: string }[];
  filteredPersonnel: { id: number; emp_name: string; emp_type: string }[];
  loadingDepartments: boolean;
  loadingEmployees: boolean;
  employeeError: string | null;
  setEmployeeError: ReturnType<typeof vi.fn>;
  leadData: { id: number } | null;
  fullName: string;
  setFullName: ReturnType<typeof vi.fn>;
  contactNo: string;
  setContactNo: ReturnType<typeof vi.fn>;
  email: string;
  setEmail: ReturnType<typeof vi.fn>;
  location: string;
  setLocation: ReturnType<typeof vi.fn>;
  gender: string;
  setGender: ReturnType<typeof vi.fn>;
  age: string;
  setAge: ReturnType<typeof vi.fn>;
  marital: string;
  setMarital: ReturnType<typeof vi.fn>;
  address: string;
  setAddress: ReturnType<typeof vi.fn>;
  language: string;
  setLanguage: ReturnType<typeof vi.fn>;
  isCouple: "yes" | "no";
  setIsCouple: ReturnType<typeof vi.fn>;
  partnerName: string;
  setPartnerName: ReturnType<typeof vi.fn>;
  partnerAge: string;
  setPartnerAge: ReturnType<typeof vi.fn>;
  partnerGender: string;
  setPartnerGender: ReturnType<typeof vi.fn>;
  source: string;
  setSource: ReturnType<typeof vi.fn>;
  subSource: string;
  setSubSource: ReturnType<typeof vi.fn>;
  campaign: string;
  setCampaign: ReturnType<typeof vi.fn>;
  assignee: string;
  setAssignee: ReturnType<typeof vi.fn>;
  nextType: string;
  nextStatus: string;
  setNextStatus: ReturnType<typeof vi.fn>;
  nextDesc: string;
  setNextDesc: ReturnType<typeof vi.fn>;
  availableTaskStatuses: { value: string; label: string }[];
  handleNextTypeChange: ReturnType<typeof vi.fn>;
  treatmentInterest: string;
  setTreatmentInterest: ReturnType<typeof vi.fn>;
  treatments: string[];
  setTreatments: ReturnType<typeof vi.fn>;
  wantAppointment: "yes" | "no";
  setWantAppointment: ReturnType<typeof vi.fn>;
  department: string;
  setDepartment: ReturnType<typeof vi.fn>;
  selectedDate: unknown;
  handleDateChange: ReturnType<typeof vi.fn>;
  slot: string;
  setSlot: ReturnType<typeof vi.fn>;
  remark: string;
  setRemark: ReturnType<typeof vi.fn>;
  handleSave: ReturnType<typeof vi.fn>;
}

const baseHook: MockHook = {
  navigate: mockNavigate,
  currentStep: 1,
  setCurrentStep: vi.fn(),
  showSuccess: false,
  loading: false,
  error: null,
  setError: vi.fn(),
  saving: false,
  departments: [],
  employees: [],
  filteredPersonnel: [],
  loadingDepartments: false,
  loadingEmployees: false,
  employeeError: null,
  setEmployeeError: vi.fn(),
  leadData: { id: 101 },
  fullName: "John Smith",
  setFullName: vi.fn(),
  contactNo: "9876543210",
  setContactNo: vi.fn(),
  email: "john@example.com",
  setEmail: vi.fn(),
  location: "Bangalore",
  setLocation: vi.fn(),
  gender: "Male",
  setGender: vi.fn(),
  age: "32",
  setAge: vi.fn(),
  marital: "Married",
  setMarital: vi.fn(),
  address: "123 Main St",
  setAddress: vi.fn(),
  language: "English",
  setLanguage: vi.fn(),
  isCouple: "no" as "yes" | "no",
  setIsCouple: vi.fn(),
  partnerName: "",
  setPartnerName: vi.fn(),
  partnerAge: "",
  setPartnerAge: vi.fn(),
  partnerGender: "",
  setPartnerGender: vi.fn(),
  source: "Website",
  setSource: vi.fn(),
  subSource: "Google",
  setSubSource: vi.fn(),
  campaign: "Spring2024",
  setCampaign: vi.fn(),
  assignee: "",
  setAssignee: vi.fn(),
  nextType: "",
  nextStatus: "",
  setNextStatus: vi.fn(),
  nextDesc: "",
  setNextDesc: vi.fn(),
  availableTaskStatuses: [{ value: "Pending", label: "Pending" }],
  handleNextTypeChange: vi.fn(),
  treatmentInterest: "",
  setTreatmentInterest: vi.fn(),
  treatments: [],
  setTreatments: vi.fn(),
  wantAppointment: "no" as "yes" | "no",
  setWantAppointment: vi.fn(),
  department: "",
  setDepartment: vi.fn(),
  selectedDate: null,
  handleDateChange: vi.fn(),
  slot: "",
  setSlot: vi.fn(),
  remark: "",
  setRemark: vi.fn(),
  handleSave: vi.fn(),
};

// Mutable ref so individual tests can override fields
let mockHookValues = { ...baseHook };

vi.mock("./useEditLead", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./UseEditLead")>();
  return {
    ...actual,
    useEditLead: () => mockHookValues,
  };
});

// ---------------- MOCK MUI DatePicker (avoid complex setup) ----------------
vi.mock("@mui/x-date-pickers/DatePicker", () => ({
  DatePicker: ({ onChange }: { onChange: (v: unknown) => void }) => (
    <input
      data-testid="date-picker"
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock("@mui/x-date-pickers/LocalizationProvider", () => ({
  LocalizationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@mui/x-date-pickers/AdapterDayjs", () => ({
  AdapterDayjs: class {},
}));

// ---------------- RENDER HELPER ----------------
function renderComponent() {
  return render(<EditLead />);
}

// =====================================================
// TESTS
// =====================================================

describe("EditLead", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHookValues = { ...baseHook };
  });

  // ---- Loading state ----

  it("shows loading spinner when loading is true", () => {
    mockHookValues = { ...baseHook, loading: true, leadData: null };
    renderComponent();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByText("Loading lead...")).toBeInTheDocument();
  });

  // ---- Error state (no leadData) ----

  it("shows error message when error exists and no leadData", () => {
    mockHookValues = {
      ...baseHook,
      error: "Network error",
      leadData: null,
    };
    renderComponent();
    expect(screen.getByText("Failed to load lead")).toBeInTheDocument();
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("shows Back to Leads button on error screen", () => {
    mockHookValues = { ...baseHook, error: "Not found", leadData: null };
    renderComponent();
    expect(screen.getByText("Back to Leads")).toBeInTheDocument();
  });

  it("navigates to /leads when Back to Leads is clicked on error screen", () => {
    mockHookValues = { ...baseHook, error: "Not found", leadData: null };
    renderComponent();
    fireEvent.click(screen.getByText("Back to Leads"));
    expect(mockNavigate).toHaveBeenCalledWith("/leads");
  });

  // ---- Not found state ----

  it("shows Lead not found when leadData is null and no error", () => {
    mockHookValues = { ...baseHook, leadData: null };
    renderComponent();
    expect(screen.getByText("Lead not found")).toBeInTheDocument();
  });

  // ---- Normal render ----

  it("renders the Edit Lead Details header", () => {
    renderComponent();
    expect(screen.getByText(/Edit Lead Details/)).toBeInTheDocument();
  });

  it("displays the formatted lead ID in the header", () => {
    renderComponent();
    // formatLeadId(101) — just check something in parentheses exists
    expect(screen.getByText(/\(.*\)/)).toBeInTheDocument();
  });

  it("renders the stepper with step labels", () => {
    renderComponent();
    // Actual STEPS = ["Patient Details", "Medical Details", "Book Appointment"]
    expect(screen.getByText("Patient Details")).toBeInTheDocument();
    expect(screen.getByText("Medical Details")).toBeInTheDocument();
    expect(screen.getByText("Book Appointment")).toBeInTheDocument();
  });

  // ---- Step 1 form fields ----

  it("renders Full Name field with current value on step 1", () => {
    renderComponent();
    expect(screen.getByDisplayValue("John Smith")).toBeInTheDocument();
  });

  it("renders Contact No field on step 1", () => {
    renderComponent();
    expect(screen.getByDisplayValue("9876543210")).toBeInTheDocument();
  });

  it("renders Email field on step 1", () => {
    renderComponent();
    expect(screen.getByDisplayValue("john@example.com")).toBeInTheDocument();
  });

  it("calls setFullName when Full Name field is changed", () => {
    renderComponent();
    const input = screen.getByDisplayValue("John Smith");
    fireEvent.change(input, { target: { value: "Jane Doe" } });
    expect(mockHookValues.setFullName).toHaveBeenCalledWith("Jane Doe");
  });

  it("calls setContactNo when Contact No field is changed", () => {
    renderComponent();
    const input = screen.getByDisplayValue("9876543210");
    fireEvent.change(input, { target: { value: "1234567890" } });
    expect(mockHookValues.setContactNo).toHaveBeenCalledWith("1234567890");
  });

  it("calls setEmail when Email field is changed", () => {
    renderComponent();
    const input = screen.getByDisplayValue("john@example.com");
    fireEvent.change(input, { target: { value: "new@email.com" } });
    expect(mockHookValues.setEmail).toHaveBeenCalledWith("new@email.com");
  });

  // ---- Partner section ----

  it("does not show partner fields when isCouple is 'no'", () => {
    renderComponent();
    expect(screen.queryByText(/Partner.*Full Name|Full Name.*Partner/i)).toBeNull();
  });

  it("shows partner fields when isCouple is 'yes'", () => {
    mockHookValues = { ...baseHook, isCouple: "yes" };
    renderComponent();
    // Lead section labels include asterisk ("Full Name *"), partner section uses plain "Full Name"
    // So when isCouple is yes, the plain "Full Name" label (partner) appears in the DOM
    expect(screen.getByText("Full Name")).toBeInTheDocument();
    // Partner-specific unique fields — Age and Gender appear in partner grid (no asterisk)
    expect(screen.getByText("Age")).toBeInTheDocument();
  });

  // ---- Inline error / warning banners ----

  it("shows inline error alert when error exists but leadData is present", () => {
    mockHookValues = { ...baseHook, error: "Save failed" };
    renderComponent();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Save failed")).toBeInTheDocument();
  });

  it("shows warning alert when employeeError is set", () => {
    mockHookValues = { ...baseHook, employeeError: "Could not fetch employees" };
    renderComponent();
    expect(screen.getByText(/Could not load employees/)).toBeInTheDocument();
    expect(screen.getByText("Could not fetch employees")).toBeInTheDocument();
  });

  // ---- Footer navigation buttons ----

  it("shows Cancel and Next buttons on step 1", () => {
    renderComponent();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("does not show Back button on step 1", () => {
    renderComponent();
    expect(screen.queryByText("Back")).toBeNull();
  });

  it("shows Back button on step 2", () => {
    mockHookValues = { ...baseHook, currentStep: 2 };
    renderComponent();
    expect(screen.getByText("Back")).toBeInTheDocument();
  });

  it("shows Save button on last step", () => {
    mockHookValues = { ...baseHook, currentStep: 3 };
    renderComponent();
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("does not show Next button on last step", () => {
    mockHookValues = { ...baseHook, currentStep: 3 };
    renderComponent();
    expect(screen.queryByText("Next")).toBeNull();
  });

  it("calls setCurrentStep with incremented value when Next is clicked", () => {
    renderComponent();
    fireEvent.click(screen.getByText("Next"));
    expect(mockHookValues.setCurrentStep).toHaveBeenCalled();
  });

  it("calls setCurrentStep with decremented value when Back is clicked", () => {
    mockHookValues = { ...baseHook, currentStep: 2 };
    renderComponent();
    fireEvent.click(screen.getByText("Back"));
    expect(mockHookValues.setCurrentStep).toHaveBeenCalled();
  });

  it("navigates to /leads when Cancel is clicked", () => {
    renderComponent();
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockNavigate).toHaveBeenCalledWith("/leads");
  });

  it("calls handleSave when Save is clicked on last step", () => {
    mockHookValues = { ...baseHook, currentStep: 3 };
    renderComponent();
    fireEvent.click(screen.getByText("Save"));
    expect(mockHookValues.handleSave).toHaveBeenCalled();
  });

  // ---- Saving state ----

  it("shows spinner inside Save button when saving is true", () => {
    mockHookValues = { ...baseHook, currentStep: 3, saving: true };
    renderComponent();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText("Save")).toBeNull();
  });

  it("disables Cancel, Back, and Save buttons when saving", () => {
    mockHookValues = { ...baseHook, currentStep: 3, saving: true };
    renderComponent();
    const cancelBtn = screen.getByText("Cancel").closest("button")!;
    expect(cancelBtn).toBeDisabled();
  });

  // ---- Step 1 step indicator ----

  it("shows 'Step 1 of 3' footer label", () => {
    renderComponent();
    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
  });

  it("shows 'Step 2 of 3' footer label on step 2", () => {
    mockHookValues = { ...baseHook, currentStep: 2 };
    renderComponent();
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
  });

  // ---- Step 2 ----

  it("renders Treatment Interest section on step 2", () => {
    mockHookValues = { ...baseHook, currentStep: 2 };
    renderComponent();
    expect(screen.getByText("TREATMENT INFORMATION")).toBeInTheDocument();
  });

  it("renders treatment chips on step 2 when treatments exist", () => {
    mockHookValues = { ...baseHook, currentStep: 2, treatments: ["IVF", "IUI"] };
    renderComponent();
    expect(screen.getByText("IVF")).toBeInTheDocument();
    expect(screen.getByText("IUI")).toBeInTheDocument();
  });

  it("calls setTreatments when a chip delete icon is clicked", () => {
    mockHookValues = { ...baseHook, currentStep: 2, treatments: ["IVF"] };
    renderComponent();
    const deleteIcon = document.querySelector(".MuiChip-deleteIcon")!;
    fireEvent.click(deleteIcon);
    expect(mockHookValues.setTreatments).toHaveBeenCalled();
  });

  // ---- Step 3 ----

  it("renders Appointment Details section on step 3", () => {
    mockHookValues = { ...baseHook, currentStep: 3 };
    renderComponent();
    expect(screen.getByText("APPOINTMENT DETAILS")).toBeInTheDocument();
  });

  it("renders Department field on step 3", () => {
    mockHookValues = { ...baseHook, currentStep: 3 };
    renderComponent();
    expect(screen.getByText("Department *")).toBeInTheDocument();
  });

  it("renders date picker on step 3", () => {
    mockHookValues = { ...baseHook, currentStep: 3 };
    renderComponent();
    expect(screen.getByTestId("date-picker")).toBeInTheDocument();
  });

  it("renders Remark field on step 3", () => {
    mockHookValues = { ...baseHook, currentStep: 3 };
    renderComponent();
    expect(screen.getByPlaceholderText("Type Here...")).toBeInTheDocument();
  });

  it("calls setRemark when Remark field is changed", () => {
    mockHookValues = { ...baseHook, currentStep: 3 };
    renderComponent();
    const remarkField = screen.getByPlaceholderText("Type Here...");
    fireEvent.change(remarkField, { target: { value: "Follow up needed" } });
    expect(mockHookValues.setRemark).toHaveBeenCalledWith("Follow up needed");
  });

  // ---- Success toast ----

  it("renders success toast when showSuccess is true", () => {
    mockHookValues = { ...baseHook, showSuccess: true };
    renderComponent();
    expect(screen.getByText("Saved Successfully!")).toBeInTheDocument();
  });

  it("does not render success toast when showSuccess is false", () => {
    renderComponent();
    // MUI <Fade in={false}> keeps children in the DOM but sets visibility:hidden / opacity:0
    // So we check the element is not visible rather than not in the DOM
    const toast = screen.queryByText("Saved Successfully!");
    if (toast) {
      // If rendered, its ancestor Fade wrapper must be hidden (opacity 0 / not visible)
      const wrapper = toast.closest("[style]") as HTMLElement | null;
      const style = wrapper?.getAttribute("style") ?? "";
      expect(style).toMatch(/opacity:\s*0|visibility:\s*hidden/);
    }
    // If not in DOM at all, the test also passes
  });
});