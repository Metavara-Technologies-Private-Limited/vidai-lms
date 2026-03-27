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
  Alert,
  CircularProgress,
  IconButton,
  Autocomplete,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import CloseIcon from "@mui/icons-material/Close";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import { TASK_TYPES } from "./LeadTaskConfig";
import {
  useEditLead,
  formatLeadId,
  formatBytes,
  getFileTypeLabel,
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
    loading,
    error, setError,
    saving,
    campaigns,
    departments,
    employees,
    filteredPersonnel,
    loadingDepartments,
    loadingEmployees,
    employeeError, setEmployeeError,
    leadData,
    // ── Shared fields ──
    fullName, setFullName,
    contactNo, setContactNo,
    email, setEmail,
    location, setLocation,
    address, setAddress,
    source,
    subSource,
    campaign, handleCampaignChange,
    assignee, setAssignee,
    assigneeName, setAssigneeName,
    setAssigneeSearch,
    assigneeOptions,
    assigneeLoading,
    nextType,
    nextStatus, setNextStatus,
    nextDesc, setNextDesc,
    availableTaskStatuses,
    handleNextTypeChange,
    // ── Medical-only fields ──
    gender, setGender,
    age, setAge,
    marital, setMarital,
    language, setLanguage,
    isCouple, setIsCouple,
    partnerName, setPartnerName,
    partnerAge, setPartnerAge,
    partnerGender, setPartnerGender,
    // ── Contracts-only fields ──
    contactPersonName, setContactPersonName,
    designation, setDesignation,
    contactPersonPhone, setContactPersonPhone,
    contactPersonEmail, setContactPersonEmail,
    leadGeneratedBy, setLeadGeneratedBy,
    setLeadGeneratedById,
    setLeadGeneratedBySearch,
    leadGeneratedByOptions,
    leadGeneratedByLoading,
    // ── Step 2 ──
    treatmentInterest, setTreatmentInterest,
    treatments, setTreatments,
    documents,
    handleFileChange,
    handleRemoveDocument,
    existingDocuments,
    docsLoading,
    handleRemoveExistingDocument,
    // ── Step 3 ──
    wantAppointment,
    department, setDepartment,
    appointmentPersonnel, setAppointmentPersonnel,
    selectedDate,
    handleDateChange,
    slot, setSlot,
    remark, setRemark,
    handleSave,
    handleWantAppointmentChange,
    // ── App-type flags ──
    IS_MEDICAL_APP,
    IS_CONTRACTS_APP,
    ACTIVE_FLOW_COPY,
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
  const assigneeOptionLabel = (option: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    role?: string;
    designation?: string;
  }): string => {
    const fullName = `${option.first_name ?? ""} ${option.last_name ?? ""}`.trim();
    const primary = fullName || option.username || `User ${option.id}`;
    const secondary = option.role || option.designation;
    return secondary ? `${primary} (${secondary})` : primary;
  };

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

      <Paper
        elevation={0}
        sx={{
          borderRadius: "12px",
          overflow: "hidden",
          height: "88vh",
          display: "flex",
          flexDirection: "column",
        }}
      >

        {/* ---- Header ---- */}
        <Box sx={{ bgcolor: "#FFFFFF", px: 1, py: 1 }}>
          <Typography fontSize="18px" fontWeight={700} color="#0F172A">
            Edit Lead Details{" "}
            <Typography component="span" fontSize="14px" fontWeight={400} color="#64748B">
              ({leadLabel})
            </Typography>
          </Typography>
        </Box>

        {/* ---- Stepper ---- */}
        <Box sx={{ px: 1, py: 1.5, bgcolor: "#FFFFFF" }}>
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
          bgcolor: "white", px: 1, pt: 2, pb: 2, overflowY: "auto",
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: "4px" },
        }}>

          {/* ===== STEP 1 ===== */}
          {currentStep === 1 && (
            <Box>
              {/* ── Section label: "LEAD INFORMATION" for both, but step label differs ── */}
              <Typography sx={sectionLabelStyle}>LEAD INFORMATION</Typography>

              {/* ── Row 1: Full Name, Contact No, Email + conditionals ── */}
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

              {/* ── Row 2: MEDICAL — Gender, Age, Marital Status, Address ── */}
              {IS_MEDICAL_APP && (
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
              )}

              {/* ── MEDICAL — Language Preference ── */}
              {IS_MEDICAL_APP && (
                <Box sx={{ mb: 3 }}>
                  <Typography sx={labelStyle}>Language Preference</Typography>
                  <TextField select size="small" value={language} onChange={(e) => setLanguage(e.target.value)} sx={{ ...inputStyle, maxWidth: "25%" }}>
                    <MenuItem value="">-- Select --</MenuItem>
                    <MenuItem value="English">English</MenuItem>
                    <MenuItem value="Hindi">Hindi</MenuItem>
                    <MenuItem value="Kannada">Kannada</MenuItem>
                  </TextField>
                </Box>
              )}

              {/* ── CONTRACTS — Address (single row below email row) ── */}
              {IS_CONTRACTS_APP && (
                <Box sx={{ mb: 2 }}>
                  <Typography sx={labelStyle}>Address</Typography>
                  <TextField fullWidth size="small" value={address} onChange={(e) => setAddress(e.target.value)} sx={inputStyle} />
                </Box>
              )}

              {/* ── MEDICAL — Partner Information ── */}
              {IS_MEDICAL_APP && (
                <>
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
                </>
              )}

              {/* ── CONTRACTS — Contact Information section ── */}
              {IS_CONTRACTS_APP && (
                <>
                  <Typography sx={sectionLabelStyle}>
                    {ACTIVE_FLOW_COPY.contactSectionLabel}
                  </Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 3 }}>
                    <Box>
                      <Typography sx={labelStyle}>Full Name</Typography>
                      <TextField
                        fullWidth size="small" value={contactPersonName}
                        onChange={(e) => setContactPersonName(e.target.value)} sx={inputStyle}
                      />
                    </Box>
                    <Box>
                      <Typography sx={labelStyle}>Designation</Typography>
                      <TextField
                        select fullWidth size="small" value={designation}
                        onChange={(e) => setDesignation(e.target.value)} sx={inputStyle}
                      >
                        <MenuItem value="">-- Select --</MenuItem>
                        <MenuItem value="Manager">Manager</MenuItem>
                        <MenuItem value="Director">Director</MenuItem>
                        <MenuItem value="Executive">Executive</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </TextField>
                    </Box>
                    <Box>
                      <Typography sx={labelStyle}>Contact No.</Typography>
                      <TextField
                        fullWidth size="small" value={contactPersonPhone}
                        onChange={(e) => setContactPersonPhone(e.target.value)} sx={inputStyle}
                      />
                    </Box>
                    <Box>
                      <Typography sx={labelStyle}>Email</Typography>
                      <TextField
                        fullWidth size="small" value={contactPersonEmail}
                        onChange={(e) => setContactPersonEmail(e.target.value)} sx={inputStyle}
                      />
                    </Box>
                  </Box>
                </>
              )}

              {/* ---- Source & Campaign ---- */}
              <Typography sx={sectionLabelStyle}>SOURCE & CAMPAIGN DETAILS</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, mb: 3 }}>
                <Box>
                  <Typography sx={labelStyle}>Campaign Name</Typography>
                  <TextField
                    select fullWidth size="small"
                    value={campaign}
                    onChange={handleCampaignChange}
                    sx={inputStyle}
                  >
                    <MenuItem value="">-- Select Campaign --</MenuItem>
                    {campaigns.map((c) => (
                      <MenuItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
                <Box>
                  <Typography sx={labelStyle}>
                    Source
                    {campaign && (
                      <Typography component="span" sx={{ fontSize: "0.65rem", color: "#6366F1", ml: 1, fontWeight: 500 }}>
                        auto-filled
                      </Typography>
                    )}
                  </Typography>
                  <TextField
                    fullWidth size="small"
                    value={source}
                    sx={campaign ? readOnlyStyle : inputStyle}
                    InputProps={{ readOnly: Boolean(campaign) }}
                    placeholder="Auto-filled from campaign"
                  />
                </Box>
                <Box>
                  <Typography sx={labelStyle}>
                    Sub-Source
                    {campaign && (
                      <Typography component="span" sx={{ fontSize: "0.65rem", color: "#6366F1", ml: 1, fontWeight: 500 }}>
                        auto-filled
                      </Typography>
                    )}
                  </Typography>
                  <TextField
                    fullWidth size="small"
                    value={subSource}
                    sx={campaign ? readOnlyStyle : inputStyle}
                    InputProps={{ readOnly: Boolean(campaign) }}
                    placeholder="Auto-filled from campaign"
                  />
                </Box>
              </Box>

              {/* ---- Assignee & Next Action ---- */}
              <Typography sx={sectionLabelStyle}>ASSIGNEE & NEXT ACTION DETAILS</Typography>
              <Box sx={{
                display: "grid",
                // CONTRACTS app shows "Lead Generated By" so needs 5 cols; medical stays at 4
                gridTemplateColumns: IS_CONTRACTS_APP
                  ? "repeat(5, 1fr)"
                  : "repeat(4, 1fr)",
                gap: 2,
                mb: 2,
              }}>
                <Box>
                  <Typography sx={labelStyle}>Assigned To</Typography>
                  <Autocomplete
                    options={assigneeOptions}
                    loading={assigneeLoading}
                    clearOnBlur={false}
                    value={assigneeOptions.find((option) => String(option.id) === assignee) || null}
                    inputValue={assigneeName}
                    onInputChange={(_, value, reason) => {
                      if (reason !== "reset") {
                        setAssigneeSearch(value);
                        setAssigneeName(value);
                      }
                    }}
                    onChange={(_, value) => {
                      setAssignee(value ? String(value.id) : "");
                      setAssigneeName(value ? assigneeOptionLabel(value) : "");
                    }}
                    getOptionLabel={assigneeOptionLabel}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    noOptionsText="Type to search assignee"
                    renderOption={(props, option) => (
                      <li {...props} key={option.id}>{assigneeOptionLabel(option)}</li>
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
                              {assigneeLoading ? <CircularProgress size={14} sx={{ mr: 1 }} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
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

                {/* ── CONTRACTS-only: Lead Generated By ── */}
                {IS_CONTRACTS_APP && (
                  <Box>
                    <Typography sx={labelStyle}>Lead Generated By</Typography>
                    <Autocomplete
                      options={leadGeneratedByOptions}
                      loading={leadGeneratedByLoading}
                      clearOnBlur={false}
                      value={
                        leadGeneratedByOptions.find(
                          (option) => assigneeOptionLabel(option) === leadGeneratedBy,
                        ) || null
                      }
                      inputValue={leadGeneratedBy}
                      onInputChange={(_, value, reason) => {
                        if (reason !== "reset") {
                          setLeadGeneratedBySearch(value);
                          setLeadGeneratedBy(value);
                          setLeadGeneratedById("");
                        }
                      }}
                      onChange={(_, value) => {
                        setLeadGeneratedBy(value ? assigneeOptionLabel(value) : "");
                        setLeadGeneratedById(value ? String(value.id) : "");
                      }}
                      getOptionLabel={assigneeOptionLabel}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      noOptionsText="Type to search user"
                      renderOption={(props, option) => (
                        <li {...props} key={option.id}>{assigneeOptionLabel(option)}</li>
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
                                {leadGeneratedByLoading ? <CircularProgress size={14} sx={{ mr: 1 }} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* ===== STEP 2 ===== */}
          {currentStep === 2 && (
            <Box>
              {/* Section label is dynamic: "TREATMENT INFORMATION" vs "PRODUCT INFORMATION" */}
              <Typography sx={sectionLabelStyle}>
                {ACTIVE_FLOW_COPY.medicalSection.toUpperCase()}
              </Typography>
              <Box sx={{ mb: 2 }}>
                {/* Treatment/Product label is dynamic */}
                <Typography sx={labelStyle}>{ACTIVE_FLOW_COPY.treatmentLabel} *</Typography>
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
                  {/* Options come from config — dynamic per app type */}
                  {ACTIVE_FLOW_COPY.treatmentOptions.map((opt) => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
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

              {docsLoading && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                  <CircularProgress size={14} />
                  <Typography fontSize="0.78rem" color="text.secondary">Loading saved documents…</Typography>
                </Box>
              )}

              {!docsLoading && existingDocuments.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ ...sectionLabelStyle, mb: 1 }}>PREVIOUSLY UPLOADED</Typography>
                  <Stack spacing={1} sx={{ maxWidth: 470 }}>
                    {existingDocuments.map((doc, idx) => {
                      const isPdf = doc.name.toLowerCase().endsWith(".pdf");
                      const ext = doc.name.split(".").pop()?.toUpperCase() ?? "FILE";
                      return (
                        <Box
                          key={`existing-${idx}`}
                          sx={{
                            display: "flex", alignItems: "center", gap: 1.5,
                            px: 2, py: 1.25,
                            border: "1px solid #E2E8F0",
                            borderRadius: "10px",
                            bgcolor: "#F8FAFC",
                          }}
                        >
                          {isPdf ? (
                            <PictureAsPdfIcon sx={{ fontSize: 28, color: "#EF4444", flexShrink: 0 }} />
                          ) : (
                            <InsertDriveFileIcon sx={{ fontSize: 28, color: "#6366F1", flexShrink: 0 }} />
                          )}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography fontSize="0.82rem" fontWeight={600} color="#1E293B" noWrap title={doc.name}>
                              {doc.name}
                            </Typography>
                            <Typography fontSize="0.72rem" color="#94A3B8">
                              {ext} · Saved
                            </Typography>
                          </Box>
                          {doc.url && (
                            <IconButton
                              size="small" component="a" href={doc.url}
                              target="_blank" rel="noopener noreferrer"
                              sx={{ color: "#6366F1", flexShrink: 0, "&:hover": { bgcolor: "#EEF2FF" } }}
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton
                            size="small" onClick={() => handleRemoveExistingDocument(idx)}
                            sx={{ color: "#94A3B8", flexShrink: 0, "&:hover": { color: "#EF4444", bgcolor: "#FEF2F2" } }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              )}

              <Box sx={{
                border: "2px dashed #E2E8F0", borderRadius: "10px", p: 3, bgcolor: "#F8FAFC",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, width: 370,
              }}>
                <Box sx={{ color: "#94A3B8", fontSize: 36, lineHeight: 1 }}>
                  <InsertDriveFileIcon sx={{ fontSize: 36 }} />
                </Box>
                <Button
                  variant="contained" component="label"
                  sx={{ bgcolor: "#64748B", textTransform: "none", borderRadius: "8px", fontWeight: 600, px: 3, "&:hover": { bgcolor: "#475569" } }}
                >
                  Choose File
                  <input type="file" hidden multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif" onChange={handleFileChange} />
                </Button>
                <Typography variant="caption" color="text.secondary">
                  {documents.length === 0
                    ? "No File Chosen"
                    : `${documents.length} new file${documents.length > 1 ? "s" : ""} selected`}
                </Typography>
              </Box>

              {documents.length > 0 && (
                <Stack spacing={1} sx={{ mt: 2, width: 470 }}>
                  <Typography sx={{ ...sectionLabelStyle, mb: 0.5 }}>NEW FILES TO UPLOAD</Typography>
                  {documents.map((file, idx) => {
                    const isPdf = file.type === "application/pdf";
                    const typeLabel = getFileTypeLabel(file);
                    return (
                      <Box
                        key={`${file.name}-${idx}`}
                        sx={{
                          display: "flex", alignItems: "center", gap: 1.5,
                          px: 2, py: 1.25, border: "1px solid #E2E8F0",
                          borderRadius: "10px", bgcolor: "#FFFFFF",
                        }}
                      >
                        {isPdf ? (
                          <PictureAsPdfIcon sx={{ fontSize: 28, color: "#EF4444", flexShrink: 0 }} />
                        ) : (
                          <InsertDriveFileIcon sx={{ fontSize: 28, color: "#6366F1", flexShrink: 0 }} />
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography fontSize="0.82rem" fontWeight={600} color="#1E293B" noWrap title={file.name}>
                            {file.name}
                          </Typography>
                          <Typography fontSize="0.72rem" color="#94A3B8">
                            {typeLabel} · {formatBytes(file.size)}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small" onClick={() => handleRemoveDocument(idx)}
                          sx={{ color: "#94A3B8", flexShrink: 0, "&:hover": { color: "#EF4444", bgcolor: "#FEF2F2" } }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Box>
          )}

          {/* ===== STEP 3 ===== */}
          {currentStep === 3 && (
            <Box>
              <Typography sx={sectionLabelStyle}>APPOINTMENT DETAILS</Typography>

              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ ...labelStyle, mb: 0.5 }}>Want to Book an Appointment?</Typography>
                <RadioGroup
                  row
                  value={wantAppointment}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "yes" || val === "no") {
                      handleWantAppointmentChange(val);
                    }
                  }}
                >
                  <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
                </RadioGroup>
              </Box>

              {wantAppointment === "yes" && (
                <Box>
                  <Box sx={{
                    display: "grid",
                    // MEDICAL shows Department + Personnel; CONTRACTS shows only Personnel
                    gridTemplateColumns: IS_MEDICAL_APP ? "repeat(2, 1fr)" : "repeat(1, 1fr)",
                    gap: 2,
                    mb: 2,
                    maxWidth: IS_CONTRACTS_APP ? "50%" : "100%",
                  }}>
                    {/* ── MEDICAL-only: Department field ── */}
                    {IS_MEDICAL_APP && (
                      <Box>
                        <Typography sx={labelStyle}>Department *</Typography>
                        <TextField
                          select fullWidth size="small" value={department}
                          onChange={(e) => {
                            setDepartment(e.target.value);
                            setAppointmentPersonnel("");
                          }}
                          sx={inputStyle}
                          disabled={loadingDepartments}
                          InputProps={{
                            endAdornment: loadingDepartments ? <CircularProgress size={14} sx={{ mr: 1 }} /> : null,
                          }}
                        >
                          <MenuItem value=""><em>-- Select Department --</em></MenuItem>
                          {departments.map((dept) => (
                            <MenuItem key={dept.id} value={dept.id.toString()}>{dept.name}</MenuItem>
                          ))}
                        </TextField>
                      </Box>
                    )}
                    <Box>
                      <Typography sx={labelStyle}>Personnel</Typography>
                      <TextField
                        select fullWidth size="small"
                        value={appointmentPersonnel}
                        onChange={(e) => setAppointmentPersonnel(e.target.value)}
                        sx={inputStyle}
                        // MEDICAL: disabled until department chosen; CONTRACTS: always enabled
                        disabled={loadingEmployees || (IS_MEDICAL_APP && !department)}
                      >
                        {IS_MEDICAL_APP && !department ? (
                          <MenuItem value="" disabled>Select department first</MenuItem>
                        ) : filteredPersonnel.length === 0 && IS_MEDICAL_APP ? (
                          <MenuItem value="" disabled>No employees in this department</MenuItem>
                        ) : (
                          [
                            <MenuItem key="" value=""><em>-- Select Personnel --</em></MenuItem>,
                            ...(IS_MEDICAL_APP ? filteredPersonnel : employees).map((emp) => (
                              <MenuItem key={emp.id} value={emp.id.toString()}>
                                {emp.emp_name} ({emp.emp_type})
                              </MenuItem>
                            )),
                          ]
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
                          onChange={(val) => handleDateChange(val)}
                          slotProps={{ textField: { size: "small", fullWidth: true, sx: inputStyle } }}
                        />
                      </LocalizationProvider>
                    </Box>
                    <Box>
                      <Typography sx={labelStyle}>Select Slot *</Typography>
                      <TextField
                        select fullWidth size="small" value={slot}
                        onChange={(e) => setSlot(e.target.value)}
                        sx={inputStyle}
                      >
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
                      fullWidth size="small" multiline rows={2}
                      placeholder="Type Here..."
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      sx={inputStyle}
                    />
                  </Box>
                </Box>
              )}
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
                sx={{
                  bgcolor: "#1E293B", textTransform: "none", fontWeight: 600,
                  px: 4, minWidth: 100, borderRadius: "8px", boxShadow: "none",
                  "&:hover": { bgcolor: "#0F172A", boxShadow: "none" },
                }}
              >
                {saving ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Save"}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}