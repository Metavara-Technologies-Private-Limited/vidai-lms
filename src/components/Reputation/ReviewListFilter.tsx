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

export type ReviewListFilters = {
  fromDate: Dayjs | null;
  toDate: Dayjs | null;
  minRating: number | null;
};

type Props = {
  open: boolean;
  initialFilters: ReviewListFilters;
  onClose: () => void;
  onApply: (filters: ReviewListFilters) => void;
  onClear: () => void;
};

type RatingOption = {
  value: number;
  label: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
};

const RATING_OPTIONS: RatingOption[] = [
  {
    value: 1,
    label: "1 Star and above",
    color: "#B91C1C",
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
  },
  {
    value: 2,
    label: "2 Star and above",
    color: "#C2410C",
    backgroundColor: "#FFEDD5",
    borderColor: "#FDBA74",
  },
  {
    value: 3,
    label: "3 Star and above",
    color: "#A16207",
    backgroundColor: "#FEF9C3",
    borderColor: "#FDE047",
  },
  {
    value: 4,
    label: "4 Star and above",
    color: "#166534",
    backgroundColor: "#DCFCE7",
    borderColor: "#86EFAC",
  },
  {
    value: 5,
    label: "5 Star and above",
    color: "#1D4ED8",
    backgroundColor: "#DBEAFE",
    borderColor: "#93C5FD",
  },
];

const normalizePickerValue = (value: unknown): Dayjs | null => {
  if (!value) {
    return null;
  }

  return dayjs(value as string | number | Date | Dayjs);
};

const ReviewListFilter = ({
  open,
  initialFilters,
  onClose,
  onApply,
  onClear,
}: Props) => {
  const [draftFilters, setDraftFilters] =
    useState<ReviewListFilters>(initialFilters);

  const selectedRatingStyle = useMemo(() => {
    const ratingOption = RATING_OPTIONS.find(
      (option) => option.value === draftFilters.minRating,
    );

    if (!ratingOption) {
      return null;
    }

    return {
      color: ratingOption.color,
      backgroundColor: ratingOption.backgroundColor,
      border: `1px solid ${ratingOption.borderColor}`,
    };
  }, [draftFilters.minRating]);

  const handleRatingChange = (event: SelectChangeEvent<number | string>) => {
    const value = event.target.value;
    setDraftFilters((prev) => ({
      ...prev,
      minRating: value === "" ? null : Number(value),
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
          maxWidth: 430,
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
              backgroundColor: "#E5E7EB",
              "&:hover": { backgroundColor: "#D1D5DB" },
            }}
          >
            <CloseIcon sx={{ fontSize: 16, color: "#232323" }} />
          </IconButton>
        </Box>
      </Box>

      <Divider />

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ p: 2.25, pt: 1.75 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.5 }}>
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

            <FormControl size="small" fullWidth>
              <InputLabel>Rating</InputLabel>
              <Select
                label="Rating"
                value={draftFilters.minRating ?? ""}
                onChange={handleRatingChange}
                IconComponent={KeyboardArrowDownIcon}
                renderValue={(value) => {
                  if (!value) {
                    return "";
                  }

                  const selected = RATING_OPTIONS.find(
                    (option) => option.value === Number(value),
                  );

                  if (!selected || !selectedRatingStyle) {
                    return "";
                  }

                  return (
                    <Chip
                      label={selected.label}
                      size="small"
                      sx={{
                        height: 24,
                        borderRadius: "999px",
                        fontSize: 12,
                        fontWeight: 600,
                        ...selectedRatingStyle,
                      }}
                    />
                  );
                }}
              >
                {RATING_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Chip
                      label={option.label}
                      size="small"
                      sx={{
                        height: 24,
                        borderRadius: "999px",
                        fontSize: 12,
                        fontWeight: 600,
                        color: option.color,
                        backgroundColor: option.backgroundColor,
                        border: `1px solid ${option.borderColor}`,
                      }}
                    />
                  </MenuItem>
                ))}
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
            fontSize: 16,
            fontWeight: 600,
            borderRadius: "10px",
            height: 40,
          }}
        >
          Clear All
        </Button>

        <Button
          variant="contained"
          onClick={handleApply}
          sx={{
            textTransform: "none",
            fontSize: 16,
            fontWeight: 600,
            borderRadius: "10px",
            height: 40,
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

export default ReviewListFilter;
