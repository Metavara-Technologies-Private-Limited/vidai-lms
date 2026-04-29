import React, { useEffect, useRef, useState } from "react";
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
import { getAvatarLetter } from "../../../../utils/avatar";

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
  profilePhotoFile: File | null;
  removeProfilePhoto: boolean;
}

interface Props {
  mode?: "create" | "edit";
  initialData?: UserFormData | null;
  roleOptions?: { value: string; label: string }[];
  requireRole?: boolean;
  disableRoleSelection?: boolean;
  onSave: (data: UserFormData) => Promise<void> | void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// Utility function to log photo loading issues for debugging
const logPhotoDebug = (
  photoUrl: string | null | undefined,
  status: "loading" | "loaded" | "failed",
) => {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] Photo ${status}: ${photoUrl || "null"}`;

  if (status === "failed") {
    console.error(message);
  } else {
    console.log(message);
  }
};

// Utility to add cache-busting param for remote URLs
const getCacheBustedUrl = (
  url: string | null | undefined,
): string | undefined => {
  if (!url) return undefined;
  // Don't add cache-busting to data URLs or blob URLs
  if (url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  // Add cache-busting timestamp to remote URLs
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}t=${Date.now()}`;
};

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
  profilePhotoFile: null,
  removeProfilePhoto: false,
};

const MAX_PROFILE_PHOTO_SIZE = 20 * 1024 * 1024;

const FieldGrid = ({ children }: { children: React.ReactNode }) => (
  <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 3 }}>{children}</Grid>
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
      renderValue={(selected) => {
        const selectedValue = String(selected ?? "").trim();
        if (!selectedValue) {
          return <span style={{ color: "#9E9E9E" }}>Select</span>;
        }

        const selectedOption = options.find(
          (option) => String(option.value).trim() === selectedValue,
        );

        return selectedOption?.label ?? selectedValue;
      }}
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
    format="DD/MM/YYYY"
    slotProps={{
      textField: {
        fullWidth: true,
        InputLabelProps: { shrink: true },
        InputProps: {
          sx: {
            height: 40,
            display: "flex",
            alignItems: "center",

            "& input": {
              padding: "10px 12px",
              fontSize: "13px",
            },

            "& .MuiInputAdornment-root": {
              height: "100%",
              display: "flex",
              alignItems: "center",
            },

            "& .MuiIconButton-root": {
              padding: "6px",
            },
          },
        },
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
  onCancel,
  isSubmitting = false,
}) => {
  const [form, setForm] = useState<UserFormData>(defaultForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = () => {
      if (initialData) {
        setForm(initialData);
        setPhotoLoadFailed(false);
        logPhotoDebug(initialData.profilePhoto, "loading");
      }
    };
    loadData();
  }, [initialData]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_PROFILE_PHOTO_SIZE) {
      toast.error("Profile photo must be 20MB or smaller");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setForm((prev) => ({
        ...prev,
        profilePhoto: result,
        profilePhotoFile: file,
        removeProfilePhoto: false,
      }));
      setPhotoLoadFailed(false);
      toast.success("Profile photo added successfully");
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setForm((prev) => ({
      ...prev,
      profilePhoto: null,
      profilePhotoFile: null,
      removeProfilePhoto: true,
    }));
    setPhotoLoadFailed(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.success("Profile photo removed successfully");
  };

  const validateForm = (): boolean => {
    if (!form.firstName.trim()) {
      toast.error("First Name is required");
      return false;
    }

    if (!form.lastName.trim()) {
      toast.error("Last Name is required");
      return false;
    }

    if (!form.userName.trim()) {
      toast.error("User Name is required");
      return false;
    }

    if (!form.emailId.trim()) {
      toast.error("Email is required");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailId.trim())) {
      toast.error("Enter a valid email address");
      return false;
    }

    if (mode === "create" && !form.password.trim()) {
      toast.error("Password is required");
      return false;
    }

    if (mode === "create" && !form.confirmPassword.trim()) {
      toast.error("Confirm Password is required");
      return false;
    }

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


  // Required label helper for plain string labels
  const getRequiredLabel = (label: string) => `${label} *`;

  return (

    
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 3,
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ position: "relative", width: 64, height: 64 }}>
            {form.profilePhoto && !photoLoadFailed && (
              <Box
                component="img"
                src={getCacheBustedUrl(form.profilePhoto)}
                onError={() => {
                  logPhotoDebug(form.profilePhoto, "failed");
                  setPhotoLoadFailed(true);
                }}
                onLoad={() => {
                  logPhotoDebug(form.profilePhoto, "loaded");
                }}
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  objectFit: "cover",
                  backgroundColor: "#EEEEEE",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  zIndex: 1,
                }}
                alt="User profile"
              />
            )}
            <Avatar
              src={
                form.profilePhoto && !photoLoadFailed
                  ? form.profilePhoto
                  : undefined
              }
              sx={{
                width: 64,
                height: 64,
                bgcolor: "#EEEEEE",
                color: "#616161",
                fontWeight: 700,
                position: "relative",
                zIndex: form.profilePhoto && !photoLoadFailed ? 0 : 1,
              }}
            >
              {getAvatarLetter(form.firstName, form.userName)}
            </Avatar>
            <IconButton
              size="small"
              onClick={() => fileInputRef.current?.click()}
              sx={{
                position: "absolute",
                bottom: 0,
                right: form.profilePhoto && !photoLoadFailed ? 22 : -4,
                bgcolor: "#D32F2F",
                color: "#fff",
                width: 20,
                height: 20,
                "&:hover": { bgcolor: "#B71C1C" },
                zIndex: 2,
              }}
            >
              <EditIcon sx={{ fontSize: 12 }} />
            </IconButton>
            {form.profilePhoto && !photoLoadFailed && (
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
            {form.profilePhoto && photoLoadFailed && (
              <IconButton
                size="small"
                onClick={() => {
                  setPhotoLoadFailed(false);
                  toast.info("Retrying to load photo...");
                }}
                title="Photo failed to load. Click to retry."
                sx={{
                  position: "absolute",
                  bottom: 0,
                  right: -4,
                  bgcolor: "#FF9800",
                  color: "#fff",
                  width: 20,
                  height: 20,
                  fontSize: 10,
                  "&:hover": { bgcolor: "#F57C00" },
                  zIndex: 2,
                }}
              >
                ⟲
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
              label={getRequiredLabel("First Name")}
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
              label={getRequiredLabel("Last Name")}
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
              label={requireRole ? getRequiredLabel("User Role") : "User Role"}
              value={form.userRole}
              onChange={(v) => setForm((prev) => ({ ...prev, userRole: v }))}
              options={roleOptions}
              disabled={disableRoleSelection}
            />
          </FieldGrid>

          <FieldGrid>
            <TextField
              fullWidth
              label={getRequiredLabel("User Name")}
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
              label={getRequiredLabel("Mobile Number")}
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
              label={getRequiredLabel("Email")}
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
              label={getRequiredLabel("Password")}
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
              label={getRequiredLabel("Confirm Password")}
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
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            mt: 4,
            flexWrap: "wrap",
          }}
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
              minWidth: { xs: "100%", sm: 140 },
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
              minWidth: { xs: "100%", sm: 180 },
              "&:hover": { bgcolor: "#232323" },
            }}
          >
            {mode === "edit" ? "Update User" : "Create New User"}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default UserDetailsForm;
