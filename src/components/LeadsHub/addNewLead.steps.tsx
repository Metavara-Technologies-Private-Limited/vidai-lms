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
import type { FormState } from "../../types/leads.types";
import {
  TASK_TYPES,
  TASK_STATUS_FOR_TYPE,
  TIME_SLOTS,
  inputStyle,
  readOnlyStyle,
  labelStyle,
  getDocColor,
} from "../LeadsHub/addNewLead.constants";

// ── Import appType config ─────────────────────────────────────────────────────
import {
  IS_MEDICAL_APP,
  IS_CONTRACTS_APP,
  ACTIVE_FLOW_COPY,
} from "../../config/appType";

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

const assigneeLabel = (option: AssigneeOption): string => {
  const fullName = `${option.first_name ?? ""} ${option.last_name ?? ""}`.trim();
  const primary = fullName || option.username || `User ${option.id}`;
  const secondary = option.role || option.designation;
  return secondary ? `${primary} (${secondary})` : primary;
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
  campaigns: Campaign[];
  handleChange: (
    field: keyof FormState,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAssigneeInputChange: (value: string) => void;
  handleAssigneeChange: (value: AssigneeOption | null) => void;
  handleLeadGeneratedByInputChange: (value: string) => void;
  handleLeadGeneratedByChange: (value: AssigneeOption | null) => void;
  handleCampaignChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleNextTypeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
  campaigns,
  handleChange,
  handleAssigneeInputChange,
  handleAssigneeChange,
  handleLeadGeneratedByInputChange,
  handleLeadGeneratedByChange,
  handleCampaignChange,
  handleNextTypeChange,
}: Step1Props) {
  const campaignSelected = Boolean(form.campaign);

  return (
    <Box>
      {/* ── LEAD INFORMATION ─────────────────────────────────────────────── */}
      <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>
        LEAD INFORMATION
      </Typography>

      {/* Row 1: Full Name, Contact, Email, Location — same for both app types */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 3 }}>
        {(
          [
            ["Full Name", "full_name"],
            ["Contact No.", "contact"],
            ["Email", "email"],
            ["Location", "location"],
          ] as [string, keyof FormState][]
        ).map(([lbl, field]) => (
          <Box key={field}>
            <Typography sx={labelStyle}>{lbl}</Typography>
            <TextField
              fullWidth
              size="small"
              value={form[field] as string}
              onChange={handleChange(field)}
              sx={inputStyle}
            />
          </Box>
        ))}
      </Box>

      {/* Row 2: Medical app shows Gender, Age, Marital Status, Address.
               Contracts app shows Designation (Contact Info section) + Address */}
      {IS_MEDICAL_APP && (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 4 }}>
          <Box>
            <Typography sx={labelStyle}>Gender</Typography>
            <TextField
              select fullWidth size="small"
              value={form.gender}
              onChange={handleChange("gender")}
              sx={inputStyle}
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
          </Box>
          <Box>
            <Typography sx={labelStyle}>Age</Typography>
            <TextField
              fullWidth size="small" type="number"
              value={form.age}
              onChange={handleChange("age")}
              sx={inputStyle}
            />
          </Box>
          <Box>
            <Typography sx={labelStyle}>Marital Status</Typography>
            <TextField
              select fullWidth size="small"
              value={form.marital}
              onChange={handleChange("marital")}
              sx={inputStyle}
            >
              <MenuItem value="">-- Select --</MenuItem>
              <MenuItem value="Married">Married</MenuItem>
              <MenuItem value="Single">Single</MenuItem>
            </TextField>
          </Box>
          <Box>
            <Typography sx={labelStyle}>Address</Typography>
            <TextField
              fullWidth size="small"
              value={form.address}
              onChange={handleChange("address")}
              sx={inputStyle}
            />
          </Box>
        </Box>
      )}

      {IS_CONTRACTS_APP && (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 4 }}>
          <Box>
            <Typography sx={labelStyle}>Address</Typography>
            <TextField
              fullWidth size="small"
              value={form.address}
              onChange={handleChange("address")}
              sx={inputStyle}
            />
          </Box>
        </Box>
      )}

      {/* Language Preference — same for both */}
      <Box sx={{ mb: 4 }}>
        <Typography sx={labelStyle}>Language Preference</Typography>
        <TextField
          select fullWidth size="small"
          value={form.language}
          onChange={handleChange("language")}
          sx={{ ...inputStyle, maxWidth: "25%" }}
        >
          <MenuItem value="">-- Select --</MenuItem>
          <MenuItem value="English">English</MenuItem>
          <MenuItem value="Hindi">Hindi</MenuItem>
          <MenuItem value="Kannada">Kannada</MenuItem>
        </TextField>
      </Box>

      {/* ── PARTNER INFORMATION — only for medical app ────────────────────── */}
      {IS_MEDICAL_APP && (
        <>
          <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>
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
              <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
              <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
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
                  fullWidth size="small"
                  value={form.partnerName}
                  onChange={handleChange("partnerName")}
                  sx={inputStyle}
                />
              </Box>
              <Box>
                <Typography sx={labelStyle}>Age</Typography>
                <TextField
                  fullWidth size="small" type="number"
                  value={form.partnerAge}
                  onChange={handleChange("partnerAge")}
                  sx={inputStyle}
                />
              </Box>
              <Box>
                <Typography sx={labelStyle}>Gender</Typography>
                <TextField
                  select fullWidth size="small"
                  value={form.partnerGender}
                  onChange={handleChange("partnerGender")}
                  sx={inputStyle}
                >
                  <MenuItem value="">-- Select --</MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </TextField>
              </Box>
            </Box>
          )}
        </>
      )}

      {/* ── CONTACT INFORMATION — contracts app adds Designation ─────────── */}
      {IS_CONTRACTS_APP && (
        <>
          <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>
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
            <Box>
              <Typography sx={labelStyle}>Full Name</Typography>
              <TextField
                fullWidth size="small"
                value={form.contactFullName ?? ""}
                onChange={handleChange("contactFullName" as keyof FormState)}
                sx={inputStyle}
              />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Designation</Typography>
              <TextField
                fullWidth size="small"
                value={form.designation ?? ""}
                onChange={handleChange("designation" as keyof FormState)}
                sx={inputStyle}
              />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Contact No.</Typography>
              <TextField
                fullWidth size="small"
                value={form.contactPhone ?? ""}
                onChange={handleChange("contactPhone" as keyof FormState)}
                sx={inputStyle}
              />
            </Box>
            <Box>
              <Typography sx={labelStyle}>Email</Typography>
              <TextField
                fullWidth size="small"
                value={form.contactEmail ?? ""}
                onChange={handleChange("contactEmail" as keyof FormState)}
                sx={inputStyle}
              />
            </Box>
          </Box>
        </>
      )}

      {/* ── SOURCE & CAMPAIGN DETAILS ────────────────────────────────────── */}
      <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>
        SOURCE & CAMPAIGN DETAILS
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 4 }}>
        <Box>
          <Typography sx={labelStyle}>Campaign Name</Typography>
          <TextField
            select fullWidth size="small"
            value={form.campaign}
            onChange={handleCampaignChange}
            sx={inputStyle}
          >
            <MenuItem value="">-- None --</MenuItem>
            {campaigns.length === 0 ? (
              <MenuItem value="" disabled>No campaigns available</MenuItem>
            ) : (
              campaigns.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))
            )}
          </TextField>
        </Box>
        <Box>
          <Typography sx={labelStyle}>
            Source
            {campaignSelected && (
              <Typography
                component="span"
                sx={{ fontSize: "0.65rem", color: "#6366F1", ml: 1, fontWeight: 500 }}
              >
                auto-filled from campaign
              </Typography>
            )}
          </Typography>
          {campaignSelected ? (
            <TextField
              fullWidth size="small"
              value={form.source}
              InputProps={{ readOnly: true }}
              sx={readOnlyStyle}
            />
          ) : (
            <TextField
              select fullWidth size="small"
              value={form.source}
              onChange={handleChange("source")}
              sx={inputStyle}
            >
              <MenuItem value="">-- Select --</MenuItem>
              <MenuItem value="Social Media">Social Media</MenuItem>
              <MenuItem value="Website">Website</MenuItem>
              <MenuItem value="Referral">Referral</MenuItem>
              <MenuItem value="Direct">Direct</MenuItem>
            </TextField>
          )}
        </Box>
        <Box>
          <Typography sx={labelStyle}>
            Sub-Source
            {campaignSelected && (
              <Typography
                component="span"
                sx={{ fontSize: "0.65rem", color: "#6366F1", ml: 1, fontWeight: 500 }}
              >
                auto-filled from campaign
              </Typography>
            )}
          </Typography>
          {campaignSelected ? (
            <TextField
              fullWidth size="small"
              value={form.subSource}
              InputProps={{ readOnly: true }}
              sx={readOnlyStyle}
            />
          ) : (
            <TextField
              select fullWidth size="small"
              value={form.subSource}
              onChange={handleChange("subSource")}
              sx={inputStyle}
            >
              <MenuItem value="">-- Select --</MenuItem>
              <MenuItem value="Facebook">Facebook</MenuItem>
              <MenuItem value="Instagram">Instagram</MenuItem>
              <MenuItem value="Google">Google</MenuItem>
              <MenuItem value="LinkedIn">LinkedIn</MenuItem>
            </TextField>
          )}
        </Box>
      </Box>

      {/* ── ASSIGNEE & NEXT ACTION DETAILS ───────────────────────────────── */}
      <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>
        ASSIGNEE & NEXT ACTION DETAILS
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 2 }}>
        <Box>
          <Typography sx={labelStyle}>Assigned To</Typography>
          <Autocomplete
            options={assigneeOptions}
            loading={assigneeLoading}
            clearOnBlur={false}
            filterOptions={(options) => options}
            value={assigneeOptions.find((option) => String(option.id) === form.assignee) || null}
            inputValue={assigneeName}
            onInputChange={(_, value, reason) => {
              if (reason === "reset") return;
              handleAssigneeInputChange(value);
            }}
            onChange={(_, value) => handleAssigneeChange(value)}
            getOptionLabel={assigneeLabel}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText="Type to search assignee"
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {assigneeLabel(option)}
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
                      {assigneeLoading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Box>

        {/* Lead Generated By — contracts app only */}
        {IS_CONTRACTS_APP && (
          <Box>
            <Typography sx={labelStyle}>Lead Generated By</Typography>
            <Autocomplete
              options={leadGeneratedByOptions}
              loading={leadGeneratedByLoading}
              clearOnBlur={false}
              filterOptions={(options) => options}
              value={
                leadGeneratedByOptions.find(
                  (option) => assigneeLabel(option) === leadGeneratedByInput,
                ) || null
              }
              inputValue={leadGeneratedByInput}
              onInputChange={(_, value, reason) => {
                if (reason === "reset") return;
                handleLeadGeneratedByInputChange(value);
              }}
              onChange={(_, value) => handleLeadGeneratedByChange(value)}
              getOptionLabel={assigneeLabel}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText="Type to search user"
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {assigneeLabel(option)}
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
          </Box>
        )}

        <Box>
          <Typography sx={labelStyle}>Next Action Type</Typography>
          <TextField
            select fullWidth size="small"
            value={form.nextType}
            onChange={handleNextTypeChange}
            sx={inputStyle}
          >
            <MenuItem value="">-- Select --</MenuItem>
            {TASK_TYPES.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </TextField>
        </Box>

        <Box>
          <Typography sx={labelStyle}>
            Next Action Status
            {form.nextType && (
              <Typography
                component="span"
                sx={{ fontSize: "0.65rem", color: "#6366F1", ml: 1, fontWeight: 500 }}
              >
                auto-set for {form.nextType}
              </Typography>
            )}
          </Typography>
          <TextField
            select fullWidth size="small"
            value={form.nextStatus}
            onChange={handleChange("nextStatus")}
            sx={form.nextType ? readOnlyStyle : inputStyle}
            InputProps={{ readOnly: Boolean(form.nextType) }}
          >
            {(
              TASK_STATUS_FOR_TYPE[form.nextType] ?? [
                { label: "To Do", value: "pending" },
                { label: "Done", value: "completed" },
              ]
            ).map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography sx={labelStyle}>Next Action Description</Typography>
        <TextField
          fullWidth size="small"
          value={form.nextDesc}
          onChange={handleChange("nextDesc")}
          sx={inputStyle}
        />
      </Box>
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
  // Section heading and field label driven by appType
  const sectionHeading = IS_MEDICAL_APP ? "TREATMENT INFORMATION" : "PRODUCT INFORMATION";
  const interestLabel = ACTIVE_FLOW_COPY.treatmentLabel;          // "Medical Interest" or "Product Interest"
  const interestOptions = ACTIVE_FLOW_COPY.treatmentOptions;      // IVF/IUI/... or PGT-M/PGT-A/PGT-SR

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>
        {sectionHeading}
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography sx={labelStyle}>{interestLabel}</Typography>
        <TextField
          select fullWidth size="small"
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
          <MenuItem value="" disabled>Select</MenuItem>
          {interestOptions.map((opt) => (
            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
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

      <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>
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
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
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
  handleDepartmentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
    if (value === "no") {
      setSelectedDate(null);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} color="#1E293B" sx={{ mb: 2 }}>
        APPOINTMENT DETAILS
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ ...labelStyle, mb: 1 }}>Want to Book an Appointment?</Typography>
        <RadioGroup
          row
          value={form.wantAppointment}
          onChange={(e) => handleWantAppointmentChange(e.target.value as "yes" | "no")}
        >
          <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
          <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
        </RadioGroup>
      </Box>

      {!noAppointment && (
        <>
          {/*
           * Department field: shown for medical app, hidden for contracts app.
           * ACTIVE_FLOW_COPY.showDepartment drives this.
           */}
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
                <TextField
                  select fullWidth size="small"
                  value={form.department}
                  onChange={handleDepartmentChange}
                  sx={inputStyle}
                  disabled={loadingDepartments}
                  InputProps={{
                    endAdornment: loadingDepartments
                      ? <CircularProgress size={20} sx={{ mr: 1 }} />
                      : null,
                  }}
                >
                  {loadingDepartments ? (
                    <MenuItem value="" disabled>Loading...</MenuItem>
                  ) : departments.length === 0 ? (
                    <MenuItem value="" disabled>No departments available</MenuItem>
                  ) : (
                    departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </MenuItem>
                    ))
                  )}
                </TextField>
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
                onInputChange={(_, value, reason) => {
                  if (reason === "reset") return;
                  handlePersonnelInputChange(value);
                }}
                onChange={(_, value) => handlePersonnelChange(value)}
                getOptionLabel={assigneeLabel}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                disabled={loadingEmployees || (IS_MEDICAL_APP ? !form.department : false)}
                noOptionsText={
                  IS_MEDICAL_APP && !form.department
                    ? "Select department first"
                    : "Type to search personnel"
                }
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    {assigneeLabel(option)}
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
              {!personnelLoading
                && !loadingEmployees
                && !(IS_MEDICAL_APP && !form.department)
                && personnelOptions.length === 0 && (
                  <Typography sx={{ fontSize: "0.75rem", color: "#94A3B8", mt: 0.5 }}>
                    Type to search personnel
                  </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, mb: 3 }}>
            <Box>
              <Typography sx={labelStyle}>Date</Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  value={selectedDate}
                  onChange={(newDate) => {
                    const asDayjs = newDate ? dayjs(newDate as Dayjs | Date) : null;
                    const validDate = asDayjs && asDayjs.isValid() ? asDayjs : null;
                    setSelectedDate(validDate);
                    setForm((prev) => ({
                      ...prev,
                      appointmentDate: validDate ? validDate.format("YYYY-MM-DD") : "",
                    }));
                  }}
                  slotProps={{
                    textField: { size: "small", fullWidth: true, sx: inputStyle },
                  }}
                />
              </LocalizationProvider>
            </Box>
            <Box>
              <Typography sx={labelStyle}>Select Slot</Typography>
              <TextField
                select fullWidth size="small"
                value={form.slot}
                onChange={handleChange("slot")}
                sx={inputStyle}
              >
                {TIME_SLOTS.map((slot, i) => (
                  <MenuItem key={i} value={slot}>{slot}</MenuItem>
                ))}
              </TextField>
            </Box>
          </Box>

          <Box>
            <Typography sx={labelStyle}>Remark</Typography>
            <TextField
              fullWidth size="small" multiline rows={2}
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