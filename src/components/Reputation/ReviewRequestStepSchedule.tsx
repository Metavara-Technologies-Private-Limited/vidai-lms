import {
  Box,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import {
  formatDisplayDate,
  formatDisplayTime,
  getScheduledDateTime,
  parseDisplayDate,
  type ReviewRequestFormData,
} from "./reviewRequest.utils";

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
  const now = dayjs();
  const selectedDate = parseDisplayDate(formData.schedule_date);
  const selectedTime = getScheduledDateTime(
    formData.schedule_date,
    formData.schedule_time,
  );
  const minTime = selectedDate?.isSame(now, "day")
    ? now.startOf("minute")
    : undefined;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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
          sx={{ mb: 1.75, flexDirection: { xs: "column", sm: "row" } }}
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

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 1.5,
          }}
        >
          <DatePicker
            label="Select Date"
            disabled={isDisabled}
            format="DD/MM/YYYY"
            value={isDisabled ? null : selectedDate}
            minDate={now.startOf("day")}
            onChange={(value) => {
              onDateChange(value ? formatDisplayDate(dayjs(value)) : "");
            }}
            onClose={onDateBlur}
            slots={{ openPickerIcon: CalendarTodayIcon }}
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                onBlur: onDateBlur,
              },
            }}
          />

          <TimePicker
            label="Enter Time"
            disabled={isDisabled}
            format="hh:mm A"
            ampm
            value={isDisabled ? null : selectedTime}
            minTime={minTime}
            onChange={(value) => {
              onTimeChange(value ? formatDisplayTime(dayjs(value)) : "");
            }}
            onClose={onTimeBlur}
            slots={{ openPickerIcon: AccessTimeIcon }}
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
                onBlur: onTimeBlur,
              },
            }}
          />
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default ReviewRequestStepSchedule;
