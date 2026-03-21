import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import type { SelectChangeEvent } from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs, { type Dayjs } from "dayjs";

type FilterStatus = "" | "schedule" | "draft" | "sent";
type FilterMode = "" | "WhatsApp" | "Email" | "SMS";

export type ReviewRequestFilters = {
  fromDate: Dayjs | null;
  toDate: Dayjs | null;
  mode: FilterMode;
  status: FilterStatus;
};

type Props = {
  open: boolean;
  initialFilters: ReviewRequestFilters;
  onClose: () => void;
  onApply: (filters: ReviewRequestFilters) => void;
  onClear: () => void;
};

const STATUS_OPTIONS: Array<{ label: string; value: FilterStatus }> = [
  { label: "Schedule", value: "schedule" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
];

const getStatusChipStyles = (status: FilterStatus) => {
  if (status === "schedule") {
    return {
      color: "#7C3AED",
      backgroundColor: "#F3EEFF",
      border: "1px solid #C4B5FD",
    };
  }

  if (status === "draft") {
    return {
      color: "#6B7280",
      backgroundColor: "#F3F4F6",
      border: "1px solid #D1D5DB",
    };
  }

  return {
    color: "#2E7D32",
    backgroundColor: "#EAF7EF",
    border: "1px solid #7CCB8A",
  };
};

const normalizePickerValue = (value: unknown): Dayjs | null => {
  if (!value) {
    return null;
  }

  return dayjs(value as string | number | Date | Dayjs);
};

const ReviewRequestFilterDialog = ({
  open,
  initialFilters,
  onClose,
  onApply,
  onClear,
}: Props) => {
  const [draftFilters, setDraftFilters] =
    useState<ReviewRequestFilters>(initialFilters);

  const selectedStatusStyles = useMemo(
    () => getStatusChipStyles(draftFilters.status || "schedule"),
    [draftFilters.status],
  );

  const handleModeChange = (event: SelectChangeEvent<FilterMode>) => {
    setDraftFilters((prev) => ({
      ...prev,
      mode: event.target.value as FilterMode,
    }));
  };

  const handleStatusChange = (event: SelectChangeEvent<FilterStatus>) => {
    setDraftFilters((prev) => ({
      ...prev,
      status: event.target.value as FilterStatus,
    }));
  };

  const handleClearAll = () => {
    onClear();
    onClose();
  };

  const handleApply = () => {
    onApply(draftFilters);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionProps={{ onEnter: () => setDraftFilters(initialFilters) }}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "100%",
          maxWidth: 560,
          borderRadius: "16px",
          overflow: "hidden",
        },
      }}
    >
      <Box sx={{ p: 2.25, pb: 1.75 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#232323" }}>
            Filter By
          </Typography>

          <IconButton
            onClick={onClose}
            sx={{
              width: 28,
              height: 28,
              backgroundColor: "#F3F4F6",
              "&:hover": { backgroundColor: "#E5E7EB" },
            }}
          >
            <CloseIcon sx={{ fontSize: 16, color: "#6B7280" }} />
          </IconButton>
        </Box>
      </Box>

      <Divider />

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ p: 2.25, pt: 1.75 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1.5,
              mb: 1.5,
            }}
          >
            <DatePicker
              label="From Date"
              format="DD/MM/YYYY"
              value={draftFilters.fromDate}
              onChange={(value) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  fromDate: normalizePickerValue(value),
                }))
              }
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                },
              }}
            />

            <DatePicker
              label="To Date"
              format="DD/MM/YYYY"
              value={draftFilters.toDate}
              onChange={(value) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  toDate: normalizePickerValue(value),
                }))
              }
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                },
              }}
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1.5,
            }}
          >
            <FormControl size="small" fullWidth>
              <InputLabel>Mode</InputLabel>
              <Select
                label="Mode"
                value={draftFilters.mode}
                onChange={handleModeChange}
                IconComponent={KeyboardArrowDownIcon}
              >
                <MenuItem value="WhatsApp">WhatsApp</MenuItem>
                <MenuItem value="Email">Email</MenuItem>
                <MenuItem value="SMS">SMS</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={draftFilters.status}
                onChange={handleStatusChange}
                IconComponent={KeyboardArrowDownIcon}
                renderValue={(value) => {
                  if (!value) {
                    return "";
                  }

                  const selectedStatus = STATUS_OPTIONS.find(
                    (option) => option.value === value,
                  );

                  if (!selectedStatus) {
                    return "";
                  }

                  return (
                    <Chip
                      label={selectedStatus.label}
                      size="small"
                      sx={{
                        height: 24,
                        borderRadius: "999px",
                        fontSize: 12,
                        fontWeight: 600,
                        ...selectedStatusStyles,
                      }}
                    />
                  );
                }}
              >
                {STATUS_OPTIONS.map((option) => {
                  const style = getStatusChipStyles(option.value);
                  return (
                    <MenuItem key={option.value} value={option.value}>
                      <Chip
                        label={option.label}
                        size="small"
                        sx={{
                          height: 24,
                          borderRadius: "999px",
                          fontSize: 12,
                          fontWeight: 600,
                          ...style,
                        }}
                      />
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </LocalizationProvider>

      <Divider />

      <Box
        sx={{
          p: 2.25,
          pt: 1.5,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1.5,
        }}
      >
        <Button
          variant="outlined"
          onClick={handleClearAll}
          sx={{
            borderColor: "#232323",
            color: "#232323",
            textTransform: "none",
            fontSize: 14,
            fontWeight: 600,
            borderRadius: "10px",
            height: 48,
          }}
        >
          Clear All
        </Button>

        <Button
          variant="contained"
          onClick={handleApply}
          sx={{
            textTransform: "none",
            fontSize: 14,
            fontWeight: 600,
            borderRadius: "10px",
            height: 48,
            backgroundColor: "#505050",
            "&:hover": {
              backgroundColor: "#232323",
            },
          }}
        >
          Apply
        </Button>
      </Box>
    </Dialog>
  );
};

export default ReviewRequestFilterDialog;
