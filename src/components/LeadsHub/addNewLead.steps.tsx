import * as React from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  Stack,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
  CircularProgress,
  Tooltip,
  IconButton,
  Autocomplete,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import CloseIcon from "@mui/icons-material/Close";
import UploadFileIcon from "@mui/icons-material/UploadFile";

import type { Department } from "../../services/leads.api";
import type { ReferralDepartment } from "../../services/referral.api";
import type { FormState } from "../../types/leads.types";
import {
  SOURCE_OPTIONS,
  SUB_SOURCE_OPTIONS,
  TIME_SLOTS,
  inputStyle,
  labelStyle,
  getDocColor,
  type LeadGeneratedByObject,
  type NextActionStatusOption,
} from "../LeadsHub/addNewLead.constants";
import {
  IS_MEDICAL_APP,
  IS_CONTRACTS_APP,
  ACTIVE_FLOW_COPY,
} from "../../config/appType";

// ── Local types ───────────────────────────────────────────────────────────────
type Campaign = { id: string; name: string; source: string; subSource: string };

type AssigneeOption = {
  id: number;
  first_name: string | undefined;
  last_name: string | undefined;
  username: string | undefined;
  role: string | undefined;
  designation: string | undefined;
  email: string | undefined;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const assigneeLabel = (option: AssigneeOption): string => {
  const fullName =
    `${option.first_name ?? ""} ${option.last_name ?? ""}`.trim();
  const primary = fullName || option.username || `User ${option.id}`;
  const secondary = option.role || option.designation;
  return secondary ? `${primary} (${secondary})` : primary;
};

// ── Capitalize first letter of each word ─────────────────────────────────────
const capitalizeWords = (str: string): string =>
  str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

// ── FIX: normalize for case-insensitive comparison ───────────────────────────
const normalizeForCompare = (val: string): string => val.trim().toLowerCase();

const SLOT_MENU_PROPS = {
  anchorOrigin: { vertical: "bottom" as const, horizontal: "left" as const },
  transformOrigin: { vertical: "top" as const, horizontal: "left" as const },
  disablePortal: false,
  PaperProps: {
    sx: {
      "& .MuiMenu-list": {
        maxHeight: "200px",
        overflowY: "auto",
        scrollbarWidth: "thin",
        "&::-webkit-scrollbar": { width: "4px" },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#CBD5E1",
          borderRadius: "4px",
        },
      },
      "& .MuiMenuItem-root": {
        justifyContent: "flex-start",
        fontSize: "0.875rem",
        whiteSpace: "nowrap",
      },
    },
  },
};

// ====================== STEP 1 ======================
interface Step1Props {
  form: FormState;
  isCouple: "yes" | "no";
  setIsCouple: (v: "yes" | "no") => void;
  assigneeName: string;
  assigneeOptions: AssigneeOption[];
  assigneeLoading: boolean;
  leadGeneratedByInput: string;
  leadGeneratedByOptions: AssigneeOption[];
  leadGeneratedByLoading: boolean;
  selectedLeadGeneratedBy: LeadGeneratedByObject | null;
  campaigns: Campaign[];
  leadStatusOptions?: NextActionStatusOption[];
  nextActionStatusOptions?: NextActionStatusOption[];
  nextActionTypeOptions?: string[];
  handleChange: (
    field: keyof FormState,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (
    field: keyof FormState,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAssigneeInputChange: (value: string) => void;
  handleAssigneeChange: (value: AssigneeOption | null) => void;
  handleLeadGeneratedByInputChange: (value: string) => void;
  handleLeadGeneratedByChange: (value: AssigneeOption | null) => void;
  handleCampaignChange: (value: string) => void;
  handleSourceChange: (value: string) => void;
  handleSubSourceChange: (value: string) => void;
  handleLeadStatusChange: (value: string) => void;
  handleNextStatusChange: (value: string) => void;
  handleNextTypeChange: (value: string) => void;
  handleReferralDepartmentChange: (value: string) => void;
  referralDepartments: ReferralDepartment[];
  loadingReferralDepts: boolean;
}

export function Step1({
  form,
  isCouple,
  setIsCouple,
  assigneeName,
  assigneeOptions,
  assigneeLoading,
  leadGeneratedByInput,
  leadGeneratedByOptions,
  leadGeneratedByLoading,
  selectedLeadGeneratedBy,
  campaigns,
  leadStatusOptions,
  nextActionStatusOptions,
  nextActionTypeOptions,
  handleChange,
  handleSelectChange,
  handleAssigneeInputChange,
  handleAssigneeChange,
  handleLeadGeneratedByInputChange,
  handleLeadGeneratedByChange,
  handleCampaignChange,
  handleSourceChange,
  handleSubSourceChange,
  handleLeadStatusChange,
  handleNextStatusChange,
  handleNextTypeChange,
  handleReferralDepartmentChange,
  referralDepartments,
  loadingReferralDepts,
}: Step1Props) {
  const campaignSelected = Boolean(form.campaign);

  // ── FIX: track whether the Lead Generated By autocomplete is open ─────────
  // The info card should only be visible while the dropdown is open (i.e. the
  // user is actively browsing results). Once they pick an option and the
  // dropdown closes, the card disappears — just the selected name stays in
  // the input, which is the expected UX.
  const [leadGeneratedByOpen, setLeadGeneratedByOpen] = React.useState(false);

  const availableSubSources: string[] =
    form.source === "Referral"
      ? referralDepartments.map((d) => d.name)
      : form.source && SUB_SOURCE_OPTIONS[form.source]
        ? SUB_SOURCE_OPTIONS[form.source]
        : [];

  // ── FIX: filter campaigns using case-insensitive comparison ──────────────
  const filteredCampaigns = React.useMemo(() => {
    if (!form.source && !form.subSource) return campaigns;

    return campaigns.filter((c) => {
      const sourceMatch = form.source
        ? normalizeForCompare(c.source) === normalizeForCompare(form.source)
        : true;

      const subSourceMatch = form.subSource
        ? normalizeForCompare(c.subSource) ===
          normalizeForCompare(form.subSource)
        : true;

      return sourceMatch && subSourceMatch;
    });
  }, [campaigns, form.source, form.subSource]);

  const resolvedLeadStatusOptions: NextActionStatusOption[] =
    leadStatusOptions ?? [];
  const resolvedNextActionStatusOptions: NextActionStatusOption[] =
    nextActionStatusOptions ?? [];
  const resolvedNextActionTypeOptions: string[] = nextActionTypeOptions ?? [];

  // Campaign is hidden when source is "Referral" OR
  // when source is "Direct" and sub-source is not "Gmail"
  const isCampaignDisabled =
    form.source === "Referral" ||
    (form.source === "Direct" && form.subSource !== "Gmail");

  return (
    <Box>
      {/* ── LEAD INFORMATION ─────────────────────────────────────────────── */}
      <Typography
        variant="subtitle2"
        fontWeight={700}
        color="#1E293B"
        sx={{ mb: 2 }}
      >
        LEAD INFORMATION
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: IS_CONTRACTS_APP
            ? "repeat(5, 1fr)"
            : "repeat(4, 1fr)",
          gap: 2,
          mb: 3,
        }}
      >
        {(
          [
            ["Full Name", "full_name"],
            ["Contact No.", "contact"],
            ["Email", "email"],
            ["Location", "location"],
            ...(IS_CONTRACTS_APP ? [["Address", "address"]] : []),
          ] as [string, keyof FormState][]
        ).map(([lbl, field]) => (
          <Box key={field}>
            <Typography sx={labelStyle}>
              {lbl}
              {field === "full_name" && (
                <Typography
                  component="span"
                  sx={{ color: "#EF4444", fontSize: "0.75rem" }}
                >
                  {" "}*
                </Typography>
              )}
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={form[field] as string}
              onChange={handleChange(field)}
              inputProps={field === "contact" ? { maxLength: 15 } : undefined}
              sx={inputStyle}
            />
          </Box>
        ))}
      </Box>

      {/* Medical — Gender, Age, Marital, Address */}
      {IS_MEDICAL_APP && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 2,
            mb: 4,
          }}
        >
          <Box>
            <Typography sx={labelStyle}>Gender</Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={form.gender}
              onChange={handleSelectChange("gender")}
              sx={inputStyle}
            >
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
            </TextField>
          </Box>
          <Box>
            <Typography sx={labelStyle}>Age</Typography>
            <TextField
              fullWidth
              size="small"
              type="number"
              value={form.age}
              onChange={handleChange("age")}
              sx={inputStyle}
            />
          </Box>
          <Box>
            <Typography sx={labelStyle}>Marital Status</Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={form.marital}
              onChange={handleSelectChange("marital")}
              sx={inputStyle}
            >
              <MenuItem value="">-- Select --</MenuItem>
              <MenuItem value="married">Married</MenuItem>
              <MenuItem value="single">Single</MenuItem>
            </TextField>
          </Box>
          <Box>
            <Typography sx={labelStyle}>Address</Typography>
            <TextField
              fullWidth
              size="small"
              value={form.address}
              onChange={handleChange("address")}
              sx={inputStyle}
            />
          </Box>
        </Box>
      )}

      {/* Language */}
      <Box sx={{ mb: 4 }}>
        <Typography sx={labelStyle}>Language Preference</Typography>
        <TextField
          select
          fullWidth
          size="small"
          value={form.language}
          onChange={handleSelectChange("language")}
          sx={{ ...inputStyle, maxWidth: "25%" }}
        >
          <MenuItem value="">-- Select --</MenuItem>
          <MenuItem value="English">English</MenuItem>
          <MenuItem value="Hindi">Hindi</MenuItem>
          <MenuItem value="Kannada">Kannada</MenuItem>
        </TextField>
      </Box>

      {/* ── PARTNER INFORMATION — medical only ───────────────────────────── */}
      {IS_MEDICAL_APP && (
        <>
          <Typography
            variant="subtitle2"
            fontWeight={700}
            color="#1E293B"
            sx={{ mb: 2 }}
          >
            PARTNER INFORMATION
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ ...labelStyle, mb: 1 }}>
              Is This Inquiry For A Couple?
            </Typography>
            <RadioGroup
              row
              value={isCouple}
              onChange={(e) => setIsCouple(e.target.value as "yes" | "no")}
            >
              <FormControlLabel
                value="yes"
                control={<Radio size="small" />}
                label="Yes"
              />
              <FormControlLabel
                value="no"
                control={<Radio size="small" />}
                label="No"
              />
            </RadioGroup>
          </Box>
          {isCouple === "yes" && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 2,
                mb: 4,
              }}
            >
              <Box>
                <Typography sx={labelStyle}>Full Name</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={form.partnerName}
                  onChange={handleChange("partnerName")}
                  sx={inputStyle}
                />
              </Box>
              <Box>
                <Typography sx={labelStyle}>Age</Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  value={form.partnerAge}
                  onChange={handleChange("partnerAge")}
                  sx={inputStyle}
                />
              </Box>
              <Box>
                <Typography sx={labelStyle}>Gender</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={form.partnerGender}
                  onChange={handleSelectChange("partnerGender")}
                  sx={inputStyle}
                >
                  <MenuItem value="">-- Select --</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                </TextField>
              </Box>
            </Box>
          )}
        </>
      )}

      {/* ── CONTACT INFORMATION — contracts only ─────────────────────────── */}
      {IS_CONTRACTS_APP && (
        <>
          <Typography
            variant="subtitle2"
            fontWeight={700}
            color="#1E293B"
            sx={{ mb: 2 }}
          >
            {ACTIVE_FLOW_COPY.contactSectionLabel}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 2,
              mb: 4,
            }}
          >
            {(
              [
                ["Full Name", "contactFullName"],
                ["Designation", "designation"],
                ["Contact No.", "contactPhone"],
                ["Email", "contactEmail"],
              ] as [string, keyof FormState][]
            ).map(([lbl, field]) => (
              <Box key={field}>
                <Typography sx={labelStyle}>{lbl}</Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={(form[field] as string) ?? ""}
                  onChange={handleChange(field)}
                  inputProps={
                    field === "contactPhone" ? { maxLength: 15 } : undefined
                  }
                  sx={inputStyle}
                />
              </Box>
            ))}
          </Box>
        </>
      )}

      {/* ── SOURCE & CAMPAIGN DETAILS ────────────────────────────────────── */}
      <Typography
        variant="subtitle2"
        fontWeight={700}
        color="#1E293B"
        sx={{ mb: 2 }}
      >
        SOURCE & CAMPAIGN DETAILS
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: isCampaignDisabled
            ? "repeat(2, 1fr)"
            : "repeat(3, 1fr)",
          gap: 2,
          mb: 4,
        }}
      >
        {/* Source */}
        <Box>
          <Typography sx={labelStyle}>
            Source
            {campaignSelected && (
              <Typography
                component="span"
                sx={{
                  fontSize: "0.65rem",
                  color: "#6366F1",
                  ml: 1,
                  fontWeight: 500,
                }}
              >
                auto-filled from campaign
              </Typography>
            )}
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={form.source}
            onChange={(e) => handleSourceChange(e.target.value)}
            sx={inputStyle}
          >
            <MenuItem value="">-- Select --</MenuItem>
            {SOURCE_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Sub-Source */}
        {form.source !== "Other" && (
          <Box>
            <Typography sx={labelStyle}>
              Sub-Source
              {campaignSelected && (
                <Typography
                  component="span"
                  sx={{
                    fontSize: "0.65rem",
                    color: "#6366F1",
                    ml: 1,
                    fontWeight: 500,
                  }}
                >
                  auto-filled from campaign
                </Typography>
              )}
            </Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={form.subSource}
              onChange={(e) => handleSubSourceChange(e.target.value)}
              disabled={
                !form.source ||
                (form.source === "Referral" && loadingReferralDepts)
              }
              sx={inputStyle}
              InputProps={{
                endAdornment:
                  form.source === "Referral" && loadingReferralDepts ? (
                    <CircularProgress size={16} sx={{ mr: 3 }} />
                  ) : null,
              }}
            >
              <MenuItem value="">-- Select --</MenuItem>
              {form.source === "Referral" && loadingReferralDepts ? (
                <MenuItem value="" disabled>
                  Loading departments...
                </MenuItem>
              ) : form.source === "Referral" &&
                availableSubSources.length === 0 ? (
                <MenuItem value="" disabled>
                  No departments available
                </MenuItem>
              ) : (
                availableSubSources.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))
              )}
              {!form.source && (
                <MenuItem value="" disabled>
                  Select source first
                </MenuItem>
              )}
            </TextField>
          </Box>
        )}

        {/* Campaign Name */}
        {form.source !== "Other" && !isCampaignDisabled && (
          <Box>
            <Typography sx={labelStyle}>
              Campaign Name
              {form.subSource && !campaignSelected && (
                <Typography
                  component="span"
                  sx={{
                    fontSize: "0.65rem",
                    color: "#94A3B8",
                    ml: 1,
                    fontWeight: 500,
                  }}
                >
                  linked with {form.subSource}
                </Typography>
              )}
            </Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={form.campaign}
              onChange={(e) => handleCampaignChange(e.target.value)}
              disabled={!form.source && !form.subSource}
              sx={inputStyle}
            >
              <MenuItem value="">-- None --</MenuItem>
              {filteredCampaigns.length === 0 ? (
                <MenuItem value="" disabled>
                  {form.source || form.subSource
                    ? "No campaigns match the selected source / sub-source"
                    : "No campaigns available"}
                </MenuItem>
              ) : (
                filteredCampaigns.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))
              )}
            </TextField>
          </Box>
        )}
      </Box>

      {/* ── ASSIGNEE & NEXT ACTION DETAILS ───────────────────────────────── */}
      <Typography
        variant="subtitle2"
        fontWeight={700}
        color="#1E293B"
        sx={{ mb: 2 }}
      >
        ASSIGNEE & NEXT ACTION DETAILS
      </Typography>

      {/* Row 1 */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: IS_CONTRACTS_APP
            ? "repeat(3, 1fr)"
            : "repeat(2, 1fr)",
          gap: 2,
          mb: 2,
        }}
      >
        {/* Assigned To */}
        <Box>
          <Typography sx={labelStyle}>
            Assigned To{" "}
            <Typography
              component="span"
              sx={{ color: "#EF4444", fontSize: "0.75rem" }}
            >
              *
            </Typography>
          </Typography>
          <Autocomplete
            options={assigneeOptions}
            loading={assigneeLoading}
            clearOnBlur={false}
            filterOptions={(options) => options}
            value={
              assigneeOptions.find((o) => String(o.id) === form.assignee) ||
              null
            }
            inputValue={assigneeName}
            onInputChange={(_, value: string, reason) => {
              if (reason === "reset") return;
              handleAssigneeInputChange(value);
            }}
            onChange={(_, value: AssigneeOption | null) =>
              handleAssigneeChange(value)
            }
            getOptionLabel={assigneeLabel}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            noOptionsText="Type to search assignee"
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {`${option.first_name ?? ""} ${option.last_name ?? ""}`.trim() ||
                      option.username}
                  </Typography>
                  {(option.role || option.designation) && (
                    <Typography variant="caption" color="text.secondary">
                      {option.role || option.designation}
                    </Typography>
                  )}
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                size="small"
                placeholder="Search assignee"
                sx={inputStyle}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {assigneeLoading ? (
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Box>

        {/* Lead Generated By (Referral) — contracts only */}
        {IS_CONTRACTS_APP && (
          <Box>
            <Typography sx={labelStyle}>Lead Generated By (Referral)</Typography>
            <Autocomplete
              options={leadGeneratedByOptions}
              loading={leadGeneratedByLoading}
              clearOnBlur={false}
              filterOptions={(options) => options}
              // FIX: track open/close state so info card only shows while dropdown is open
              open={leadGeneratedByOpen}
              onOpen={() => setLeadGeneratedByOpen(true)}
              onClose={() => setLeadGeneratedByOpen(false)}
              value={
                leadGeneratedByOptions.find(
                  (o) => assigneeLabel(o) === leadGeneratedByInput,
                ) || null
              }
              inputValue={leadGeneratedByInput}
              onInputChange={(_, value: string, reason) => {
                if (reason === "reset") return;
                handleLeadGeneratedByInputChange(value);
              }}
              onChange={(_, value: AssigneeOption | null) => {
                handleLeadGeneratedByChange(value);
                // Close the dropdown immediately after selection
                setLeadGeneratedByOpen(false);
              }}
              getOptionLabel={assigneeLabel}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              noOptionsText="Type to search user"
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {`${option.first_name ?? ""} ${option.last_name ?? ""}`.trim() ||
                        option.username ||
                        `User ${option.id}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {[option.role || option.designation, option.email]
                        .filter(Boolean)
                        .join(" · ")}
                    </Typography>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  size="small"
                  placeholder="Search user"
                  sx={inputStyle}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {leadGeneratedByLoading ? (
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            {/*
              FIX: Info card is now ONLY shown while the dropdown is open.
              Previously it showed whenever selectedLeadGeneratedBy was non-null,
              which caused it to stay visible after selection permanently.
              Now it disappears as soon as the user picks an option.
            */}
            {leadGeneratedByOpen && selectedLeadGeneratedBy && (
              <Box
                sx={{
                  mt: 1,
                  p: 1.5,
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  bgcolor: "#F8FAFC",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 1,
                }}
              >
                {(
                  [
                    ["FIRST NAME", selectedLeadGeneratedBy.first_name],
                    ["LAST NAME", selectedLeadGeneratedBy.last_name],
                    ["ROLE", selectedLeadGeneratedBy.role],
                    ["EMAIL", selectedLeadGeneratedBy.email],
                  ] as [string, string | undefined][]
                ).map(([fieldLabel, fieldValue]) => (
                  <Box key={fieldLabel}>
                    <Typography
                      sx={{
                        fontSize: "0.65rem",
                        color: "#94A3B8",
                        fontWeight: 600,
                      }}
                    >
                      {fieldLabel}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.8rem",
                        fontWeight: 500,
                        color: fieldLabel === "EMAIL" ? "#6366F1" : "#1E293B",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fieldValue || "—"}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Referral Department — contracts only */}
        {IS_CONTRACTS_APP && (
          <Box>
            <Typography sx={labelStyle}>Referral Department</Typography>
            <TextField
              select
              fullWidth
              size="small"
              value={form.referralDepartment}
              onChange={(e) => handleReferralDepartmentChange(e.target.value)}
              sx={inputStyle}
              disabled={loadingReferralDepts}
              InputProps={{
                endAdornment: loadingReferralDepts ? (
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                ) : null,
              }}
            >
              <MenuItem value="">-- None --</MenuItem>
              {loadingReferralDepts ? (
                <MenuItem value="" disabled>
                  Loading...
                </MenuItem>
              ) : referralDepartments.length === 0 ? (
                <MenuItem value="" disabled>
                  No departments available
                </MenuItem>
              ) : (
                referralDepartments.map((dept) => (
                  <MenuItem key={dept.id} value={String(dept.id)}>
                    {dept.name}
                  </MenuItem>
                ))
              )}
            </TextField>
          </Box>
        )}
      </Box>

      {/* Row 2: Lead Status | Next Action Status | Next Action Type | Next Action Description */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: IS_CONTRACTS_APP
            ? "repeat(4, 1fr)"
            : "repeat(3, 1fr)",
          gap: 2,
          mb: 2,
        }}
      >
        {/* Lead Status */}
        <Box>
          <Typography sx={labelStyle}>
            Lead Status{" "}
            <Typography
              component="span"
              sx={{ color: "#EF4444", fontSize: "0.75rem" }}
            >
              *
            </Typography>
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={form.leadStatus}
            onChange={(e) => handleLeadStatusChange(e.target.value)}
            sx={inputStyle}
          >
            <MenuItem value="">-- Select --</MenuItem>
            {resolvedLeadStatusOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Next Action Status */}
        <Box>
          <Typography sx={labelStyle}>
            Next Action Status{" "}
            <Typography
              component="span"
              sx={{ color: "#EF4444", fontSize: "0.75rem" }}
            >
              *
            </Typography>
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={form.nextStatus}
            onChange={(e) => handleNextStatusChange(e.target.value)}
            sx={inputStyle}
          >
            <MenuItem value="">-- Select --</MenuItem>
            {resolvedNextActionStatusOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Next Action Type */}
        <Box>
          <Typography sx={labelStyle}>Next Action Type</Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={form.nextType}
            onChange={(e) => handleNextTypeChange(e.target.value)}
            sx={inputStyle}
            disabled={resolvedNextActionTypeOptions.length === 0}
          >
            <MenuItem value="">-- Select --</MenuItem>
            {resolvedNextActionTypeOptions.length === 0 ? (
              <MenuItem value="" disabled>
                {form.leadStatus
                  ? "No actions configured for this stage"
                  : "Select a lead status first"}
              </MenuItem>
            ) : (
              resolvedNextActionTypeOptions.map((label) => (
                <MenuItem key={label} value={label}>
                  {capitalizeWords(label)}
                </MenuItem>
              ))
            )}
          </TextField>
        </Box>

        {/* Next Action Description — contracts inline */}
        {IS_CONTRACTS_APP && (
          <Box>
            <Typography sx={labelStyle}>Next Action Description</Typography>
            <TextField
              fullWidth
              size="small"
              value={form.nextDesc}
              onChange={handleChange("nextDesc")}
              sx={inputStyle}
            />
          </Box>
        )}
      </Box>

      {/* Next Action Description — full width for non-contracts */}
      {!IS_CONTRACTS_APP && (
        <Box sx={{ mb: 2 }}>
          <Typography sx={labelStyle}>Next Action Description</Typography>
          <TextField
            fullWidth
            size="small"
            value={form.nextDesc}
            onChange={handleChange("nextDesc")}
            sx={inputStyle}
          />
        </Box>
      )}
    </Box>
  );
}

// ====================== STEP 2 ======================
interface Step2Props {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  pendingFiles: File[];
  docDragOver: boolean;
  setDocDragOver: React.Dispatch<React.SetStateAction<boolean>>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  addFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Step2({
  form,
  setForm,
  pendingFiles,
  docDragOver,
  setDocDragOver,
  fileInputRef,
  addFiles,
  removeFile,
  handleFileInputChange,
}: Step2Props) {
  const sectionHeading = IS_MEDICAL_APP
    ? "TREATMENT INFORMATION"
    : "PRODUCT INFORMATION";
  const interestLabel = ACTIVE_FLOW_COPY.treatmentLabel;
  const interestOptions = ACTIVE_FLOW_COPY.treatmentOptions;

  return (
    <Box>
      <Typography
        variant="subtitle2"
        fontWeight={700}
        color="#1E293B"
        sx={{ mb: 2 }}
      >
        {sectionHeading}
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography sx={labelStyle}>{interestLabel}</Typography>
        <TextField
          select
          fullWidth
          size="small"
          value={form.treatmentInterest}
          onChange={(e) => {
            const value = e.target.value;
            setForm((prev) => ({
              ...prev,
              treatmentInterest: value,
              treatments: prev.treatments.includes(value)
                ? prev.treatments
                : [...prev.treatments, value],
            }));
          }}
          sx={{ ...inputStyle, maxWidth: "50%" }}
          SelectProps={{ displayEmpty: true }}
        >
          <MenuItem value="" disabled>
            Select
          </MenuItem>
          {interestOptions.map((opt) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {form.treatments.length > 0 && (
        <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
          {form.treatments.map((t) => (
            <Chip
              key={t}
              label={t}
              onDelete={() =>
                setForm((prev) => ({
                  ...prev,
                  treatments: prev.treatments.filter((x) => x !== t),
                }))
              }
              sx={{
                bgcolor: "#FEE2E2",
                color: "#B91C1C",
                fontWeight: 600,
                border: "1px solid #FCA5A5",
                "& .MuiChip-deleteIcon": {
                  color: "#B91C1C",
                  "&:hover": { color: "#991B1B" },
                },
              }}
            />
          ))}
        </Stack>
      )}

      <Typography
        variant="subtitle2"
        fontWeight={700}
        color="#1E293B"
        sx={{ mb: 2 }}
      >
        DOCUMENTS & REPORTS (Optional)
      </Typography>

      <Box
        onDrop={(e) => {
          e.preventDefault();
          setDocDragOver(false);
          addFiles(Array.from(e.dataTransfer.files));
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDocDragOver(true);
        }}
        onDragLeave={() => setDocDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          border: docDragOver ? "2px dashed #6366F1" : "2px dashed #E2E8F0",
          borderRadius: "12px",
          p: 3,
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          bgcolor: docDragOver ? "rgba(99,102,241,0.04)" : "#F8FAFC",
          minWidth: "400px",
          transition: "all 0.2s",
          cursor: "pointer",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          hidden
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
          onChange={handleFileInputChange}
        />
        <UploadFileIcon sx={{ fontSize: 28, color: "#94A3B8", mb: 1 }} />
        <Button
          variant="contained"
          component="span"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          sx={{
            bgcolor: "#64748B",
            textTransform: "none",
            borderRadius: "8px",
            fontWeight: 600,
            px: 3,
            py: 1,
            "&:hover": { bgcolor: "#475569" },
          }}
        >
          Choose File
        </Button>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 1 }}
        >
          {pendingFiles.length > 0
            ? `${pendingFiles.length} file${pendingFiles.length > 1 ? "s" : ""} selected`
            : "No File Chosen · PDF, Word, JPG, PNG up to 10MB"}
        </Typography>
      </Box>

      {pendingFiles.length > 0 && (
        <Stack spacing={1} sx={{ mt: 2, maxWidth: "500px" }}>
          {pendingFiles.map((file, index) => {
            const color = getDocColor(file.name);
            const ext = file.name.split(".").pop()?.toUpperCase() ?? "FILE";
            return (
              <Stack
                key={`${file.name}-${index}`}
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  bgcolor: "#F8FAFC",
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "6px",
                    bgcolor: `${color}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <InsertDriveFileOutlinedIcon sx={{ fontSize: 16, color }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color="#1E293B"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {ext} · {(file.size / 1024).toFixed(0)} KB
                  </Typography>
                </Box>
                <Tooltip title="Remove">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    sx={{ color: "#94A3B8", "&:hover": { color: "#EF4444" } }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

// ====================== STEP 3 ======================
interface Step3Props {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  selectedDate: Dayjs | null;
  setSelectedDate: React.Dispatch<React.SetStateAction<Dayjs | null>>;
  departments: Department[];
  loadingDepartments: boolean;
  loadingEmployees: boolean;
  personnelInput: string;
  personnelOptions: AssigneeOption[];
  personnelLoading: boolean;
  selectedPersonnel: AssigneeOption | null;
  handlePersonnelInputChange: (value: string) => void;
  handlePersonnelChange: (value: AssigneeOption | null) => void;
  handleChange: (
    field: keyof FormState,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDepartmentChange: (value: string) => void;
}

export function Step3({
  form,
  setForm,
  selectedDate,
  setSelectedDate,
  departments,
  loadingDepartments,
  loadingEmployees,
  personnelInput,
  personnelOptions,
  personnelLoading,
  selectedPersonnel,
  handlePersonnelInputChange,
  handlePersonnelChange,
  handleChange,
  handleDepartmentChange,
}: Step3Props) {
  const noAppointment = form.wantAppointment === "no";

  const handleWantAppointmentChange = (value: "yes" | "no") => {
    setForm((prev) => ({
      ...prev,
      wantAppointment: value,
      ...(value === "no" && {
        department: "",
        personnel: "",
        appointmentDate: "",
        slot: "",
        remark: "",
      }),
    }));
    if (value === "no") setSelectedDate(null);
  };

  return (
    <Box>
      <Typography
        variant="subtitle2"
        fontWeight={700}
        color="#1E293B"
        sx={{ mb: 2 }}
      >
        APPOINTMENT DETAILS
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ ...labelStyle, mb: 1 }}>
          Want to Book an Appointment?
        </Typography>
        <RadioGroup
          row
          value={form.wantAppointment}
          onChange={(e) =>
            handleWantAppointmentChange(e.target.value as "yes" | "no")
          }
        >
          <FormControlLabel
            value="yes"
            control={<Radio size="small" />}
            label="Yes"
          />
          <FormControlLabel
            value="no"
            control={<Radio size="small" />}
            label="No"
          />
        </RadioGroup>
      </Box>

      {!noAppointment && (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: IS_MEDICAL_APP ? "repeat(2, 1fr)" : "1fr",
              gap: 2,
              mb: 2,
            }}
          >
            {IS_MEDICAL_APP && (
              <Box>
                <Typography sx={labelStyle}>Department</Typography>
                <Autocomplete
                  options={departments}
                  loading={loadingDepartments}
                  disabled={loadingDepartments}
                  value={
                    departments.find(
                      (d) => d.id.toString() === form.department,
                    ) ?? null
                  }
                  getOptionLabel={(d) => d.name}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  onChange={(_, dept) =>
                    handleDepartmentChange(dept ? dept.id.toString() : "")
                  }
                  renderOption={(props, dept) => (
                    <li {...props} key={dept.id}>
                      {dept.name}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      fullWidth
                      placeholder="Search department"
                      sx={inputStyle}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingDepartments ? (
                              <CircularProgress size={20} sx={{ mr: 1 }} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  noOptionsText={
                    loadingDepartments ? "Loading..." : "No departments"
                  }
                />
              </Box>
            )}

            <Box>
              <Typography sx={labelStyle}>Appointment Personnel</Typography>
              <Autocomplete
                options={personnelOptions}
                loading={personnelLoading || loadingEmployees}
                clearOnBlur={false}
                filterOptions={(options) => options}
                value={selectedPersonnel}
                inputValue={personnelInput}
                onInputChange={(_, value: string, reason) => {
                  if (reason === "reset") return;
                  handlePersonnelInputChange(value);
                }}
                onChange={(_, value: AssigneeOption | null) =>
                  handlePersonnelChange(value)
                }
                getOptionLabel={assigneeLabel}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                disabled={
                  loadingEmployees ||
                  (IS_MEDICAL_APP ? !form.department : false)
                }
                noOptionsText={
                  IS_MEDICAL_APP && !form.department
                    ? "Select department first"
                    : "Type to search personnel"
                }
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {`${option.first_name ?? ""} ${option.last_name ?? ""}`.trim() ||
                          option.username}
                      </Typography>
                      {(option.role || option.designation) && (
                        <Typography variant="caption" color="text.secondary">
                          {option.role || option.designation}
                        </Typography>
                      )}
                    </Box>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    size="small"
                    placeholder="Search appointment personnel"
                    sx={inputStyle}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {personnelLoading || loadingEmployees ? (
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 2,
              mb: 3,
            }}
          >
            <Box>
              <Typography sx={labelStyle}>Date</Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  value={selectedDate}
                  format="DD/MM/YYYY"
                  disablePast
                  onChange={(newDate) => {
                    const asDayjs = newDate
                      ? dayjs(newDate as Dayjs | Date)
                      : null;
                    const validDate =
                      asDayjs && asDayjs.isValid() ? asDayjs : null;
                    setSelectedDate(validDate);
                    setForm((prev) => ({
                      ...prev,
                      appointmentDate: validDate
                        ? validDate.format("YYYY-MM-DD")
                        : "",
                    }));
                  }}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      sx: inputStyle,
                    },
                  }}
                />
              </LocalizationProvider>
            </Box>
            <Box>
              <Typography sx={labelStyle}>Select Slot</Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={form.slot}
                onChange={handleChange("slot")}
                sx={inputStyle}
                SelectProps={{
                  native: false,
                  MenuProps: SLOT_MENU_PROPS,
                }}
              >
                <MenuItem value="">-- Select --</MenuItem>
                {TIME_SLOTS.map((slot, i) => (
                  <MenuItem key={i} value={slot}>
                    {slot}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>

          <Box>
            <Typography sx={labelStyle}>Remark</Typography>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              placeholder="Type Here..."
              value={form.remark}
              onChange={handleChange("remark")}
              sx={inputStyle}
            />
          </Box>
        </>
      )}
    </Box>
  );
}