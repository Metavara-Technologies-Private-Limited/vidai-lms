import * as React from "react";
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Grid,
  TextField,
  MenuItem,
  Button,
  Stack,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
} from "@mui/material";

const steps = ["Patient Details", "Medical Details", "Book Appointment"];

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    height: 44,
    borderRadius: "8px",
    backgroundColor: "#fff",
  },
};

const AddNewLead: React.FC = () => {
  const [activeStep, setActiveStep] = React.useState(0);

  const [form, setForm] = React.useState({
    fullName: "John Smith",
    contact: "+91 54211 54121",
    email: "johns@gmail.com",
    location: "201, HM Streets, LA Jolla, California",
    gender: "Male",
    age: "32",
    maritalStatus: "Married",
    address: "201, HM Streets, LA Jolla, California",
    language: "English",
    isCouple: "yes",
    partnerName: "Jennifer Smith",
    partnerAge: "29",
    partnerGender: "Female",
    source: "Social Media",
    subSource: "Facebook",
    campaign: "Facebook IVF Awareness - December",
    assignedTo: "",
    nextActionType: "",
    nextActionStatus: "",
    nextActionDesc: "",
  });

  const handleChange =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({ ...form, [key]: e.target.value });
    };

  const handleNext = () => setActiveStep((s) => s + 1);
  const handleBack = () => setActiveStep((s) => s - 1);

  return (
    <Box sx={{ p: 3, backgroundColor: "#f8fafc", minHeight: "100vh" }}>

      {/* Title */}
      <Typography fontSize={24} fontWeight={600} mb={3}>
        Add New Lead
      </Typography>

      <Box
        sx={{
          background: "#fff",
          borderRadius: 2,
          p: 3,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        {/* STEPPER */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* ================= STEP 1 ================= */}
        {activeStep === 0 && (
          <>
            {/* LEAD INFORMATION */}
            <Typography variant="caption" fontWeight={600} mb={2} display="block">
              LEAD INFORMATION
            </Typography>

            <Grid container spacing={2} mb={4}>
              <Grid item xs={3}>
                <TextField
                  label="Full Name"
                  value={form.fullName}
                  onChange={handleChange("fullName")}
                  fullWidth
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={3}>
                <TextField
                  label="Contact No."
                  value={form.contact}
                  onChange={handleChange("contact")}
                  fullWidth
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={3}>
                <TextField
                  label="Email"
                  value={form.email}
                  onChange={handleChange("email")}
                  fullWidth
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={3}>
                <TextField
                  label="Location / Address"
                  value={form.location}
                  onChange={handleChange("location")}
                  fullWidth
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={3}>
                <TextField
                  label="Gender"
                  value={form.gender}
                  onChange={handleChange("gender")}
                  select
                  fullWidth
                  sx={fieldSx}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={3}>
                <TextField
                  label="Age"
                  value={form.age}
                  onChange={handleChange("age")}
                  type="number"
                  fullWidth
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={3}>
                <TextField
                  label="Marital Status"
                  value={form.maritalStatus}
                  onChange={handleChange("maritalStatus")}
                  select
                  fullWidth
                  sx={fieldSx}
                >
                  <MenuItem value="Married">Married</MenuItem>
                  <MenuItem value="Single">Single</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={3}>
                <TextField
                  label="Language Preference"
                  value={form.language}
                  onChange={handleChange("language")}
                  select
                  fullWidth
                  sx={fieldSx}
                >
                  <MenuItem value="English">English</MenuItem>
                  <MenuItem value="Hindi">Hindi</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            {/* PARTNER INFORMATION */}
            <Typography variant="caption" fontWeight={600} mb={2} display="block">
              PARTNER INFORMATION
            </Typography>

            <Typography variant="body2" fontSize={13} mb={2}>
              Is This Inquiry For A Couple?
            </Typography>

            <RadioGroup
              row
              value={form.isCouple}
              onChange={handleChange("isCouple")}
              sx={{ mb: 2 }}
            >
              <FormControlLabel value="yes" control={<Radio />} label="Yes" />
              <FormControlLabel value="no" control={<Radio />} label="No" />
            </RadioGroup>

            {form.isCouple === "yes" && (
              <Grid container spacing={2} mb={4}>
                <Grid item xs={4}>
                  <TextField
                    label="Full Name"
                    value={form.partnerName}
                    onChange={handleChange("partnerName")}
                    fullWidth
                    sx={fieldSx}
                  />
                </Grid>

                <Grid item xs={4}>
                  <TextField
                    label="Age"
                    value={form.partnerAge}
                    onChange={handleChange("partnerAge")}
                    type="number"
                    fullWidth
                    sx={fieldSx}
                  />
                </Grid>

                <Grid item xs={4}>
                  <TextField
                    label="Gender"
                    value={form.partnerGender}
                    onChange={handleChange("partnerGender")}
                    select
                    fullWidth
                    sx={fieldSx}
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            )}

            {/* SOURCE & CAMPAIGN DETAILS */}
            <Typography variant="caption" fontWeight={600} mb={2} display="block">
              SOURCE & CAMPAIGN DETAILS
            </Typography>

            <Grid container spacing={2} mb={4}>
              <Grid item xs={3}>
                <TextField
                  label="Source"
                  value={form.source}
                  onChange={handleChange("source")}
                  select
                  fullWidth
                  sx={fieldSx}
                >
                  <MenuItem value="Social Media">Social Media</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={3}>
                <TextField
                  label="Sub Source"
                  value={form.subSource}
                  onChange={handleChange("subSource")}
                  select
                  fullWidth
                  sx={fieldSx}
                >
                  <MenuItem value="Facebook">Facebook</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="Campaign Name"
                  value={form.campaign}
                  onChange={handleChange("campaign")}
                  fullWidth
                  sx={fieldSx}
                />
              </Grid>
            </Grid>

            {/* ASSIGNEE & NEXT ACTION DETAILS */}
            <Typography variant="caption" fontWeight={600} mb={2} display="block">
              ASSIGNEE & NEXT ACTION DETAILS
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={3}>
                <TextField
                  label="Assigned To"
                  value={form.assignedTo}
                  onChange={handleChange("assignedTo")}
                  fullWidth
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={3}>
                <TextField
                  label="Next Action Type"
                  value={form.nextActionType}
                  onChange={handleChange("nextActionType")}
                  fullWidth
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={3}>
                <TextField
                  label="Next Action Status"
                  value={form.nextActionStatus}
                  onChange={handleChange("nextActionStatus")}
                  fullWidth
                  sx={fieldSx}
                />
              </Grid>

              <Grid item xs={3}>
                <TextField
                  label="Next Action Description"
                  value={form.nextActionDesc}
                  onChange={handleChange("nextActionDesc")}
                  fullWidth
                  sx={fieldSx}
                />
              </Grid>
            </Grid>
          </>
        )}

        {/* ================= STEP 2 ================= */}
        {activeStep === 1 && (
          <Typography variant="body1" color="textSecondary">
            Medical Details - Coming Soon
          </Typography>
        )}

        {/* ================= STEP 3 ================= */}
        {activeStep === 2 && (
          <Typography variant="body1" color="textSecondary">
            Book Appointment - Coming Soon
          </Typography>
        )}

        {/* FOOTER BUTTONS */}
        <Stack direction="row" justifyContent="flex-end" spacing={2} mt={4}>
          <Button
            variant="outlined"
            onClick={() => {
              setActiveStep(0);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={
              activeStep === steps.length - 1
                ? () => console.log("SUBMIT", form)
                : handleNext
            }
            sx={{
              backgroundColor: "#1f2937",
              "&:hover": {
                backgroundColor: "#111827",
              },
            }}
          >
            {activeStep === steps.length - 1 ? "Submit" : "Next"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default AddNewLead;