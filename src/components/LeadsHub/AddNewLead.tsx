import * as React from "react";
import {
  Box,
  Card,
  Typography,
  TextField,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid,
  Button,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  OutlinedInput,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "vidai_leads_data";

type FormState = {
  fullName: string;
  contact: string;
  email: string;
  location: string;
  gender: string;
  age: string;
  marital: string;
  address: string;
  language: string;

  partnerName: string;
  partnerAge: string;
  partnerGender: string;

  source: string;
  subSource: string;
  campaign: string;

  assignee: string;
  nextType: string;
  nextStatus: string;
  nextDesc: string;

  treatmentInterest: string;
  treatments: string[];
  documents: File | null;

  wantAppointment: "yes" | "no";
  department: string;
  personnel: string;
  appointmentDate: string;
  slot: string;
  remark: string;
};

const steps = ["Patient Details", "Medical Details", "Book Appointment"];

const OutlinedSelect = ({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: any;
  onChange: any;
  children: React.ReactNode;
}) => (
  <FormControl fullWidth>
    <InputLabel shrink>{label}</InputLabel>
    <Select
      value={value}
      onChange={onChange}
      input={<OutlinedInput notched label={label} />}
    >
      {children}
    </Select>
  </FormControl>
);

const patientRows = [
  [
    { key: "fullName", label: "Full Name" },
    { key: "contact", label: "Contact No." },
    { key: "email", label: "Email" },
    { key: "location", label: "Location / Address" },
  ],
  [
    {
      key: "gender",
      label: "Gender",
      type: "select",
      options: ["Male", "Female"],
    },
    { key: "age", label: "Age" },
    {
      key: "marital",
      label: "Marital Status",
      type: "select",
      options: ["Married", "Single"],
    },
    { key: "address", label: "Address" },
  ],
  [
    {
      key: "language",
      label: "Language",
      type: "select",
      options: ["English", "Hindi"],
    },
  ],
];

export default function AddNewLead() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = React.useState(0);
  const [isCouple, setIsCouple] = React.useState<"yes" | "no">("yes");

  const [form, setForm] = React.useState<FormState>({
    fullName: "John Smith",
    contact: "+91 54211 54121",
    email: "johns@gmail.com",
    location: "California",
    gender: "Male",
    age: "32",
    marital: "Married",
    address: "California",
    language: "English",

    partnerName: "Jennifer Smith",
    partnerAge: "29",
    partnerGender: "Female",

    source: "Social Media",
    subSource: "Facebook",
    campaign: "Facebook IVF Awareness – December",

    assignee: "Henry Cavill",
    nextType: "Follow Up",
    nextStatus: "To Do",
    nextDesc: "",

    treatmentInterest: "",
    treatments: [],
    documents: null,

    wantAppointment: "yes",
    department: "Consultation",
    personnel: "Dr. Alex Carrey",
    appointmentDate: "2024-12-09",
    slot: "12:30 PM - 01:00 PM",
    remark: "",
  });

  const handleChange =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      const stored = localStorage.getItem(STORAGE_KEY);
      const existing = stored ? JSON.parse(stored) : [];

      const newLead = {
        id: `LD-${Date.now()}`,
        name: form.fullName,
        initials: form.fullName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        location: form.location,
        source: form.source,
        status: "New",
        quality: "Warm",
        score: Math.floor(Math.random() * 41) + 60,
        assigned: form.assignee,
        task: form.nextType,
        taskStatus: form.nextStatus,
        activity: "Lead Created",
        archived: false,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify([newLead, ...existing]));

      navigate("/leads");
      return;
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  const renderField = (field: any) => {
    const key = field.key as keyof FormState;

    if (field.type === "select") {
      return (
        <OutlinedSelect
          label={field.label}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        >
          {field.options.map((opt: string) => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </OutlinedSelect>
      );
    }

    return (
      <TextField
        fullWidth
        label={field.label}
        value={form[key]}
        onChange={handleChange(key)}
      />
    );
  };

  return (
    <Card sx={{ p: 3 }}>
      <Typography fontWeight={600} mb={2}>
        Add New Lead
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* ================= STEP 1 ================= */}
      {activeStep === 0 && (
        <>
          <Typography fontSize={13} fontWeight={600} mb={2}>
            LEAD INFORMATION
          </Typography>

          {patientRows.map((row, i) => (
            <Grid container spacing={2} mb={2} key={i}>
              {row.map((field) => (
                <Grid item xs={12 / row.length} key={field.key}>
                  {renderField(field)}
                </Grid>
              ))}
            </Grid>
          ))}

          <Typography fontSize={13} fontWeight={600} mt={3}>
            PARTNER INFORMATION
          </Typography>

          <RadioGroup
            row
            value={isCouple}
            onChange={(e) => setIsCouple(e.target.value as "yes" | "no")}
          >
            <FormControlLabel value="yes" control={<Radio />} label="Yes" />
            <FormControlLabel value="no" control={<Radio />} label="No" />
          </RadioGroup>

          {isCouple === "yes" && (
            <Grid container spacing={2} mt={1}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={form.partnerName}
                  onChange={handleChange("partnerName")}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Age"
                  value={form.partnerAge}
                  onChange={handleChange("partnerAge")}
                />
              </Grid>
              <Grid item xs={4}>
                <OutlinedSelect
                  label="Gender"
                  value={form.partnerGender}
                  onChange={(e) =>
                    setForm({ ...form, partnerGender: e.target.value })
                  }
                >
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                </OutlinedSelect>
              </Grid>
            </Grid>
          )}

          <Typography fontSize={13} fontWeight={600} mt={4} mb={2}>
            SOURCE & CAMPAIGN DETAILS
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={4}>
              <OutlinedSelect
                label="Source"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
              >
                <MenuItem value="Social Media">Social Media</MenuItem>
              </OutlinedSelect>
            </Grid>
            <Grid item xs={4}>
              <OutlinedSelect
                label="Sub-Source"
                value={form.subSource}
                onChange={(e) =>
                  setForm({ ...form, subSource: e.target.value })
                }
              >
                <MenuItem value="Facebook">Facebook</MenuItem>
              </OutlinedSelect>
            </Grid>
            <Grid item xs={4}>
              <TextField
                fullWidth
                disabled
                label="Campaign Name"
                value={form.campaign}
              />
            </Grid>
          </Grid>

          <Typography fontSize={13} fontWeight={600} mt={4} mb={2}>
            ASSIGNEE & NEXT ACTION DETAILS
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={3}>
              <OutlinedSelect
                label="Assigned To"
                value={form.assignee}
                onChange={(e) => setForm({ ...form, assignee: e.target.value })}
              >
                <MenuItem value="Henry Cavill">Henry Cavill</MenuItem>
                <MenuItem value="Emma Watson">Emma Watson</MenuItem>
              </OutlinedSelect>
            </Grid>
            <Grid item xs={3}>
              <OutlinedSelect
                label="Next Action Type"
                value={form.nextType}
                onChange={(e) => setForm({ ...form, nextType: e.target.value })}
              >
                <MenuItem value="Follow Up">Follow Up</MenuItem>
                <MenuItem value="Call">Call</MenuItem>
              </OutlinedSelect>
            </Grid>
            <Grid item xs={3}>
              <OutlinedSelect
                label="Next Action Status"
                value={form.nextStatus}
                onChange={(e) =>
                  setForm({ ...form, nextStatus: e.target.value })
                }
              >
                <MenuItem value="To Do">To Do</MenuItem>
                <MenuItem value="Done">Done</MenuItem>
              </OutlinedSelect>
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Next Action Description"
                value={form.nextDesc}
                onChange={handleChange("nextDesc")}
              />
            </Grid>
          </Grid>
        </>
      )}

      {/* ================= STEP 2 ================= */}
      {activeStep === 1 && (
        <>
          <Typography fontSize={13} fontWeight={600} mb={2}>
            TREATMENT INFORMATION
          </Typography>

          <Grid container spacing={2} mb={2}>
            <Grid item xs={12}>
              <OutlinedSelect
                label="Treatment Interest"
                value={form.treatmentInterest}
                onChange={(e) =>
                  setForm({
                    ...form,
                    treatmentInterest: e.target.value,
                    treatments: form.treatments.includes(e.target.value)
                      ? form.treatments
                      : [...form.treatments, e.target.value],
                  })
                }
              >
                <MenuItem value="Medical Checkup">Medical Checkup</MenuItem>
                <MenuItem value="IVF">IVF</MenuItem>
                <MenuItem value="IUI">IUI</MenuItem>
              </OutlinedSelect>
            </Grid>
          </Grid>

          <Box display="flex" gap={1} flexWrap="wrap" mb={4}>
            {form.treatments.map((item) => (
              <Box
                key={item}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 20,
                  bgcolor: "#fdecec",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  fontSize: 13,
                }}
              >
                {item}
                <Box
                  component="span"
                  sx={{ cursor: "pointer", color: "#ef4444", fontWeight: 600 }}
                  onClick={() =>
                    setForm({
                      ...form,
                      treatments: form.treatments.filter((t) => t !== item),
                    })
                  }
                >
                  ×
                </Box>
              </Box>
            ))}
          </Box>

          <Typography fontSize={13} fontWeight={600} mb={2}>
            DOCUMENTS & REPORTS
          </Typography>

          <Box
            sx={{
              width: 360,
              border: "1px solid #d1d5db",
              borderRadius: 2,
              px: 1.5,
              py: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Button
              variant="contained"
              component="label"
              size="small"
              sx={{
                textTransform: "none",
                bgcolor: "#9ca3af",
                "&:hover": { bgcolor: "#9ca3af" },
              }}
            >
              Choose File
              <input
                hidden
                type="file"
                onChange={(e) =>
                  setForm({
                    ...form,
                    documents: e.target.files ? e.target.files[0] : null,
                  })
                }
              />
            </Button>

            <Typography fontSize={12} color="text.secondary">
              {form.documents ? form.documents.name : "No File Chosen"}
            </Typography>
          </Box>
        </>
      )}

      {/* ================= STEP 3 ================= */}
      {activeStep === 2 && (
        <>
          <Typography fontSize={13} fontWeight={600} mb={2}>
            APPOINTMENT DETAILS
          </Typography>

          <Typography fontSize={12} mb={1}>
            Want to Book an Appointment?
          </Typography>

          <RadioGroup
            row
            value={form.wantAppointment}
            onChange={(e) =>
              setForm({
                ...form,
                wantAppointment: e.target.value as "yes" | "no",
              })
            }
            sx={{ mb: 2 }}
          >
            <FormControlLabel value="yes" control={<Radio />} label="Yes" />
            <FormControlLabel value="no" control={<Radio />} label="No" />
          </RadioGroup>

          {form.wantAppointment === "yes" && (
            <>
              <Grid container spacing={2} mb={2}>
                <Grid item xs={3}>
                  <OutlinedSelect
                    label="Department *"
                    value={form.department}
                    onChange={(e) =>
                      setForm({ ...form, department: e.target.value })
                    }
                  >
                    <MenuItem value="Consultation">Consultation</MenuItem>
                    <MenuItem value="IVF">IVF</MenuItem>
                  </OutlinedSelect>
                </Grid>

                <Grid item xs={3}>
                  <OutlinedSelect
                    label="Personnel *"
                    value={form.personnel}
                    onChange={(e) =>
                      setForm({ ...form, personnel: e.target.value })
                    }
                  >
                    <MenuItem value="Dr. Alex Carrey">Dr. Alex Carrey</MenuItem>
                    <MenuItem value="Dr. Emma Watson">Dr. Emma Watson</MenuItem>
                  </OutlinedSelect>
                </Grid>

                <Grid item xs={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Date *"
                    InputLabelProps={{ shrink: true }}
                    value={form.appointmentDate}
                    onChange={(e) =>
                      setForm({ ...form, appointmentDate: e.target.value })
                    }
                  />
                </Grid>

                <Grid item xs={3}>
                  <OutlinedSelect
                    label="Select Slot *"
                    value={form.slot}
                    onChange={(e) => setForm({ ...form, slot: e.target.value })}
                  >
                    <MenuItem value="12:30 PM - 01:00 PM">
                      12:30 PM - 01:00 PM
                    </MenuItem>
                    <MenuItem value="01:00 PM - 01:30 PM">
                      01:00 PM - 01:30 PM
                    </MenuItem>
                  </OutlinedSelect>
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Remark"
                placeholder="Type Here..."
                value={form.remark}
                onChange={(e) => setForm({ ...form, remark: e.target.value })}
              />
            </>
          )}
        </>
      )}

      <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
        {activeStep > 0 && (
          <Button variant="outlined" onClick={handleBack}>
            Back
          </Button>
        )}
        <Button variant="contained" onClick={handleNext}>
          {activeStep === steps.length - 1 ? "Save" : "Next"}
        </Button>
      </Box>
    </Card>

    
  );
}
