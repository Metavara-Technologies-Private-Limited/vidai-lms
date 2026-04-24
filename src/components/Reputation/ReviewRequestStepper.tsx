import { Box, Paper, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

type ReviewRequestStepperProps = {
  step: number;
};

const stepItems = [
  { label: "Request Details", num: 1 },
  { label: "Request Content", num: 2 },
  { label: "Schedule Request", num: 3 },
];

const ReviewRequestStepper = ({ step }: ReviewRequestStepperProps) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.25,
        mb: 2,
        borderRadius: "12px",
        border: "1px solid #F3F4F6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {stepItems.map((item, idx) => (
        <Box
          key={item.num}
          sx={{
            display: "flex",
            alignItems: "center",
            flex: "0 0 auto",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            {step > item.num ? (
              <CheckCircleIcon sx={{ color: "#22C55E", fontSize: 22 }} />
            ) : (
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  backgroundColor: step === item.num ? "#E86A4A" : "#E5E7EB",
                  color: "#FFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: 700,
                }}
              >
                {item.num}
              </Box>
            )}
            <Typography
              variant="caption"
              fontWeight={600}
              noWrap
              sx={{ fontSize: 11, lineHeight: 1.2 }}
              color={
                step >= item.num
                  ? step === item.num
                    ? "#E86A4A"
                    : "#22C55E"
                  : "#9CA3AF"
              }
            >
              {item.label}
            </Typography>
          </Box>
          {idx < 2 && (
            <Box
              sx={{
                width: { xs: 46, sm: 68 },
                height: "1px",
                bgcolor: "#E5E7EB",
                mx: 1.25,
              }}
            />
          )}
        </Box>
      ))}
    </Paper>
  );
};

export default ReviewRequestStepper;
