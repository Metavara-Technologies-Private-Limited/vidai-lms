import {
  Box,
  FormControlLabel,
  InputAdornment,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import type { ReviewRequestFormData } from "./reviewRequest.utils";

type ReviewRequestStepScheduleProps = {
  formData: ReviewRequestFormData;
  coralRadio: Record<string, unknown>;
  onScheduleToggle: (value: "yes" | "no") => void;
  onDateChange: (value: string) => void;
  onDateBlur: () => void;
  onTimeChange: (value: string) => void;
  onTimeBlur: () => void;
};

const ReviewRequestStepSchedule = ({
  formData,
  coralRadio,
  onScheduleToggle,
  onDateChange,
  onDateBlur,
  onTimeChange,
  onTimeBlur,
}: ReviewRequestStepScheduleProps) => {
  const isDisabled = formData.is_scheduled === "no";

  return (
    <Box>
      <Typography
        fontWeight={600}
        fontSize={13}
        sx={{ mb: 1, textTransform: "capitalize" }}
      >
        Want to schedule this {formData.mode}
      </Typography>

      <RadioGroup
        row
        value={formData.is_scheduled}
        onChange={(e) => onScheduleToggle(e.target.value as "yes" | "no")}
        sx={{ mb: 3 }}
      >
        <FormControlLabel
          value="yes"
          control={<Radio sx={coralRadio} size="small" />}
          label={<Typography variant="body2">Yes</Typography>}
        />
        <FormControlLabel
          value="no"
          control={<Radio sx={coralRadio} size="small" />}
          label={<Typography variant="body2">No</Typography>}
        />
      </RadioGroup>

      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          fullWidth
          label="Select Date"
          disabled={isDisabled}
          value={isDisabled ? "00/00/0000" : formData.schedule_date}
          onChange={(e) => onDateChange(e.target.value)}
          onBlur={onDateBlur}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <CalendarTodayIcon
                  sx={{
                    fontSize: 18,
                    color: isDisabled ? "text.disabled" : "inherit",
                  }}
                />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          label="Enter Time"
          disabled={isDisabled}
          value={isDisabled ? "00:00 PM" : formData.schedule_time}
          onChange={(e) => onTimeChange(e.target.value)}
          onBlur={onTimeBlur}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <AccessTimeIcon
                  sx={{
                    fontSize: 18,
                    color: isDisabled ? "text.disabled" : "inherit",
                  }}
                />
              </InputAdornment>
            ),
          }}
        />
      </Box>
    </Box>
  );
};

export default ReviewRequestStepSchedule;
