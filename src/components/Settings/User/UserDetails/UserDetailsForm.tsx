import React, { useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import type { Dayjs } from "dayjs";
import { toast } from "react-toastify";

export type UserType = "employee";

export interface UserFormData {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfJoining: Dayjs | null;
  dateOfBirth: Dayjs | null;
  userRole: string;
  userName: string;
  mobileNo: string;
  emailId: string;
  password: string;
  confirmPassword: string;
  profilePhoto: string | null;
}

interface Props {
  onNext: (userType: UserType, data: UserFormData) => void;
  onCancel: () => void;
}

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "6px",
    fontSize: "13px",
    height: 40,
    "& fieldset": { borderColor: "#E0E0E0" },
    "&:hover fieldset": { borderColor: "#BDBDBD" },
    "&.Mui-focused fieldset": { borderColor: "#D32F2F" },
  },
  "& .MuiInputLabel-root": { fontSize: "12px", color: "#757575" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#D32F2F" },
};

const defaultForm: UserFormData = {
  firstName: "",
  lastName: "",
  gender: "",
  dateOfJoining: null,
  dateOfBirth: null,
  userRole: "",
  userName: "",
  mobileNo: "",
  emailId: "",
  password: "",
  confirmPassword: "",
  profilePhoto: null,
};

const FieldGrid = ({ children }: { children: React.ReactNode }) => (
  <Grid size={{ xs: 12, sm: 3 }}>{children}</Grid>
);

const SelectField = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => (
  <FormControl fullWidth sx={inputSx}>
    <InputLabel shrink>{label}</InputLabel>
    <Select
      notched
      label={label}
      displayEmpty
      value={value}
      onChange={(e) => onChange(e.target.value)}
      renderValue={(v) => v || <span style={{ color: "#9E9E9E" }}>Select</span>}
      sx={{ height: 40, fontSize: 13 }}
    >
      {options.map((o) => (
        <MenuItem key={o.value} value={o.value}>
          {o.label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

const DateField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Dayjs | null;
  onChange: (v: Dayjs | null) => void;
}) => (
  <DatePicker
    label={label}
    value={value}
    onChange={(v) => onChange(v as Dayjs | null)}
    slotProps={{
      textField: {
        fullWidth: true,
        placeholder: "Select Date",
        InputLabelProps: { shrink: true },
        sx: inputSx,
      },
    }}
  />
);

const PasswordField = ({
  label,
  value,
  onChange,
  show,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) => (
  <TextField
    fullWidth
    label={label}
    placeholder="Type Here..."
    type={show ? "text" : "password"}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    sx={inputSx}
    InputLabelProps={{ shrink: true }}
    InputProps={{
      endAdornment: (
        <InputAdornment position="end">
          <IconButton size="small" onClick={onToggle}>
            {show ? (
              <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
            ) : (
              <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        </InputAdornment>
      ),
    }}
  />
);

const capitalizeFirst = (value: string): string => {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const UserDetailsForm: React.FC<Props> = ({ onNext, onCancel }) => {
  const [form, setForm] = useState<UserFormData>(defaultForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setForm((prev) => ({ ...prev, profilePhoto: result }));
      toast.success("Profile photo added successfully");
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setForm((prev) => ({ ...prev, profilePhoto: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success("Profile photo removed successfully");
  };

  const validateForm = (): boolean => {
    if (form.userName.trim() && /^[^a-zA-Z0-9]/.test(form.userName)) {
      toast.error("User Name should not start with special characters");
      return false;
    }

    if (form.mobileNo.trim() && !/^\d{10}$/.test(form.mobileNo)) {
      toast.error("Mobile Number must be 10 digits");
      return false;
    }

    if (form.password !== form.confirmPassword) {
      toast.error("Password and Confirm Password must match");
      return false;
    }

    return true;
  };

  const handleSaveAndNext = () => {
    if (!validateForm()) return;

    toast.success("User details saved successfully");
    onNext("employee", form);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 2 }}>
          <Box sx={{ position: "relative", width: 64, height: 64 }}>
            <Avatar
              src={form.profilePhoto ?? undefined}
              sx={{ width: 64, height: 64, bgcolor: "#EEEEEE" }}
            />
            <IconButton
              size="small"
              onClick={() => fileInputRef.current?.click()}
              sx={{
                position: "absolute",
                bottom: 0,
                right: form.profilePhoto ? 22 : -4,
                bgcolor: "#D32F2F",
                color: "#fff",
                width: 20,
                height: 20,
                "&:hover": { bgcolor: "#B71C1C" },
              }}
            >
              <EditIcon sx={{ fontSize: 12 }} />
            </IconButton>
            {form.profilePhoto && (
              <IconButton
                size="small"
                onClick={handleRemovePhoto}
                sx={{
                  position: "absolute",
                  bottom: 0,
                  right: -4,
                  bgcolor: "#505050",
                  color: "#fff",
                  width: 20,
                  height: 20,
                  "&:hover": { bgcolor: "#2E2E2E" },
                }}
              >
                <DeleteOutlineIcon sx={{ fontSize: 12 }} />
              </IconButton>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handlePhotoChange}
            />
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
            New User Information
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <FieldGrid>
            <TextField
              fullWidth
              label="First Name"
              placeholder="Type Here..."
              value={form.firstName}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  firstName: capitalizeFirst(e.target.value),
                }))
              }
              sx={inputSx}
              InputLabelProps={{ shrink: true }}
            />
          </FieldGrid>

          <FieldGrid>
            <TextField
              fullWidth
              label="Last Name"
              placeholder="Type Here..."
              value={form.lastName}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  lastName: capitalizeFirst(e.target.value),
                }))
              }
              sx={inputSx}
              InputLabelProps={{ shrink: true }}
            />
          </FieldGrid>

          <FieldGrid>
            <SelectField
              label="Gender"
              value={form.gender}
              onChange={(v) => setForm((prev) => ({ ...prev, gender: v }))}
              options={[
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
                { value: "Other", label: "Other" },
              ]}
            />
          </FieldGrid>

          <FieldGrid>
            <DateField
              label="Date Of Joining"
              value={form.dateOfJoining}
              onChange={(v) =>
                setForm((prev) => ({ ...prev, dateOfJoining: v }))
              }
            />
          </FieldGrid>

          <FieldGrid>
            <DateField
              label="Date Of Birth"
              value={form.dateOfBirth}
              onChange={(v) => setForm((prev) => ({ ...prev, dateOfBirth: v }))}
            />
          </FieldGrid>

          <FieldGrid>
            <SelectField
              label="User Role"
              value={form.userRole}
              onChange={(v) => setForm((prev) => ({ ...prev, userRole: v }))}
              options={[
                { value: "Admin", label: "Admin" },
                { value: "Staff", label: "Staff" },
                { value: "Viewer", label: "Viewer" },
              ]}
            />
          </FieldGrid>

          <FieldGrid>
            <TextField
              fullWidth
              label="User Name"
              placeholder="Type Here..."
              value={form.userName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, userName: e.target.value }))
              }
              sx={inputSx}
              InputLabelProps={{ shrink: true }}
            />
          </FieldGrid>

          <FieldGrid>
            <TextField
              fullWidth
              label="Mobile Number"
              placeholder="Type Here..."
              value={form.mobileNo}
              onChange={(e) => {
                if (/\D/.test(e.target.value)) {
                  toast.error("Enter only digits", {
                    toastId: "user-mobile-only-digits",
                  });
                }
                const onlyDigits = e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 10);
                setForm((prev) => ({ ...prev, mobileNo: onlyDigits }));
              }}
              sx={inputSx}
              InputLabelProps={{ shrink: true }}
            />
          </FieldGrid>

          <FieldGrid>
            <TextField
              fullWidth
              label="Email"
              placeholder="Type Here..."
              value={form.emailId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  emailId: e.target.value.toLowerCase(),
                }))
              }
              sx={inputSx}
              InputLabelProps={{ shrink: true }}
            />
          </FieldGrid>

          <FieldGrid>
            <PasswordField
              label="Password"
              value={form.password}
              onChange={(v) => setForm((prev) => ({ ...prev, password: v }))}
              show={showPassword}
              onToggle={() => setShowPassword((prev) => !prev)}
            />
          </FieldGrid>

          <FieldGrid>
            <PasswordField
              label="Confirm Password"
              value={form.confirmPassword}
              onChange={(v) =>
                setForm((prev) => ({ ...prev, confirmPassword: v }))
              }
              show={showConfirm}
              onToggle={() => setShowConfirm((prev) => !prev)}
            />
          </FieldGrid>
        </Grid>

        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}
        >
          <Button
            variant="outlined"
            onClick={onCancel}
            sx={{
              borderColor: "#BDBDBD",
              color: "#505050",
              textTransform: "none",
              fontSize: 13,
              borderRadius: "6px",
              px: 3,
              "&:hover": { borderColor: "#505050", bgcolor: "transparent" },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAndNext}
            sx={{
              bgcolor: "#505050",
              color: "#ffffff",
              textTransform: "none",
              fontSize: 13,
              borderRadius: "6px",
              px: 3,
              "&:hover": { bgcolor: "#232323" },
            }}
          >
            Save &amp; Next
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default UserDetailsForm;
