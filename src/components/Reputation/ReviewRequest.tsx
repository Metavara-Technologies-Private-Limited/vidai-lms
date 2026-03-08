import { useState } from "react";

import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";

import CloseIcon from "@mui/icons-material/Close";
type ReviewRequestProps = {
  open: boolean;
  onClose: () => void;
};

const ReviewRequest = ({ open, onClose }: ReviewRequestProps) => {
  const [step, setStep] = useState(1);

  const handleClose = () => {
    onClose();
    setStep(1);
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 3 },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography fontWeight={600} fontSize={18}>
            New Review Request
          </Typography>

          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Step Indicator */}
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <Typography color={step === 1 ? "#E86A4A" : "#888"}>
            1 Request Details
          </Typography>
          <Typography color={step === 2 ? "#E86A4A" : "#888"}>
            2 Request Content
          </Typography>
          <Typography color={step === 3 ? "#E86A4A" : "#888"}>
            3 Schedule Request
          </Typography>
        </Box>

        {/* STEP 1 */}
        {step === 1 && (
          <Box>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                label="Request Name"
                fullWidth
                defaultValue="Post-Consultation Feedback"
              />

              <TextField
                label="Description"
                fullWidth
                defaultValue="Used To Collect Feedback After First Consultation"
              />
            </Box>

            <Typography sx={{ mb: 1 }}>Select Leads</Typography>

            <RadioGroup row defaultValue="manual">
              <FormControlLabel
                value="all"
                control={<Radio />}
                label="All Leads"
              />
              <FormControlLabel
                value="manual"
                control={<Radio />}
                label="Select Manually"
              />
            </RadioGroup>

            <Box sx={{ mt: 3 }}>
              <Typography sx={{ mb: 1 }}>Collect Reviews On</Typography>

              <RadioGroup row defaultValue="google">
                <FormControlLabel
                  value="google"
                  control={<Radio />}
                  label="Google"
                />
                <FormControlLabel
                  value="form"
                  control={<Radio />}
                  label="Feedback Form"
                />
                <FormControlLabel
                  value="both"
                  control={<Radio />}
                  label="Both (With Rating Gate)"
                />
              </RadioGroup>
            </Box>
          </Box>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <Box>
            <Typography sx={{ mb: 2 }}>Select Mode</Typography>

            <RadioGroup row defaultValue="email">
              <FormControlLabel value="email" control={<Radio />} label="Email" />
              <FormControlLabel value="sms" control={<Radio />} label="SMS" />
              <FormControlLabel value="whatsapp" control={<Radio />} label="WhatsApp" />
            </RadioGroup>

            <TextField
              fullWidth
              label="Subject"
              sx={{ mt: 2 }}
              defaultValue="We’d love your feedback on your recent consultation"
            />

            <TextField
              fullWidth
              multiline
              rows={8}
              label="Body"
              sx={{ mt: 2 }}
              defaultValue={`Dear {{Patient Name}},

Thank you for visiting {{Clinic / Hospital Name}} for your recent consultation.

Your feedback helps us improve our care.

Share your feedback:
{{Review Link Button}}

Warm regards,
{{Doctor / Care Team Name}}
{{Clinic Name}}`}
            />
          </Box>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <Box>
            <Typography sx={{ mb: 2 }}>
              Want to schedule this Email
            </Typography>

            <RadioGroup row defaultValue="yes">
              <FormControlLabel value="yes" control={<Radio />} label="Yes" />
              <FormControlLabel value="no" control={<Radio />} label="No" />
            </RadioGroup>

            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <TextField
                type="date"
                label="Select Date"
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <TextField
                type="time"
                label="Enter Time"
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>
          </Box>
        )}

        {/* Footer Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 4,
          }}
        >
          <Button
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: "none" }}
            onClick={step === 1 ? handleClose : prevStep}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            sx={{
              background: "#D9D9D9",
              color: "#000",
              borderRadius: 2,
              textTransform: "none",
            }}
          >
            Save as Draft
          </Button>

          {step < 3 ? (
            <Button
              variant="contained"
              sx={{
                background: "#4A4A4A",
                borderRadius: 2,
                textTransform: "none",
              }}
              onClick={nextStep}
            >
              Save & Continue
            </Button>
          ) : (
            <Button
              variant="contained"
              sx={{
                background: "#4A4A4A",
                borderRadius: 2,
                textTransform: "none",
              }}
            >
              Save Request
            </Button>
          )}
        </Box>
      </Dialog>
    </>
  );
};

export default ReviewRequest;