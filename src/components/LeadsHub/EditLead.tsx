// ============================================================
// EditLead.tsx  –  Pure JSX / render layer
// All state & logic lives in useEditLead.ts
// ============================================================
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  MenuItem,
  Stack,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
  Fade,
  Alert,
  CircularProgress,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import { TASK_TYPES } from "./leadTaskConfig";
import {
  useEditLead,
  formatLeadId,
  TIME_SLOTS,
  STEPS,
  TOTAL_STEPS,
  inputStyle,
  readOnlyStyle,
  labelStyle,
  sectionLabelStyle,
} from "./UseEditLead";

export default function EditLead() {
  const {
    navigate,
    currentStep, setCurrentStep,
    showSuccess,
    loading,
    error, setError,
    saving,
    departments,
    employees,
    filteredPersonnel,
    loadingDepartments,
    loadingEmployees,
    employeeError, setEmployeeError,
    leadData,
    fullName, setFullName,
    contactNo, setContactNo,
    email, setEmail,
    location, setLocation,
    gender, setGender,
    age, setAge,
    marital, setMarital,
    address, setAddress,
    language, setLanguage,
    isCouple, setIsCouple,
    partnerName, setPartnerName,
    partnerAge, setPartnerAge,
    partnerGender, setPartnerGender,
    source, setSource,
    subSource, setSubSource,
    campaign, setCampaign,
    assignee, setAssignee,
    nextType,
    nextStatus, setNextStatus,
    nextDesc, setNextDesc,
    availableTaskStatuses,
    handleNextTypeChange,
    treatmentInterest, setTreatmentInterest,
    treatments, setTreatments,
    wantAppointment, setWantAppointment,
    department, setDepartment,
    selectedDate,
    handleDateChange,
    slot, setSlot,
    remark, setRemark,
    handleSave,
  } = useEditLead();

  // ====================== Loading / Error states ======================
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">Loading lead...</Typography>
        </Stack>
      </Box>
    );
  }

  if (error && !leadData) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography fontWeight={600}>Failed to load lead</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
        <Button onClick={() => navigate("/leads")}>Back to Leads</Button>
      </Box>
    );
  }

  if (!leadData) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Lead not found</Typography>
        <Button onClick={() => navigate("/leads")}>Back to Leads</Button>
      </Box>
    );
  }

  const leadLabel = leadData.id ? formatLeadId(leadData.id.toString()) : "";

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {employeeError && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setEmployeeError(null)}>
          Could not load employees: <strong>{employeeError}</strong>
        </Alert>
      )}

      <Paper elevation={0} sx={{ borderRadius: "12px", overflow: "hidden" }}>

        {/* ---- Header ---- */}
        <Box sx={{ bgcolor: "#FFFFFF", px: 4, py: 1.5 }}>
          <Typography fontSize="18px" fontWeight={700} color="#0F172A">
            Edit Lead Details{" "}
            <Typography component="span" fontSize="14px" fontWeight={400} color="#64748B">
              ({leadLabel})
            </Typography>
          </Typography>
        </Box>

        {/* ---- Stepper ---- */}
        <Box sx={{ px: 4, py: 1.5, bgcolor: "#FFFFFF" }}>
          <Box sx={{
            display: "inline-flex", alignItems: "center",
            bgcolor: "#F8FAFC", border: "1px solid #E2E8F0",
            borderRadius: "10px", px: 1, py: 0.75, gap: 0.5,
          }}>
            {STEPS.map((label, index) => {
              const step = index + 1;
              const active = currentStep === step;
              const completed = currentStep > step;
              const stepColor = completed ? "#10B981" : active ? "#F97316" : "transparent";
              const textColor = completed ? "#10B981" : active ? "#F97316" : "#94A3B8";
              const bgColor = active || completed ? "#FFFFFF" : "transparent";
              return (
                <Box key={step} sx={{
                  display: "flex", alignItems: "center", gap: 1,
                  px: 2, py: 0.75, borderRadius: "8px", bgcolor: bgColor,
                  boxShadow: active || completed ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.2s",
                }}>
                  <Box sx={{
                    width: 20, height: 20, borderRadius: "50%", bgcolor: stepColor,
                    border: completed || active ? "none" : "1.5px solid #CBD5E1",
                    color: completed || active ? "#FFF" : "#94A3B8",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", fontWeight: 700, flexShrink: 0,
                  }}>
                    {completed ? "✓" : step}
                  </Box>
                  <Typography fontSize="13px" fontWeight={600} color={textColor} noWrap>
                    {label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* ---- Scrollable Form ---- */}
        <Box sx={{
          bgcolor: "white", px: 4, pt: 3, pb: 2, overflowY: "auto",
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
        }}>

          {/* ===== STEP 1 ===== */}
          {currentStep === 1 && (
            <Box>
              <Typography sx={sectionLabelStyle}>LEAD INFORMATION</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 2 }}>
                <Box>
                  <Typography sx={labelStyle}>Full Name *</Typography>
                  <TextField fullWidth size="small" value={fullName} onChange={(e) => setFullName(e.target.value)} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Contact No. *</Typography>
                  <TextField fullWidth size="small" value={contactNo} onChange={(e) => setContactNo(e.target.value)} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Email *</Typography>
                  <TextField fullWidth size="small" value={email} onChange={(e) => setEmail(e.target.value)} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Location / Address</Typography>
                  <TextField fullWidth size="small" value={location} onChange={(e) => setLocation(e.target.value)} sx={inputStyle} />
                </Box>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 2 }}>
                <Box>
                  <Typography sx={labelStyle}>Gender *</Typography>
                  <TextField select fullWidth size="small" value={gender} onChange={(e) => setGender(e.target.value)} sx={inputStyle}>
                    <MenuItem value="">-- Select --</MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Age *</Typography>
                  <TextField fullWidth size="small" type="number" value={age} onChange={(e) => setAge(e.target.value)} sx={inputStyle} />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Marital Status</Typography>
                  <TextField select fullWidth size="small" value={marital} onChange={(e) => setMarital(e.target.value)} sx={inputStyle}>
                    <MenuItem value="">-- Select --</MenuItem>
                    <MenuItem value="Married">Married</MenuItem>
                    <MenuItem value="Single">Single</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Address</Typography>
                  <TextField fullWidth size="small" value={address} onChange={(e) => setAddress(e.target.value)} sx={inputStyle} />
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography sx={labelStyle}>Language Preference</Typography>
                <TextField select size="small" value={language} onChange={(e) => setLanguage(e.target.value)} sx={{ ...inputStyle, maxWidth: "25%" }}>
                  <MenuItem value="">-- Select --</MenuItem>
                  <MenuItem value="English">English</MenuItem>
                  <MenuItem value="Hindi">Hindi</MenuItem>
                  <MenuItem value="Kannada">Kannada</MenuItem>
                </TextField>
              </Box>

              <Typography sx={sectionLabelStyle}>PARTNER INFORMATION</Typography>
              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ ...labelStyle, mb: 0.5 }}>Is This Inquiry For A Couple?</Typography>
                <RadioGroup row value={isCouple} onChange={(e) => setIsCouple(e.target.value as "yes" | "no")}>
                  <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
                </RadioGroup>
              </Box>
              {isCouple === "yes" && (
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 3 }}>
                  <Box>
                    <Typography sx={labelStyle}>Full Name</Typography>
                    <TextField fullWidth size="small" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} sx={inputStyle} />
                  </Box>
                  <Box>
                    <Typography sx={labelStyle}>Age</Typography>
                    <TextField fullWidth size="small" type="number" value={partnerAge} onChange={(e) => setPartnerAge(e.target.value)} sx={inputStyle} />
                  </Box>
                  <Box>
                    <Typography sx={labelStyle}>Gender</Typography>
                    <TextField select fullWidth size="small" value={partnerGender} onChange={(e) => setPartnerGender(e.target.value)} sx={inputStyle}>
                      <MenuItem value="">-- Select --</MenuItem>
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                    </TextField>
                  </Box>
                </Box>
              )}

              <Typography sx={sectionLabelStyle}>SOURCE & CAMPAIGN DETAILS</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 3 }}>
                <Box>
                  <Typography sx={labelStyle}>Source *</Typography>
                  <TextField select fullWidth size="small" value={source} onChange={(e) => setSource(e.target.value)} sx={inputStyle}>
                    <MenuItem value="">-- Select --</MenuItem>
                    <MenuItem value="Social Media">Social Media</MenuItem>
                    <MenuItem value="Website">Website</MenuItem>
                    <MenuItem value="Referral">Referral</MenuItem>
                    <MenuItem value="Direct">Direct</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Sub-Source</Typography>
                  <TextField select fullWidth size="small" value={subSource} onChange={(e) => setSubSource(e.target.value)} sx={inputStyle}>
                    <MenuItem value="">-- Select --</MenuItem>
                    <MenuItem value="Facebook">Facebook</MenuItem>
                    <MenuItem value="Instagram">Instagram</MenuItem>
                    <MenuItem value="Google">Google</MenuItem>
                    <MenuItem value="LinkedIn">LinkedIn</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Campaign Name</Typography>
                  <TextField fullWidth size="small" value={campaign} onChange={(e) => setCampaign(e.target.value)} sx={inputStyle} />
                </Box>
              </Box>

              <Typography sx={sectionLabelStyle}>ASSIGNEE & NEXT ACTION DETAILS</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 2 }}>
                <Box>
                  <Typography sx={labelStyle}>Assigned To</Typography>
                  <TextField
                    select fullWidth size="small" value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    sx={inputStyle} disabled={loadingEmployees}
                    InputProps={{ endAdornment: loadingEmployees ? <CircularProgress size={14} sx={{ mr: 1 }} /> : null }}
                  >
                    <MenuItem value=""><em>-- Select Employee --</em></MenuItem>
                    {employees.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id.toString()}>
                        {emp.emp_name} ({emp.emp_type}){emp.department_name ? ` - ${emp.department_name}` : ""}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Box>
                  <Typography sx={labelStyle}>Next Action Type</Typography>
                  <TextField select fullWidth size="small" value={nextType} onChange={handleNextTypeChange} sx={inputStyle}>
                    <MenuItem value="">-- Select --</MenuItem>
                    {TASK_TYPES.map((t) => (
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Box>
                  <Typography sx={labelStyle}>
                    Next Action Status
                    {nextType && (
                      <Typography component="span" sx={{ fontSize: "0.65rem", color: "#6366F1", ml: 1, fontWeight: 500 }}>
                        auto-set for {nextType}
                      </Typography>
                    )}
                  </Typography>
                  <TextField
                    select fullWidth size="small"
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    sx={nextType ? readOnlyStyle : inputStyle}
                    InputProps={{ readOnly: Boolean(nextType) }}
                  >
                    {availableTaskStatuses.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Box>
                  <Typography sx={labelStyle}>Next Action Description</Typography>
                  <TextField fullWidth size="small" value={nextDesc} onChange={(e) => setNextDesc(e.target.value)} sx={inputStyle} />
                </Box>
              </Box>
            </Box>
          )}

          {/* ===== STEP 2 ===== */}
          {currentStep === 2 && (
            <Box>
              <Typography sx={sectionLabelStyle}>TREATMENT INFORMATION</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography sx={labelStyle}>Treatment Interest *</Typography>
                <TextField
                  select size="small" value={treatmentInterest}
                  onChange={(e) => {
                    const v = e.target.value;
                    setTreatmentInterest(v);
                    if (v && !treatments.includes(v)) setTreatments((prev) => [...prev, v]);
                  }}
                  sx={{ ...inputStyle, maxWidth: "50%" }}
                >
                  <MenuItem value="" disabled>Select</MenuItem>
                  <MenuItem value="Medical Checkup">Medical Checkup</MenuItem>
                  <MenuItem value="IVF">IVF</MenuItem>
                  <MenuItem value="IUI">IUI</MenuItem>
                  <MenuItem value="Consultation">Consultation</MenuItem>
                </TextField>
              </Box>
              {treatments.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: "wrap" }}>
                  {treatments.map((t) => (
                    <Chip
                      key={t} label={t} size="small"
                      onDelete={() => setTreatments((prev) => prev.filter((x) => x !== t))}
                      sx={{
                        bgcolor: "#FEE2E2", color: "#B91C1C", fontWeight: 600,
                        border: "1px solid #FCA5A5",
                        "& .MuiChip-deleteIcon": { color: "#B91C1C", "&:hover": { color: "#991B1B" } },
                      }}
                    />
                  ))}
                </Stack>
              )}
              <Typography sx={sectionLabelStyle}>DOCUMENTS & REPORTS</Typography>
              <Box sx={{ border: "2px dashed #E2E8F0", borderRadius: "10px", p: 3, display: "inline-block", bgcolor: "#F8FAFC", minWidth: "400px" }}>
                <Button
                  variant="contained" component="label"
                  sx={{ bgcolor: "#64748B", textTransform: "none", borderRadius: "8px", fontWeight: 600, "&:hover": { bgcolor: "#475569" } }}
                >
                  Choose File
                  <input type="file" hidden />
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  No File Chosen
                </Typography>
              </Box>
            </Box>
          )}

          {/* ===== STEP 3 ===== */}
          {currentStep === 3 && (
            <Box>
              <Typography sx={sectionLabelStyle}>APPOINTMENT DETAILS</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ ...labelStyle, mb: 0.5 }}>Want to Book an Appointment?</Typography>
                <RadioGroup row value={wantAppointment} onChange={(e) => setWantAppointment(e.target.value as "yes" | "no")}>
                  <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
                </RadioGroup>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, mb: 2 }}>
                <Box>
                  <Typography sx={labelStyle}>Department *</Typography>
                  <TextField
                    select fullWidth size="small" value={department}
                    onChange={(e) => { setDepartment(e.target.value); }}
                    sx={inputStyle} disabled={loadingDepartments}
                    InputProps={{ endAdornment: loadingDepartments ? <CircularProgress size={14} sx={{ mr: 1 }} /> : null }}
                  >
                    <MenuItem value=""><em>-- Select Department --</em></MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id.toString()}>{dept.name}</MenuItem>
                    ))}
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Assigned To</Typography>
                  <TextField
                    select fullWidth size="small" value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    sx={inputStyle} disabled={loadingEmployees || !department}
                  >
                    {!department ? (
                      <MenuItem value="" disabled>Select department first</MenuItem>
                    ) : filteredPersonnel.length === 0 ? (
                      <MenuItem value="" disabled>No employees in this department</MenuItem>
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

              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, mb: 2 }}>
                <Box>
                  <Typography sx={labelStyle}>Date *</Typography>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      value={selectedDate}
                      onChange={(val) => handleDateChange(val as Parameters<typeof handleDateChange>[0], {} as Parameters<typeof handleDateChange>[1])}
                      slotProps={{ textField: { size: "small", fullWidth: true, sx: inputStyle } }}
                    />
                  </LocalizationProvider>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>Select Slot *</Typography>
                  <TextField select fullWidth size="small" value={slot} onChange={(e) => setSlot(e.target.value)} sx={inputStyle}>
                    <MenuItem value=""><em>Select Time Slot</em></MenuItem>
                    {TIME_SLOTS.map((ts) => (
                      <MenuItem key={ts} value={ts}>{ts}</MenuItem>
                    ))}
                  </TextField>
                </Box>
              </Box>

              <Box>
                <Typography sx={labelStyle}>Remark</Typography>
                <TextField
                  fullWidth size="small" multiline rows={2} placeholder="Type Here..."
                  value={remark} onChange={(e) => setRemark(e.target.value)} sx={inputStyle}
                />
              </Box>
            </Box>
          )}
        </Box>

        {/* ---- Footer ---- */}
        <Box sx={{ bgcolor: "white", px: 4, py: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="caption" color="text.secondary">Step {currentStep} of {TOTAL_STEPS}</Typography>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              onClick={() => navigate("/leads")} disabled={saving}
              sx={{ textTransform: "none", color: "#64748B", fontWeight: 600, px: 3, borderRadius: "8px", border: "1px solid #E2E8F0", "&:hover": { bgcolor: "#F8FAFC" } }}
            >
              Cancel
            </Button>
            {currentStep > 1 && (
              <Button
                onClick={() => setCurrentStep((s) => s - 1)} disabled={saving} variant="outlined"
                sx={{ textTransform: "none", borderColor: "#E2E8F0", color: "#1E293B", fontWeight: 600, px: 3, borderRadius: "8px", "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" } }}
              >
                Back
              </Button>
            )}
            {currentStep < TOTAL_STEPS ? (
              <Button
                onClick={() => setCurrentStep((s) => s + 1)} disabled={saving} variant="contained"
                sx={{ bgcolor: "#1E293B", textTransform: "none", fontWeight: 600, px: 4, borderRadius: "8px", "&:hover": { bgcolor: "#0F172A" } }}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSave} disabled={saving} variant="contained"
                sx={{ bgcolor: "#1E293B", textTransform: "none", fontWeight: 600, px: 4, minWidth: 100, borderRadius: "8px", boxShadow: "none", "&:hover": { bgcolor: "#0F172A", boxShadow: "none" } }}
              >
                {saving ? <CircularProgress size={18} sx={{ color: "white" }} /> : "Save"}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Success Toast */}
      <Fade in={showSuccess}>
        <Box sx={{
          position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
          bgcolor: "#10B981", color: "white", px: 4, py: 2, borderRadius: "12px",
          display: "flex", alignItems: "center", gap: 1.5, zIndex: 10000,
          boxShadow: "0px 10px 20px rgba(16,185,129,0.3)",
        }}>
          <CheckCircleIcon sx={{ fontSize: 24 }} />
          <Typography variant="body1" fontWeight={700}>Saved Successfully!</Typography>
        </Box>
      </Fade>
    </Box>
  );
}