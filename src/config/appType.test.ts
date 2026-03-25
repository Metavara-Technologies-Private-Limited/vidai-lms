import { describe, it, expect } from "vitest";
import {
  APP_TYPE,
  IS_MEDICAL_APP,
  IS_CONTRACTS_APP,
  FLOW_COPY_BY_APP,
  STATUS_OPTIONS_BY_APP,
  ACTIVE_FLOW_COPY,
  ACTIVE_STATUS_OPTIONS,
  type LeadStatusOption,
} from "./appType";

const APPS = ["medical", "contracts"] as const;

const REQUIRED_FLOW_KEYS = [
  "infoTab",
  "detailsStep",
  "medicalStep",
  "step1",
  "step2",
  "step3",
  "medicalSection",
  "treatmentLabel",
  "treatmentOptions",
  "contactSectionLabel",
  "showGenderAgeDob",
  "showDesignation",
  "showLeadGeneratedBy",
  "showDepartment",
] as const;

const ALLOWED_STATUS_SET = new Set<LeadStatusOption>([
  "New",
  "Appointment",
  "Follow Up",
  "Negotiation",
  "Proposal Sent",
  "Contract Signed",
  "Converted Lead",
  "Lost Lead",
]);

describe("appType.ts - app mode flags", () => {
  it("APP_TYPE is a supported value", () => {
    expect(APPS).toContain(APP_TYPE);
  });

  it("IS_MEDICAL_APP and IS_CONTRACTS_APP align with APP_TYPE", () => {
    expect(IS_MEDICAL_APP).toBe(APP_TYPE === "medical");
    expect(IS_CONTRACTS_APP).toBe(APP_TYPE === "contracts");
  });

  it("exactly one app flag is true", () => {
    expect(Number(IS_MEDICAL_APP) + Number(IS_CONTRACTS_APP)).toBe(1);
  });
});

describe("appType.ts - FLOW_COPY_BY_APP", () => {
  it("contains both app configs", () => {
    expect(FLOW_COPY_BY_APP).toHaveProperty("medical");
    expect(FLOW_COPY_BY_APP).toHaveProperty("contracts");
  });

  it.each(APPS)("has all required keys for %s", (app) => {
    const copy = FLOW_COPY_BY_APP[app];

    for (const key of REQUIRED_FLOW_KEYS) {
      expect(copy).toHaveProperty(key);
    }

    expect(Array.isArray(copy.treatmentOptions)).toBe(true);
    expect(copy.treatmentOptions.length).toBeGreaterThan(0);
  });

  it("medical flags are configured correctly", () => {
    const medical = FLOW_COPY_BY_APP.medical;
    expect(medical.showGenderAgeDob).toBe(true);
    expect(medical.showDesignation).toBe(false);
    expect(medical.showLeadGeneratedBy).toBe(false);
    expect(medical.showDepartment).toBe(true);
  });

  it("contracts flags are configured correctly", () => {
    const contracts = FLOW_COPY_BY_APP.contracts;
    expect(contracts.showGenderAgeDob).toBe(false);
    expect(contracts.showDesignation).toBe(true);
    expect(contracts.showLeadGeneratedBy).toBe(true);
    expect(contracts.showDepartment).toBe(false);
  });
});

describe("appType.ts - STATUS_OPTIONS_BY_APP", () => {
  it.each(APPS)("contains valid statuses without duplicates for %s", (app) => {
    const statuses = STATUS_OPTIONS_BY_APP[app];

    expect(statuses.length).toBeGreaterThan(0);
    expect(new Set(statuses).size).toBe(statuses.length);

    for (const s of statuses) {
      expect(ALLOWED_STATUS_SET.has(s)).toBe(true);
    }
  });

  it("medical status list includes Appointment and excludes contract-only statuses", () => {
    const medical = STATUS_OPTIONS_BY_APP.medical;
    expect(medical).toContain("Appointment");
    expect(medical).not.toContain("Negotiation");
    expect(medical).not.toContain("Proposal Sent");
    expect(medical).not.toContain("Contract Signed");
  });

  it("contracts status list includes contract-only statuses and excludes Appointment", () => {
    const contracts = STATUS_OPTIONS_BY_APP.contracts;
    expect(contracts).toContain("Negotiation");
    expect(contracts).toContain("Proposal Sent");
    expect(contracts).toContain("Contract Signed");
    expect(contracts).not.toContain("Appointment");
  });
});

describe("appType.ts - ACTIVE_* exports", () => {
  it("ACTIVE_FLOW_COPY maps to current APP_TYPE", () => {
    expect(ACTIVE_FLOW_COPY).toBe(FLOW_COPY_BY_APP[APP_TYPE]);
    expect(ACTIVE_FLOW_COPY).toEqual(FLOW_COPY_BY_APP[APP_TYPE]);
  });

  it("ACTIVE_STATUS_OPTIONS maps to current APP_TYPE", () => {
    expect(ACTIVE_STATUS_OPTIONS).toBe(STATUS_OPTIONS_BY_APP[APP_TYPE]);
    expect(ACTIVE_STATUS_OPTIONS).toEqual(STATUS_OPTIONS_BY_APP[APP_TYPE]);
  });
});