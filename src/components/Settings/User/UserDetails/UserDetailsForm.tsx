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
  mode?: "create" | "edit";
  initialData?: UserFormData | null;
  roleOptions?: { value: string; label: string }[];
  requireRole?: boolean;
  disableRoleSelection?: boolean;
  onSave: (data: UserFormData) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  onCancel: () => void;
  isSubmitting?: boolean;
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
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) => (
  <FormControl fullWidth sx={inputSx}>
    <InputLabel shrink>{label}</InputLabel>
    <Select
      notched
      label={label}
      displayEmpty
      value={value}
      disabled={disabled}
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
  onFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  onFocus?: () => void;
}) => (
  <TextField
    fullWidth
    label={label}
    placeholder="Type Here..."
    type={show ? "text" : "password"}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onFocus={onFocus}
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

const EDIT_PASSWORD_PLACEHOLDER = "********";

const UserDetailsForm: React.FC<Props> = ({
  mode = "create",
  initialData = null,
  roleOptions = [],
  requireRole = true,
  disableRoleSelection = false,
  onSave,
  onDelete,
  onCancel,
  isSubmitting = false,
}) => {
  const [form, setForm] = useState<UserFormData>(initialData ?? defaultForm);
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
    if (requireRole && !form.userRole.trim()) {
      toast.error("User Role is required", {
        toastId: "user-role-required",
      });
      return false;
    }

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

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      await onSave(form);

      toast.success(
        mode === "edit"
          ? "User details updated successfully"
          : "User created successfully",
      );
    } catch {
      // Error toast is handled by page-level integration.
    }
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
            {mode === "edit" ? "Edit User Information" : "New User Information"}
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
              options={roleOptions}
              disabled={disableRoleSelection}
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
              onFocus={() => {
                if (
                  mode === "edit" &&
                  form.password === EDIT_PASSWORD_PLACEHOLDER
                ) {
                  setForm((prev) => ({ ...prev, password: "" }));
                }
              }}
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
              onFocus={() => {
                if (
                  mode === "edit" &&
                  form.confirmPassword === EDIT_PASSWORD_PLACEHOLDER
                ) {
                  setForm((prev) => ({ ...prev, confirmPassword: "" }));
                }
              }}
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
            disabled={isSubmitting}
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
            onClick={handleSave}
            disabled={isSubmitting}
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
            {mode === "edit" ? "Update User" : "Create New User"}
          </Button>
          {mode === "edit" && onDelete && (
            <Button
              variant="contained"
              onClick={() => void onDelete()}
              disabled={isSubmitting}
              sx={{
                bgcolor: "#505050",
                color: "#ffffff",
                textTransform: "none",
                fontSize: 13,
                borderRadius: "6px",
                px: 3,
                "&:hover": { bgcolor: "#D32F2F" },
              }}
            >
              Delete
            </Button>
          )}
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default UserDetailsForm;
