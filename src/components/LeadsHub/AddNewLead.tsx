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
  StepConnector,
  stepConnectorClasses,
  styled
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "vidai_leads_data";

// --- CUSTOM STYLED COMPONENTS ---

const QontoConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: 'calc(-50% + 16px)',
    right: 'calc(50% + 16px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: { borderColor: '#eaeaf0' },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: { borderColor: '#eaeaf0' },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: '#eaeaf0',
    borderTopWidth: 2,
    borderRadius: 1,
  },
}));

const CustomStepIcon = styled('div')<{ active?: boolean; completed?: boolean }>(
  ({ theme, active, completed }) => ({
    width: 24,
    height: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: completed ? '#4caf50' : active ? '#ff5a5f' : '#ccc',
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    zIndex: 1,
  })
);

// --- TYPES ---

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

const OutlinedSelect = ({ label, value, onChange, children, sx, disabled = false }: any) => (
  <FormControl fullWidth size="small" sx={sx} disabled={disabled}>
    <InputLabel shrink sx={{ backgroundColor: 'white', px: 0.5, fontWeight: 600, fontSize: '12px' }}>{label}</InputLabel>
    <Select
      value={value}
      onChange={onChange}
      input={<OutlinedInput notched label={label} sx={{ fontSize: '13px' }} />}
    >
      {children}
    </Select>
  </FormControl>
);

export default function AddNewLead() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = React.useState(0);
  const [isCouple, setIsCouple] = React.useState<"yes" | "no">("yes");

  const [form, setForm] = React.useState<FormState>({
    fullName: "John Smith",
    contact: "+91 54211 54121",
    email: "johns@gmail.com",
    location: "201, HM Streets, LA Jolla, California",
    gender: "Male",
    age: "32",
    marital: "Married",
    address: "201, HM Streets, LA Jolla, California",
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
    treatments: ["Medical Checkup", "IVF"],
    documents: null,
    wantAppointment: "yes",
    department: "Consultation",
    personnel: "Dr. Alex Carrey",
    appointmentDate: "2024-12-09",
    slot: "12:30 PM - 01:00 PM",
    remark: "",
  });

  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      const stored = localStorage.getItem(STORAGE_KEY);
      const existing = stored ? JSON.parse(stored) : [];
      const newLead = {
        id: `LD-${Date.now()}`,
        name: form.fullName,
        initials: form.fullName.split(" ").map((n) => n[0]).join("").toUpperCase(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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

  return (
    <Box sx={{ p: 3, bgcolor: '#f4f7f6', minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      <Card sx={{ 
        p: 4, 
        boxShadow: 'none', 
        border: '1px solid #e0e0e0', 
        borderRadius: 3, 
        width: '100%',
        maxWidth: '1240px', 
        bgcolor: '#fff',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* HEADER */}
        <Typography fontWeight={700} fontSize={20} mb={3} color="#111827">Add New Lead</Typography>

        {/* STEPPER */}
        <Box sx={{ width: '100%', maxWidth: '650px', mb: 5 }}>
          <Stepper 
            activeStep={activeStep} 
            connector={<QontoConnector />}
            sx={{ 
                '& .MuiStepLabel-label': { mt: 0.5, fontSize: '13px' },
                '& .MuiStep-root': { paddingLeft: 0, paddingRight: 0 }
            }}
          >
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  StepIconComponent={(props) => (
                    <CustomStepIcon active={props.active} completed={props.completed}>
                      {index + 1}
                    </CustomStepIcon>
                  )}
                >
                  <Typography fontSize={13} fontWeight={600} color={activeStep >= index ? "#111827" : "#9ca3af"}>
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* CONTENT */}
        <Box sx={{ flex: 1 }}>
          {activeStep === 0 && (
            <Box>
              {/* BOX SECTION: LEAD INFO */}
              <Typography fontSize={11} fontWeight={800} color="#9ca3af" mb={2.5} sx={{ letterSpacing: '0.1em' }}>LEAD INFORMATION</Typography>
              <Grid container spacing={3} mb={6}>
                <Grid item xs={3}><TextField fullWidth size="small" label="Full Name" value={form.fullName} onChange={handleChange("fullName")} InputLabelProps={{ shrink: true, sx: {fontWeight: 600, fontSize: '12px'} }} /></Grid>
                <Grid item xs={3}><TextField fullWidth size="small" label="Contact No." value={form.contact} onChange={handleChange("contact")} InputLabelProps={{ shrink: true, sx: {fontWeight: 600, fontSize: '12px'} }} /></Grid>
                <Grid item xs={3}><TextField fullWidth size="small" label="Email" value={form.email} onChange={handleChange("email")} InputLabelProps={{ shrink: true, sx: {fontWeight: 600, fontSize: '12px'} }} /></Grid>
                <Grid item xs={3}><TextField fullWidth size="small" label="Location/ Address" value={form.location} onChange={handleChange("location")} InputLabelProps={{ shrink: true, sx: {fontWeight: 600, fontSize: '12px'} }} /></Grid>
                <Grid item xs={3}><OutlinedSelect label="Gender" value={form.gender} onChange={(e:any) => setForm({...form, gender: e.target.value})}><MenuItem value="Male">Male</MenuItem><MenuItem value="Female">Female</MenuItem></OutlinedSelect></Grid>
                <Grid item xs={3}><TextField fullWidth size="small" label="Age" value={form.age} onChange={handleChange("age")} InputLabelProps={{ shrink: true, sx: {fontWeight: 600, fontSize: '12px'} }} /></Grid>
                <Grid item xs={3}><OutlinedSelect label="Marital Status" value={form.marital} onChange={(e:any) => setForm({...form, marital: e.target.value})}><MenuItem value="Married">Married</MenuItem><MenuItem value="Single">Single</MenuItem></OutlinedSelect></Grid>
                <Grid item xs={3}><TextField fullWidth size="small" label="Address" value={form.address} onChange={handleChange("address")} InputLabelProps={{ shrink: true, sx: {fontWeight: 600, fontSize: '12px'} }} /></Grid>
                <Grid item xs={3}><OutlinedSelect label="Language Preference" value={form.language} onChange={(e:any) => setForm({...form, language: e.target.value})}><MenuItem value="English">English</MenuItem><MenuItem value="Hindi">Hindi</MenuItem></OutlinedSelect></Grid>
              </Grid>

              {/* BOX SECTION: PARTNER INFO */}
              <Typography fontSize={11} fontWeight={800} color="#9ca3af" mb={1} sx={{ letterSpacing: '0.1em' }}>PARTNER INFORMATION</Typography>
              <Typography fontSize={13} mb={1} fontWeight={600}>Is This Inquiry For a Couple?</Typography>
              <RadioGroup row value={isCouple} onChange={(e) => setIsCouple(e.target.value as "yes" | "no")} sx={{ mb: 2.5 }}>
                <FormControlLabel value="yes" control={<Radio size="small" sx={{ color: '#ff5a5f', '&.Mui-checked': { color: '#ff5a5f' } }} />} label={<Typography fontSize={13}>Yes</Typography>} />
                <FormControlLabel value="no" control={<Radio size="small" sx={{ color: '#ff5a5f', '&.Mui-checked': { color: '#ff5a5f' } }} />} label={<Typography fontSize={13}>No</Typography>} />
              </RadioGroup>

              {isCouple === "yes" && (
                <Grid container spacing={3} mb={6}>
                  <Grid item xs={4}><TextField fullWidth size="small" label="Full Name" value={form.partnerName} onChange={handleChange("partnerName")} InputLabelProps={{ shrink: true, sx: {fontWeight: 600, fontSize: '12px'} }} /></Grid>
                  <Grid item xs={2}><TextField fullWidth size="small" label="Age" value={form.partnerAge} onChange={handleChange("partnerAge")} InputLabelProps={{ shrink: true, sx: {fontWeight: 600, fontSize: '12px'} }} /></Grid>
                  <Grid item xs={3}><OutlinedSelect label="Gender" value={form.partnerGender} onChange={(e: any) => setForm({ ...form, partnerGender: e.target.value })}><MenuItem value="Female">Female</MenuItem><MenuItem value="Male">Male</MenuItem></OutlinedSelect></Grid>
                </Grid>
              )}

              {/* BOX SECTION: SOURCE */}
              <Typography fontSize={11} fontWeight={800} color="#9ca3af" mb={2.5} sx={{ letterSpacing: '0.1em' }}>SOURCE & CAMPAIGN DETAILS</Typography>
              <Grid container spacing={3} mb={6}>
                <Grid item xs={3}><OutlinedSelect label="Source" value={form.source} onChange={(e: any) => setForm({ ...form, source: e.target.value })}><MenuItem value="Social Media">Social Media</MenuItem></OutlinedSelect></Grid>
                <Grid item xs={3}><OutlinedSelect label="Sub-Source" value={form.subSource} onChange={(e: any) => setForm({ ...form, subSource: e.target.value })}><MenuItem value="Facebook">Facebook</MenuItem></OutlinedSelect></Grid>
                <Grid item xs={4}><TextField fullWidth size="small" disabled label="Campaign Name" sx={{ bgcolor: '#f9fafb' }} value={form.campaign} InputLabelProps={{ shrink: true, sx: {fontWeight: 600, fontSize: '12px'} }} /></Grid>
              </Grid>

              {/* BOX SECTION: ASSIGNEE */}
              <Typography fontSize={11} fontWeight={800} color="#9ca3af" mb={2.5} sx={{ letterSpacing: '0.1em' }}>ASSIGNEE & NEXT ACTION DETAILS</Typography>
              <Grid container spacing={3} mb={4}>
                <Grid item xs={3}><OutlinedSelect label="Assigned To" value={form.assignee} onChange={(e: any) => setForm({ ...form, assignee: e.target.value })}><MenuItem value="Henry Cavill">Henry Cavill</MenuItem></OutlinedSelect></Grid>
                <Grid item xs={3}><OutlinedSelect label="Next Action Type" value={form.nextType} onChange={(e: any) => setForm({ ...form, nextType: e.target.value })}><MenuItem value="Follow Up">Follow Up</MenuItem></OutlinedSelect></Grid>
                <Grid item xs={2}><OutlinedSelect label="Next Action Status" value={form.nextStatus} onChange={(e: any) => setForm({ ...form, nextStatus: e.target.value })}><MenuItem value="To Do">To Do</MenuItem></OutlinedSelect></Grid>
                <Grid item xs={4}><TextField fullWidth size="small" label="Next Action Description" placeholder="Enter Description" value={form.nextDesc} onChange={handleChange("nextDesc")} InputLabelProps={{ shrink: true, sx: {fontWeight: 600, fontSize: '12px'} }} /></Grid>
              </Grid>
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography fontSize={11} fontWeight={800} color="#9ca3af" mb={2.5} sx={{ letterSpacing: '0.1em' }}>TREATMENT INFORMATION</Typography>
              <Box sx={{ width: '320px', mb: 2 }}>
                <OutlinedSelect label="Treatment Interest" value={form.treatmentInterest} onChange={(e: any) => {
                    const val = e.target.value;
                    if(val && !form.treatments.includes(val)) { setForm({...form, treatments: [...form.treatments, val]}); }
                  }}>
                  <MenuItem value="Medical Checkup">Medical Checkup</MenuItem>
                  <MenuItem value="IVF">IVF</MenuItem>
                </OutlinedSelect>
              </Box>
              <Box display="flex" gap={1} flexWrap="wrap" mb={4}>
                {form.treatments.map((item) => (
                  <Box key={item} sx={{ px: 1.5, py: 0.5, borderRadius: '4px', bgcolor: "#fef2f2", display: "flex", alignItems: "center", gap: 1, fontSize: 13, border: '1px solid #fee2e2', color: '#b91c1c', fontWeight: 600 }}>
                    {item} <Box component="span" sx={{ cursor: "pointer", fontWeight: 800, fontSize: 14 }} onClick={() => setForm({ ...form, treatments: form.treatments.filter((t) => t !== item) })}>×</Box>
                  </Box>
                ))}
              </Box>
              <Typography fontSize={11} fontWeight={800} color="#9ca3af" mb={2} sx={{ letterSpacing: '0.1em' }}>DOCUMENTS & REPORTS</Typography>
              <Box sx={{ width: '450px', border: "1px solid #e5e7eb", borderRadius: 2, px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 2 }}>
                <Button variant="contained" component="label" size="small" sx={{ textTransform: "none", bgcolor: "#9ca3af", boxShadow: 'none' }}>
                  Choose File <input hidden type="file" onChange={(e) => setForm({ ...form, documents: e.target.files ? e.target.files[0] : null })} />
                </Button>
                <Typography fontSize={13} color="text.secondary">{form.documents ? form.documents.name : "No File Chosen"}</Typography>
              </Box>
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <Typography fontSize={11} fontWeight={800} color="#9ca3af" mb={2.5} sx={{ letterSpacing: '0.1em' }}>APPOINTMENT DETAILS</Typography>
              <Typography fontSize={13} mb={1} fontWeight={600}>Want to Book an Appointment?</Typography>
              <RadioGroup row value={form.wantAppointment} onChange={(e) => setForm({ ...form, wantAppointment: e.target.value as "yes" | "no" })} sx={{ mb: 4 }}>
                <FormControlLabel value="yes" control={<Radio size="small" sx={{ color: '#ff5a5f', '&.Mui-checked': { color: '#ff5a5f' } }} />} label={<Typography fontSize={13}>Yes</Typography>} />
                <FormControlLabel value="no" control={<Radio size="small" sx={{ color: '#ff5a5f', '&.Mui-checked': { color: '#ff5a5f' } }} />} label={<Typography fontSize={13}>No</Typography>} />
              </RadioGroup>

              {form.wantAppointment === "yes" && (
                <>
                  <Grid container spacing={3} mb={4}>
                    <Grid item xs={3}><OutlinedSelect label="Department *" value={form.department} onChange={(e: any) => setForm({ ...form, department: e.target.value })}><MenuItem value="Consultation">Consultation</MenuItem></OutlinedSelect></Grid>
                    <Grid item xs={3}><OutlinedSelect label="Personnel *" value={form.personnel} onChange={(e: any) => setForm({ ...form, personnel: e.target.value })}><MenuItem value="Dr. Alex Carrey">Dr. Alex Carrey</MenuItem></OutlinedSelect></Grid>
                    <Grid item xs={3}><TextField fullWidth size="small" type="date" label="Date *" InputLabelProps={{ shrink: true, sx: {fontWeight: 600, fontSize: '12px'} }} value={form.appointmentDate} onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })} /></Grid>
                    <Grid item xs={3}><OutlinedSelect label="Select Slot *" value={form.slot} onChange={(e: any) => setForm({ ...form, slot: e.target.value })}><MenuItem value="12:30 PM - 01:00 PM">12:30 PM - 01:00 PM</MenuItem></OutlinedSelect></Grid>
                  </Grid>
                  <Box sx={{ width: '100%', maxWidth: '850px' }}>
                    <TextField fullWidth size="small" label="Remark" multiline rows={3} value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} InputLabelProps={{ shrink: true, sx: {fontWeight: 600, fontSize: '12px'} }} />
                  </Box>
                </>
              )}
            </Box>
          )}
        </Box>

        {/* FOOTER ACTIONS */}
        <Box sx={{ borderTop: '1px solid #f3f4f6', pt: 4, mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={() => (activeStep === 0 ? navigate(-1) : handleBack())} sx={{ px: 4, textTransform: 'none', color: '#4b5563', fontWeight: 600, borderRadius: '8px' }}>
            {activeStep === 0 ? "Cancel" : "Back"}
          </Button>
          <Button variant="contained" onClick={handleNext} sx={{ px: 6, textTransform: 'none', bgcolor: '#374151', fontWeight: 600, borderRadius: '8px', boxShadow: 'none' }}>
            {activeStep === steps.length - 1 ? "Save" : "Next"}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}