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
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import CloseIcon from "@mui/icons-material/Close";
import UploadFileIcon from "@mui/icons-material/UploadFile";

import type { Department, Employee } from "../../services/leads.api";
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

type Campaign = { id: string; name: string; source: string; subSource: string };

// ====================== STEP 1 ======================
interface Step1Props {
  form: FormState;
  isCouple: "yes" | "no";
  setIsCouple: (v: "yes" | "no") => void;
  employees: Employee[];
  loadingEmployees: boolean;
  campaigns: Campaign[];
  handleChange: (
    field: keyof FormState,
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCampaignChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleNextTypeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Step1({
  form,
  isCouple,
  setIsCouple,
  employees,
  loadingEmployees,
  campaigns,
  handleChange,
  handleCampaignChange,
  handleNextTypeChange,
}: Step1Props) {
  const campaignSelected = Boolean(form.campaign);

  return (
    <Box>
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
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 2,
          mb: 3,
        }}
      >
        {(
          [
            ["Full Name *", "full_name"],
            ["Contact No. *", "contact"],
            ["Email *", "email"],
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

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography sx={labelStyle}>Gender *</Typography>
          <TextField
            select
            fullWidth
            size="small"
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
          <Typography sx={labelStyle}>Age *</Typography>
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
            fullWidth
            size="small"
            value={form.address}
            onChange={handleChange("address")}
            sx={inputStyle}
          />
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography sx={labelStyle}>Language Preference</Typography>
        <TextField
          select
          fullWidth
          size="small"
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
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography sx={labelStyle}>Campaign Name</Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={form.campaign}
            onChange={handleCampaignChange}
            sx={inputStyle}
          >
            <MenuItem value="">-- None --</MenuItem>
            {campaigns.length === 0 ? (
              <MenuItem value="" disabled>
                No campaigns available
              </MenuItem>
            ) : (
              campaigns.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))
            )}
          </TextField>
        </Box>
        <Box>
          <Typography sx={labelStyle}>
            Source *
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
          {campaignSelected ? (
            <TextField
              fullWidth
              size="small"
              value={form.source}
              InputProps={{ readOnly: true }}
              sx={readOnlyStyle}
            />
          ) : (
            <TextField
              select
              fullWidth
              size="small"
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
          {campaignSelected ? (
            <TextField
              fullWidth
              size="small"
              value={form.subSource}
              InputProps={{ readOnly: true }}
              sx={readOnlyStyle}
            />
          ) : (
            <TextField
              select
              fullWidth
              size="small"
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

      <Typography
        variant="subtitle2"
        fontWeight={700}
        color="#1E293B"
        sx={{ mb: 2 }}
      >
        ASSIGNEE & NEXT ACTION DETAILS
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography sx={labelStyle}>Assigned To</Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={form.assignee}
            onChange={handleChange("assignee")}
            sx={inputStyle}
            disabled={loadingEmployees}
            InputProps={{
              endAdornment: loadingEmployees ? (
                <CircularProgress size={20} sx={{ mr: 1 }} />
              ) : null,
            }}
          >
            {loadingEmployees ? (
              <MenuItem value="" disabled>
                Loading...
              </MenuItem>
            ) : employees.length === 0 ? (
              <MenuItem value="" disabled>
                No employees
              </MenuItem>
            ) : (
              employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id.toString()}>
                  {emp.emp_name} ({emp.emp_type})
                </MenuItem>
              ))
            )}
          </TextField>
        </Box>

        <Box>
          <Typography sx={labelStyle}>Next Action Type</Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={form.nextType}
            onChange={handleNextTypeChange}
            sx={inputStyle}
          >
            <MenuItem value="">-- Select --</MenuItem>
            {TASK_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Box>
          <Typography sx={labelStyle}>
            Next Action Status
            {form.nextType && (
              <Typography
                component="span"
                sx={{
                  fontSize: "0.65rem",
                  color: "#6366F1",
                  ml: 1,
                  fontWeight: 500,
                }}
              >
                auto-set for {form.nextType}
              </Typography>
            )}
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
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
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

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
  return (
    <Box>
      <Typography
        variant="subtitle2"
        fontWeight={700}
        color="#1E293B"
        sx={{ mb: 2 }}
      >
        TREATMENT INFORMATION
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Typography sx={labelStyle}>Treatment Interest *</Typography>
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
          <MenuItem value="Medical Checkup">Medical Checkup</MenuItem>
          <MenuItem value="IVF">IVF</MenuItem>
          <MenuItem value="IUI">IUI</MenuItem>
          <MenuItem value="Consultation">Consultation</MenuItem>
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
        DOCUMENTS & REPORTS
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
  filteredPersonnel: Employee[];
  loadingDepartments: boolean;
  loadingEmployees: boolean;
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
  filteredPersonnel,
  loadingDepartments,
  loadingEmployees,
  handleChange,
  handleDepartmentChange,
}: Step3Props) {
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
            setForm((prev) => ({
              ...prev,
              wantAppointment: e.target.value as "yes" | "no",
            }))
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

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography sx={labelStyle}>Department *</Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={form.department}
            onChange={handleDepartmentChange}
            sx={inputStyle}
            disabled={loadingDepartments}
            InputProps={{
              endAdornment: loadingDepartments ? (
                <CircularProgress size={20} sx={{ mr: 1 }} />
              ) : null,
            }}
          >
            {loadingDepartments ? (
              <MenuItem value="" disabled>
                Loading...
              </MenuItem>
            ) : departments.length === 0 ? (
              <MenuItem value="" disabled>
                No departments available
              </MenuItem>
            ) : (
              departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </MenuItem>
              ))
            )}
          </TextField>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Assigned To</Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={form.assignee}
            onChange={handleChange("assignee")}
            sx={inputStyle}
            disabled={loadingEmployees || !form.department}
          >
            {!form.department ? (
              <MenuItem value="" disabled>
                Select department first
              </MenuItem>
            ) : loadingEmployees ? (
              <MenuItem value="" disabled>
                Loading...
              </MenuItem>
            ) : filteredPersonnel.length === 0 ? (
              <MenuItem value="" disabled>
                No employees in this department
              </MenuItem>
            ) : (
              filteredPersonnel.map((emp) => (
                <MenuItem key={emp.id} value={emp.id.toString()}>
                  {emp.emp_name} ({emp.emp_type})
                </MenuItem>
              ))
            )}
          </TextField>
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
          <Typography sx={labelStyle}>Date *</Typography>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              value={selectedDate}
              onChange={(newDate) => {
                const asDayjs = newDate ? dayjs(newDate as Dayjs | Date) : null;
                setSelectedDate(asDayjs);
                if (asDayjs && asDayjs.isValid()) {
                  setForm((prev) => ({
                    ...prev,
                    appointmentDate: asDayjs.format("YYYY-MM-DD"),
                  }));
                }
              }}
              slotProps={{
                textField: { size: "small", fullWidth: true, sx: inputStyle },
              }}
            />
          </LocalizationProvider>
        </Box>
        <Box>
          <Typography sx={labelStyle}>Select Slot *</Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={form.slot}
            onChange={handleChange("slot")}
            sx={inputStyle}
          >
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
    </Box>
  );
}
