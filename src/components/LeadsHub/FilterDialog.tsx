import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
  IconButton,
  Box,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import CloseIcon from "@mui/icons-material/Close";
import dayjs, { Dayjs } from "dayjs";

import { DepartmentAPI, EmployeeAPI } from "../../services/leads.api";
import type { Department, Employee } from "../../services/leads.api";
import type { FilterValues } from "../../types/leads.types";

interface FilterDialogProps {
  open: boolean;
  onClose: () => void;
  onApplyFilters?: (filters: FilterValues) => void;
}

const FilterDialog: React.FC<FilterDialogProps> = ({ open, onClose, onApplyFilters }) => {
  const [clinicId] = React.useState(1);

  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = React.useState<Employee[]>([]);

  const setLoadingDepartments = React.useState(false)[1];
  const [loadingEmployees, setLoadingEmployees] = React.useState(false);

  const [filters, setFilters] = React.useState<FilterValues>({
    department: "",
    assignee: "",
    status: "",
    quality: "",
    source: "",
    dateFrom: null,
    dateTo: null,
  });

  const [dateFrom, setDateFrom] = React.useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = React.useState<Dayjs | null>(null);
  const [location, setLocation] = React.useState("");
  const [subSource, setSubSource] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    const fetchDepartments = async () => {
      try {
        setLoadingDepartments(true);
        const departments = await DepartmentAPI.listActiveByClinic(clinicId);
        setDepartments(departments);
      } catch (err) {
        console.error("Failed to load departments:", err);
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, [open, clinicId]);

  React.useEffect(() => {
    if (!open) return;
    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const employees = await EmployeeAPI.listByClinic(clinicId);
        setEmployees(Array.isArray(employees) ? employees : []);
      } catch (err) {
        console.error("Failed to load employees:", err);
        setEmployees([]);
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, [open, clinicId]);

  React.useEffect(() => {
    if (!filters.department || employees.length === 0) {
      setFilteredEmployees(employees);
      return;
    }
    const selectedDept = departments.find((d) => d.id === Number(filters.department));
    if (!selectedDept) {
      setFilteredEmployees(employees);
      return;
    }
    const normalize = (s: string) => (s ?? "").trim().toLowerCase();
    const filtered = employees.filter(
      (emp) => normalize(emp.department_name) === normalize(selectedDept.name)
    );
    setFilteredEmployees(filtered);
  }, [filters.department, employees, departments]);

  const handleFilterChange = (field: keyof FilterValues, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "department" ? { assignee: "" } : {}),
    }));
  };

  const handleDateFromChange = (newValue: Date | Dayjs | null) => {
    const parsed = newValue ? dayjs(newValue) : null;
    setDateFrom(parsed);
    setFilters((prev) => ({
      ...prev,
      dateFrom: parsed ? parsed.format("YYYY-MM-DD") : null,
    }));
  };

  const handleDateToChange = (newValue: Date | Dayjs | null) => {
    const parsed = newValue ? dayjs(newValue) : null;
    setDateTo(parsed);
    setFilters((prev) => ({
      ...prev,
      dateTo: parsed ? parsed.format("YYYY-MM-DD") : null,
    }));
  };

  const handleApply = () => {
    console.log("🔍 Applying filters:", filters);
    if (onApplyFilters) {
      onApplyFilters(filters);
    }
    onClose();
  };

  const handleClearAll = () => {
    const emptyFilters: FilterValues = {
      department: "",
      assignee: "",
      status: "",
      quality: "",
      source: "",
      dateFrom: null,
      dateTo: null,
    };

    setFilters(emptyFilters);
    setDateFrom(null);
    setDateTo(null);
    setLocation("");
    setSubSource("");

    if (onApplyFilters) {
      onApplyFilters(emptyFilters);
    }

    console.log("🧹 Filters cleared and applied:", emptyFilters);
  };

  const labelStyle = {
    fontSize: "11px",
    color: "#9CA3AF",
    fontWeight: 400,
    mb: 0.5,
    display: "block",
  };

  const inputStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "6px",
      fontSize: "13px",
      backgroundColor: "#FFFFFF",
      height: "40px",
      "& fieldset": {
        borderColor: "#E5E7EB",
      },
      "&:hover fieldset": {
        borderColor: "#D1D5DB",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#9CA3AF",
        borderWidth: "1px",
      },
    },
    "& .MuiInputBase-input": {
      padding: "9px 12px",
      fontSize: "13px",
      height: "40px",
      boxSizing: "border-box",
    },
    "& .MuiSelect-select": {
      padding: "9px 12px",
      height: "40px",
      display: "flex",
      alignItems: "center",
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "12px",
          width: "580px",
          maxWidth: "90vw",
          maxHeight: "90vh",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 3,
          py: 2,
        }}
      >
        <Typography variant="h6" fontWeight={600} sx={{ fontSize: "16px", color: "#111827" }}>
          Filter By
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: "#6B7280" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Content */}
      <DialogContent sx={{ px: 3, py: 0, pb: 2 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Row 1: From Date & To Date */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelStyle}>From Date</Typography>
                <DatePicker
                  value={dateFrom}
                  onChange={handleDateFromChange}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      placeholder: "DD/MM/YYYY",
                      sx: inputStyle,
                    },
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelStyle}>To Date</Typography>
                <DatePicker
                  value={dateTo}
                  onChange={handleDateToChange}
                  minDate={dateFrom || undefined}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      placeholder: "DD/MM/YYYY",
                      sx: inputStyle,
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Row 2: Lead Quality & Status */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelStyle}>Lead Quality</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={filters.quality}
                  onChange={(e) => handleFilterChange("quality", e.target.value)}
                  sx={inputStyle}
                  SelectProps={{
                    displayEmpty: true,
                  }}
                >
                  <MenuItem value="">Select Quality</MenuItem>
                  <MenuItem value="Hot">Hot</MenuItem>
                  <MenuItem value="Warm">Warm</MenuItem>
                  <MenuItem value="Cold">Cold</MenuItem>
                </TextField>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelStyle}>Status</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  sx={inputStyle}
                  SelectProps={{
                    displayEmpty: true,
                  }}
                >
                  <MenuItem value="">Select Status</MenuItem>
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="contacted">Contacted</MenuItem>
                  <MenuItem value="follow-ups">Follow-Ups</MenuItem>
                  <MenuItem value="converted">Converted</MenuItem>
                  <MenuItem value="lost">Lost</MenuItem>
                  <MenuItem value="cycle conversion">Cycle Conversion</MenuItem>
                  <MenuItem value="appointment">Appointment</MenuItem>
                </TextField>
              </Box>
            </Box>

            {/* Row 3: Location & Assignee */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelStyle}>Location</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  sx={inputStyle}
                  SelectProps={{
                    displayEmpty: true,
                  }}
                >
                  <MenuItem value="">Select Location</MenuItem>
                  <MenuItem value="LA Jolla, California">LA Jolla, California</MenuItem>
                  <MenuItem value="Oceanview, California">Oceanview, California</MenuItem>
                  <MenuItem value="Palm Sibo, California">Palm Sibo, California</MenuItem>
                  <MenuItem value="Sunny C, California">Sunny C, California</MenuItem>
                </TextField>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelStyle}>Assignee</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={filters.assignee}
                  onChange={(e) => handleFilterChange("assignee", e.target.value)}
                  disabled={loadingEmployees}
                  sx={inputStyle}
                  SelectProps={{
                    displayEmpty: true,
                  }}
                >
                  <MenuItem value="">Select Assignee</MenuItem>
                  {filteredEmployees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id.toString()}>
                      {emp.emp_name}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>

            {/* Row 4: Source & Sub-Source */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelStyle}>Source</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={filters.source}
                  onChange={(e) => handleFilterChange("source", e.target.value)}
                  sx={inputStyle}
                  SelectProps={{
                    displayEmpty: true,
                  }}
                >
                  <MenuItem value="">Select Source</MenuItem>
                  <MenuItem value="Social Media">Social Media</MenuItem>
                  <MenuItem value="Website">Website</MenuItem>
                  <MenuItem value="Referral">Referral</MenuItem>
                  <MenuItem value="Direct">Direct</MenuItem>
                  <MenuItem value="Email">Email</MenuItem>
                  <MenuItem value="Phone">Phone</MenuItem>
                </TextField>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={labelStyle}>Sub-Source</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={subSource}
                  onChange={(e) => setSubSource(e.target.value)}
                  sx={inputStyle}
                  SelectProps={{
                    displayEmpty: true,
                  }}
                >
                  <MenuItem value="">Select Sub-Source</MenuItem>
                  <MenuItem value="Facebook">Facebook</MenuItem>
                  <MenuItem value="Instagram">Instagram</MenuItem>
                  <MenuItem value="LinkedIn">LinkedIn</MenuItem>
                  <MenuItem value="Twitter">Twitter</MenuItem>
                  <MenuItem value="Google Ads">Google Ads</MenuItem>
                </TextField>
              </Box>
            </Box>
          </Box>
        </LocalizationProvider>
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 2 }}>
        <Button
          onClick={handleClearAll}
          fullWidth
          variant="outlined"
          sx={{
            height: 40,
            borderRadius: "6px",
            textTransform: "none",
            fontWeight: 500,
            fontSize: "14px",
            color: "#374151",
            borderColor: "#E5E7EB",
            "&:hover": {
              borderColor: "#D1D5DB",
              bgcolor: "#F9FAFB",
            },
          }}
        >
          Clear All
        </Button>
        <Button
          onClick={handleApply}
          fullWidth
          variant="contained"
          sx={{
            height: 40,
            bgcolor: "#2C2C2C",
            borderRadius: "6px",
            textTransform: "none",
            fontWeight: 500,
            fontSize: "14px",
            boxShadow: "none",
            "&:hover": {
              bgcolor: "#1A1A1A",
              boxShadow: "none",
            },
          }}
        >
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FilterDialog;