import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// =====================================================
// MOCKS  (declared before importing the hook)
// =====================================================

const mockNavigate = vi.fn();
const mockDispatch = vi.fn(() => Promise.resolve());

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: "42" }),
}));

vi.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockLeadAPIGetById    = vi.fn<(...args: any[]) => any>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockLeadAPIUpdate     = vi.fn<(...args: any[]) => any>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDepartmentAPIList = vi.fn<(...args: any[]) => any>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockEmployeeAPIList   = vi.fn<(...args: any[]) => any>();
const mockFetchLeads = vi.fn(() => ({ type: "leads/fetchLeads" }));

vi.mock("../../services/leads.api", () => ({
  LeadAPI: {
    getById: (id: unknown) => mockLeadAPIGetById(id),
    update: (id: unknown, data: unknown) => mockLeadAPIUpdate(id, data),
  },
  DepartmentAPI: {
    listActiveByClinic: (clinicId: unknown) => mockDepartmentAPIList(clinicId),
  },
  EmployeeAPI: {
    listByClinic: (clinicId: unknown) => mockEmployeeAPIList(clinicId),
  },
}));

vi.mock("../../store/leadSlice", () => ({
  fetchLeads: () => mockFetchLeads(),
}));

vi.mock("./leadTaskConfig", () => ({
  TASK_TYPES: ["Call", "Email", "Meeting"],
  TASK_STATUS_FOR_TYPE: {
    Call: [{ label: "Scheduled", value: "scheduled" }],
  },
  getAutoNextActionStatus: (type: string) => (type === "Call" ? "scheduled" : "pending"),
}));

// ---- import hook AFTER mocks ----
import {
  useEditLead,
  strOrNull,
  intOrNull,
  intOrFallback,
  isNextActionStatus,
  formatLeadId,
} from "./useEditLead";
import * as React from "react";

// =====================================================
// PURE HELPER TESTS  (no React, fast)
// =====================================================

describe("strOrNull", () => {
  it("returns trimmed string for valid input", () => {
    expect(strOrNull("  hello  ")).toBe("hello");
  });
  it("returns null for empty string", () => {
    expect(strOrNull("")).toBeNull();
  });
  it("returns null for whitespace-only string", () => {
    expect(strOrNull("   ")).toBeNull();
  });
  it("returns null for null", () => {
    expect(strOrNull(null)).toBeNull();
  });
  it("returns null for undefined", () => {
    expect(strOrNull(undefined)).toBeNull();
  });
});

describe("intOrNull", () => {
  it("parses a valid number string", () => {
    expect(intOrNull("42")).toBe(42);
  });
  it("returns null for empty string", () => {
    expect(intOrNull("")).toBeNull();
  });
  it("returns null for non-numeric string", () => {
    expect(intOrNull("abc")).toBeNull();
  });
  it("returns null for null", () => {
    expect(intOrNull(null)).toBeNull();
  });
  it("returns null for undefined", () => {
    expect(intOrNull(undefined)).toBeNull();
  });
  it("parses zero correctly", () => {
    expect(intOrNull("0")).toBe(0);
  });
});

describe("intOrFallback", () => {
  it("returns parsed number for valid positive string", () => {
    expect(intOrFallback("5", 1)).toBe(5);
  });
  it("returns fallback for empty string", () => {
    expect(intOrFallback("", 99)).toBe(99);
  });
  it("returns fallback for zero (not > 0)", () => {
    expect(intOrFallback("0", 1)).toBe(1);
  });
  it("returns fallback for negative number", () => {
    expect(intOrFallback("-3", 1)).toBe(1);
  });
  it("returns fallback for undefined", () => {
    expect(intOrFallback(undefined, 7)).toBe(7);
  });
});

describe("isNextActionStatus", () => {
  it("returns true for 'pending'", () => {
    expect(isNextActionStatus("pending")).toBe(true);
  });
  it("returns true for 'completed'", () => {
    expect(isNextActionStatus("completed")).toBe(true);
  });
  it("returns false for any other string", () => {
    expect(isNextActionStatus("scheduled")).toBe(false);
    expect(isNextActionStatus("")).toBe(false);
    expect(isNextActionStatus("PENDING")).toBe(false);
  });
});

describe("formatLeadId", () => {
  it("prefixes # if id is already LN-xxx format", () => {
    expect(formatLeadId("LN-123")).toBe("#LN-123");
  });
  it("returns unchanged if already starts with #LN-", () => {
    expect(formatLeadId("#LN-456")).toBe("#LN-456");
  });
  it("extracts LN- number from mixed string", () => {
    expect(formatLeadId("ref-LN-789-extra")).toBe("#LN-789");
  });
  it("extracts raw number from plain numeric id", () => {
    expect(formatLeadId("101")).toBe("#LN-101");
  });
  it("generates deterministic hash-based id for non-numeric id", () => {
    const result = formatLeadId("abc");
    expect(result).toMatch(/^#LN-\d{3}$/);
  });
});

// =====================================================
// HOOK TESTS
// =====================================================

const mockLead = {
  id: 42,
  clinic_id: 3,
  full_name: "Alice Sharma",
  contact_no: "9000000001",
  email: "alice@example.com",
  location: "Chennai",
  gender: "female",
  age: 28,
  marital_status: "single",
  address: "12 Rose St",
  language_preference: "Hindi",
  partner_inquiry: false,
  partner_full_name: "",
  partner_age: null,
  partner_gender: null,
  source: "Referral",
  sub_source: "Google",
  assigned_to_id: 7,
  next_action_type: "Call",
  next_action_status: "pending",
  next_action_description: "Follow up",
  treatment_interest: "IVF,IUI",
  book_appointment: true,
  department_id: 2,
  appointment_date: "2024-06-15",
  slot: "10:00 AM - 10:30 AM",
  remark: "Urgent",
};

describe("useEditLead — initial state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLeadAPIGetById.mockResolvedValue(mockLead);
    mockDepartmentAPIList.mockResolvedValue([]);
    mockEmployeeAPIList.mockResolvedValue([]);
  });

  it("starts in loading state", () => {
    const { result } = renderHook(() => useEditLead());
    expect(result.current.loading).toBe(true);
  });

  it("starts on step 1", () => {
    const { result } = renderHook(() => useEditLead());
    expect(result.current.currentStep).toBe(1);
  });

  it("starts with showSuccess false", () => {
    const { result } = renderHook(() => useEditLead());
    expect(result.current.showSuccess).toBe(false);
  });

  it("starts with no error", () => {
    const { result } = renderHook(() => useEditLead());
    expect(result.current.error).toBeNull();
  });
});

describe("useEditLead — lead fetch success", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLeadAPIGetById.mockResolvedValue(mockLead);
    mockDepartmentAPIList.mockResolvedValue([]);
    mockEmployeeAPIList.mockResolvedValue([]);
  });

  it("sets loading to false after fetch", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("populates leadData after fetch", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.leadData).not.toBeNull());
    expect(result.current.leadData?.id).toBe(42);
  });

  it("maps full_name correctly", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.fullName).toBe("Alice Sharma");
  });

  it("maps email correctly", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.email).toBe("alice@example.com");
  });

  it("maps gender 'female' → 'Female'", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.gender).toBe("Female");
  });

  it("maps marital_status 'single' → 'Single'", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.marital).toBe("Single");
  });

  it("maps partner_inquiry false → isCouple 'no'", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isCouple).toBe("no");
  });

  it("splits treatment_interest into treatments array", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.treatments).toEqual(["IVF", "IUI"]);
  });

  it("maps book_appointment true → wantAppointment 'yes'", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.wantAppointment).toBe("yes");
  });

  it("parses appointment_date into selectedDate", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.selectedDate).not.toBeNull();
    expect(result.current.selectedDate?.format("YYYY-MM-DD")).toBe("2024-06-15");
  });

  it("sets remark from API response", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.remark).toBe("Urgent");
  });

  it("sets slot from API response", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.slot).toBe("10:00 AM - 10:30 AM");
  });

  it("calls LeadAPI.getById with correct id", async () => {
    renderHook(() => useEditLead());
    await waitFor(() => expect(mockLeadAPIGetById).toHaveBeenCalledWith("42"));
  });
});

describe("useEditLead — lead fetch failure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLeadAPIGetById.mockRejectedValue(new Error("Network error"));
    mockDepartmentAPIList.mockResolvedValue([]);
    mockEmployeeAPIList.mockResolvedValue([]);
  });

  it("sets error message on API failure", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Network error");
  });

  it("sets loading to false after failure", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("leaves leadData as null on failure", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.leadData).toBeNull();
  });
});

describe("useEditLead — departments & employees fetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLeadAPIGetById.mockResolvedValue(mockLead);
    mockDepartmentAPIList.mockResolvedValue([
      { id: 1, name: "Cardiology" },
      { id: 2, name: "IVF" },
    ]);
    mockEmployeeAPIList.mockResolvedValue([
      { id: 10, emp_name: "Dr. Rao", emp_type: "Doctor", department_name: "IVF" },
      { id: 11, emp_name: "Nurse Priya", emp_type: "Nurse", department_name: "Cardiology" },
    ]);
  });

  it("populates departments list", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.departments.length).toBe(2));
    expect(result.current.departments[0].name).toBe("Cardiology");
  });

  it("populates employees list", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.employees.length).toBe(2));
  });

  it("filters personnel when department is set", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.employees.length).toBe(2));

    act(() => {
      result.current.setDepartment("2"); // IVF dept id
    });

    await waitFor(() => expect(result.current.filteredPersonnel.length).toBe(1));
    expect(result.current.filteredPersonnel[0].emp_name).toBe("Dr. Rao");
  });

  it("clears filteredPersonnel when department is cleared", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.employees.length).toBe(2));

    act(() => result.current.setDepartment("2"));
    await waitFor(() => expect(result.current.filteredPersonnel.length).toBe(1));

    act(() => result.current.setDepartment(""));
    await waitFor(() => expect(result.current.filteredPersonnel.length).toBe(0));
  });
});

describe("useEditLead — employee fetch failure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLeadAPIGetById.mockResolvedValue(mockLead);
    mockDepartmentAPIList.mockResolvedValue([]);
    mockEmployeeAPIList.mockRejectedValue(new Error("Employee API down"));
  });

  it("sets employeeError on failure", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.employeeError).toBe("Employee API down"));
  });

  it("keeps employees as empty array on failure", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.employeeError).not.toBeNull());
    expect(result.current.employees).toEqual([]);
  });
});

describe("useEditLead — handleNextTypeChange", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLeadAPIGetById.mockResolvedValue(mockLead);
    mockDepartmentAPIList.mockResolvedValue([]);
    mockEmployeeAPIList.mockResolvedValue([]);
  });

  it("updates nextType on change", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.handleNextTypeChange({
        target: { value: "Call" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.nextType).toBe("Call");
  });

  it("auto-sets nextStatus via getAutoNextActionStatus", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.handleNextTypeChange({
        target: { value: "Call" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.nextStatus).toBe("scheduled");
  });
});

describe("useEditLead — availableTaskStatuses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLeadAPIGetById.mockResolvedValue(mockLead);
    mockDepartmentAPIList.mockResolvedValue([]);
    mockEmployeeAPIList.mockResolvedValue([]);
  });

  it("returns default pending/completed when nextType is empty", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.handleNextTypeChange({
        target: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.availableTaskStatuses).toEqual([
      { label: "To Do", value: "pending" },
      { label: "Done", value: "completed" },
    ]);
  });

  it("returns TASK_STATUS_FOR_TYPE statuses when nextType matches", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.handleNextTypeChange({
        target: { value: "Call" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.availableTaskStatuses).toEqual([
      { label: "Scheduled", value: "scheduled" },
    ]);
  });
});

describe("useEditLead — handleDateChange", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLeadAPIGetById.mockResolvedValue(mockLead);
    mockDepartmentAPIList.mockResolvedValue([]);
    mockEmployeeAPIList.mockResolvedValue([]);
  });

  it("updates selectedDate when a valid date is picked", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const dayjs = (await import("dayjs")).default;
    const newDate = dayjs("2025-01-20");

    act(() => {
      result.current.handleDateChange(newDate, {} as never);
    });

    expect(result.current.selectedDate?.format("YYYY-MM-DD")).toBe("2025-01-20");
  });

  it("sets selectedDate to null when null is passed", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.handleDateChange(null, {} as never);
    });

    expect(result.current.selectedDate).toBeNull();
  });
});

describe("useEditLead — handleSave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLeadAPIGetById.mockResolvedValue(mockLead);
    mockLeadAPIUpdate.mockResolvedValue({});
    mockDepartmentAPIList.mockResolvedValue([]);
    mockEmployeeAPIList.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls LeadAPI.update with correct id", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.handleSave();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockLeadAPIUpdate).toHaveBeenCalledWith("42", expect.any(Object));
  });

  it("sets showSuccess to true immediately", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.useFakeTimers({ shouldAdvanceTime: false });

    act(() => {
      result.current.handleSave();
    });

    expect(result.current.showSuccess).toBe(true);
  });

  it("navigates to /leads after 800ms", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.useFakeTimers({ shouldAdvanceTime: false });

    act(() => {
      result.current.handleSave();
    });

    expect(mockNavigate).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(mockNavigate).toHaveBeenCalledWith("/leads", { replace: true });
  });

  it("dispatches fetchLeads after successful update", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.handleSave();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockDispatch).toHaveBeenCalled();
  });

  it("does not call LeadAPI.update if leadData is null", async () => {
    mockLeadAPIGetById.mockRejectedValue(new Error("not found"));
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.handleSave();
    });

    expect(mockLeadAPIUpdate).not.toHaveBeenCalled();
  });
});

describe("useEditLead — setters (state updates)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLeadAPIGetById.mockResolvedValue(mockLead);
    mockDepartmentAPIList.mockResolvedValue([]);
    mockEmployeeAPIList.mockResolvedValue([]);
  });

  const fieldTests: Array<[string, string, unknown]> = [
    ["fullName",   "setFullName",   "New Name"],
    ["contactNo",  "setContactNo",  "1111111111"],
    ["email",      "setEmail",      "x@y.com"],
    ["location",   "setLocation",   "Mumbai"],
    ["gender",     "setGender",     "Other"],
    ["age",        "setAge",        "25"],
    ["marital",    "setMarital",    "Single"],
    ["address",    "setAddress",    "New Addr"],
    ["language",   "setLanguage",   "Kannada"],
    ["source",     "setSource",     "Direct"],
    ["subSource",  "setSubSource",  "LinkedIn"],
    ["campaign",   "setCampaign",   "Summer"],
    ["assignee",   "setAssignee",   "5"],
    ["nextStatus", "setNextStatus", "completed"],
    ["nextDesc",   "setNextDesc",   "Call back"],
    ["remark",     "setRemark",     "Note here"],
    ["slot",       "setSlot",       "02:00 PM - 02:30 PM"],
  ];

  for (const [field, setter, value] of fieldTests) {
    it(`updates ${field} via ${setter}`, async () => {
      const { result } = renderHook(() => useEditLead());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => {
        (result.current[setter as keyof typeof result.current] as (v: unknown) => void)(value);
      });

      expect(result.current[field as keyof typeof result.current]).toBe(value);
    });
  }

  it("updates isCouple to 'yes'", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setIsCouple("yes"));
    expect(result.current.isCouple).toBe("yes");
  });

  it("updates wantAppointment to 'no'", async () => {
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => result.current.setWantAppointment("no"));
    expect(result.current.wantAppointment).toBe("no");
  });

  it("clears error via setError(null)", async () => {
    mockLeadAPIGetById.mockRejectedValue(new Error("oops"));
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.error).not.toBeNull());
    act(() => result.current.setError(null));
    expect(result.current.error).toBeNull();
  });

  it("clears employeeError via setEmployeeError(null)", async () => {
    mockEmployeeAPIList.mockRejectedValue(new Error("emp error"));
    const { result } = renderHook(() => useEditLead());
    await waitFor(() => expect(result.current.employeeError).not.toBeNull());
    act(() => result.current.setEmployeeError(null));
    expect(result.current.employeeError).toBeNull();
  });
});