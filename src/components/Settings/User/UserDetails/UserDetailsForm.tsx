import React, { useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import type { Dayjs } from "dayjs";

export type UserType = "employee" | "doctor";

export interface EmployeeFormData {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: Dayjs | null;
  designation: string;
  dateOfJoining: Dayjs | null;
  emailId: string;
  userRole: string;
  userName: string;
  password: string;
  confirmPassword: string;
  profilePhoto: string | null;
}

export interface DoctorFormData {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: Dayjs | null;
  specialization: string;
  doctorType: string;
  doctorCategory: string;
  marketingExecutive: string;
  userName: string;
  mobileNo: string;
  emailId: string;
  dateOfJoining: Dayjs | null;
  password: string;
  confirmPassword: string;
  profilePhoto: string | null;
}

interface Props {
  onNext: (userType: UserType, data: EmployeeFormData | DoctorFormData) => void;
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

const defaultEmployee: EmployeeFormData = {
  firstName: "", lastName: "", gender: "", dateOfBirth: null,
  designation: "", dateOfJoining: null, emailId: "", userRole: "",
  userName: "", password: "", confirmPassword: "", profilePhoto: null,
};

const defaultDoctor: DoctorFormData = {
  firstName: "", lastName: "", gender: "", dateOfBirth: null,
  specialization: "", doctorType: "", doctorCategory: "",
  marketingExecutive: "", userName: "", mobileNo: "", emailId: "",
  dateOfJoining: null, password: "", confirmPassword: "", profilePhoto: null,
};

const FieldGrid = ({ children }: { children: React.ReactNode }) => (
  <Grid size={{ xs: 12, sm: 3 }}>{children}</Grid>
);

const SelectField = ({
  label, value, onChange, options,
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
        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
      ))}
    </Select>
  </FormControl>
);

const DateField = ({
  label, value, onChange,
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
  label, value, onChange, show, onToggle,
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
            {show
              ? <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
              : <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </InputAdornment>
      ),
    }}
  />
);

const UserDetailsForm: React.FC<Props> = ({ onNext, onCancel }) => {
  const [userType, setUserType] = useState<UserType>("employee");
  const [emp, setEmp] = useState<EmployeeFormData>(defaultEmployee);
  const [doc, setDoc] = useState<DoctorFormData>(defaultDoctor);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photo = userType === "employee" ? emp.profilePhoto : doc.profilePhoto;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (userType === "employee") setEmp((p) => ({ ...p, profilePhoto: result }));
      else setDoc((p) => ({ ...p, profilePhoto: result }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <RadioGroup row value={userType} onChange={(e) => setUserType(e.target.value as UserType)}>
            {(["employee", "doctor"] as UserType[]).map((t) => (
              <FormControlLabel
                key={t}
                value={t}
                control={<Radio size="small" sx={{ color: "#BDBDBD", "&.Mui-checked": { color: "#D32F2F" } }} />}
                label={<Typography sx={{ fontSize: 13, fontWeight: 500, textTransform: "capitalize" }}>{t}</Typography>}
              />
            ))}
          </RadioGroup>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 2 }}>
          <Box sx={{ position: "relative", width: 64, height: 64 }}>
            <Avatar src={photo ?? undefined} sx={{ width: 64, height: 64, bgcolor: "#EEEEEE" }} />
            <IconButton
              size="small"
              onClick={() => fileInputRef.current?.click()}
              sx={{
                position: "absolute", bottom: 0, right: -4,
                bgcolor: "#D32F2F", color: "#fff", width: 20, height: 20,
                "&:hover": { bgcolor: "#B71C1C" },
              }}
            >
              <EditIcon sx={{ fontSize: 12 }} />
            </IconButton>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>New User Information</Typography>
        </Box>

        {userType === "employee" && (
          <Grid container spacing={2}>
            <FieldGrid>
              <TextField fullWidth label="First Name *" placeholder="Type Here..." value={emp.firstName}
                onChange={(e) => setEmp((p) => ({ ...p, firstName: e.target.value }))}
                sx={inputSx} InputLabelProps={{ shrink: true }} />
            </FieldGrid>
            <FieldGrid>
              <TextField fullWidth label="Last Name *" placeholder="Type Here..." value={emp.lastName}
                onChange={(e) => setEmp((p) => ({ ...p, lastName: e.target.value }))}
                sx={inputSx} InputLabelProps={{ shrink: true }} />
            </FieldGrid>
            <FieldGrid>
              <SelectField label="Gender" value={emp.gender}
                onChange={(v) => setEmp((p) => ({ ...p, gender: v }))}
                options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }]} />
            </FieldGrid>
            <FieldGrid>
              <DateField label="Date Of Birth" value={emp.dateOfBirth}
                onChange={(v) => setEmp((p) => ({ ...p, dateOfBirth: v }))} />
            </FieldGrid>
            <FieldGrid>
              <SelectField label="Designation" value={emp.designation}
                onChange={(v) => setEmp((p) => ({ ...p, designation: v }))}
                options={[{ value: "Manager", label: "Manager" }, { value: "Executive", label: "Executive" }, { value: "Consultant", label: "Consultant" }]} />
            </FieldGrid>
            <FieldGrid>
              <DateField label="Date Of Joining" value={emp.dateOfJoining}
                onChange={(v) => setEmp((p) => ({ ...p, dateOfJoining: v }))} />
            </FieldGrid>
            <FieldGrid>
              <TextField fullWidth label="Email ID *" placeholder="Type Here..." value={emp.emailId}
                onChange={(e) => setEmp((p) => ({ ...p, emailId: e.target.value }))}
                sx={inputSx} InputLabelProps={{ shrink: true }} />
            </FieldGrid>
            <FieldGrid>
              <SelectField label="User Role" value={emp.userRole}
                onChange={(v) => setEmp((p) => ({ ...p, userRole: v }))}
                options={[{ value: "Admin", label: "Admin" }, { value: "Staff", label: "Staff" }, { value: "Viewer", label: "Viewer" }]} />
            </FieldGrid>
            <FieldGrid>
              <TextField fullWidth label="User Name *" placeholder="Type Here..." value={emp.userName}
                onChange={(e) => setEmp((p) => ({ ...p, userName: e.target.value }))}
                sx={inputSx} InputLabelProps={{ shrink: true }} />
            </FieldGrid>
            <FieldGrid>
              <PasswordField label="Password *" value={emp.password}
                onChange={(v) => setEmp((p) => ({ ...p, password: v }))}
                show={showPassword} onToggle={() => setShowPassword((x) => !x)} />
            </FieldGrid>
            <FieldGrid>
              <PasswordField label="Confirm Password *" value={emp.confirmPassword}
                onChange={(v) => setEmp((p) => ({ ...p, confirmPassword: v }))}
                show={showConfirm} onToggle={() => setShowConfirm((x) => !x)} />
            </FieldGrid>
          </Grid>
        )}

        {userType === "doctor" && (
          <Grid container spacing={2}>
            <FieldGrid>
              <TextField fullWidth label="First Name *" placeholder="Type Here..." value={doc.firstName}
                onChange={(e) => setDoc((p) => ({ ...p, firstName: e.target.value }))}
                sx={inputSx} InputLabelProps={{ shrink: true }} />
            </FieldGrid>
            <FieldGrid>
              <TextField fullWidth label="Last Name *" placeholder="Type Here..." value={doc.lastName}
                onChange={(e) => setDoc((p) => ({ ...p, lastName: e.target.value }))}
                sx={inputSx} InputLabelProps={{ shrink: true }} />
            </FieldGrid>
            <FieldGrid>
              <SelectField label="Gender" value={doc.gender}
                onChange={(v) => setDoc((p) => ({ ...p, gender: v }))}
                options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }]} />
            </FieldGrid>
            <FieldGrid>
              <DateField label="Date Of Birth" value={doc.dateOfBirth}
                onChange={(v) => setDoc((p) => ({ ...p, dateOfBirth: v }))} />
            </FieldGrid>
            <FieldGrid>
              <SelectField label="Specialization *" value={doc.specialization}
                onChange={(v) => setDoc((p) => ({ ...p, specialization: v }))}
                options={[{ value: "Gynecology", label: "Gynecology" }, { value: "Urology", label: "Urology" }, { value: "Endocrinology", label: "Endocrinology" }]} />
            </FieldGrid>
            <FieldGrid>
              <SelectField label="Doctor Type" value={doc.doctorType}
                onChange={(v) => setDoc((p) => ({ ...p, doctorType: v }))}
                options={[{ value: "Consultant", label: "Consultant" }, { value: "Resident", label: "Resident" }]} />
            </FieldGrid>
            <FieldGrid>
              <SelectField label="Doctor Category" value={doc.doctorCategory}
                onChange={(v) => setDoc((p) => ({ ...p, doctorCategory: v }))}
                options={[{ value: "Senior", label: "Senior" }, { value: "Junior", label: "Junior" }]} />
            </FieldGrid>
            <FieldGrid>
              <SelectField label="Marketing Executives" value={doc.marketingExecutive}
                onChange={(v) => setDoc((p) => ({ ...p, marketingExecutive: v }))}
                options={[{ value: "Exec1", label: "Executive 1" }, { value: "Exec2", label: "Executive 2" }]} />
            </FieldGrid>
            <FieldGrid>
              <TextField fullWidth label="User Name *" placeholder="Type Here..." value={doc.userName}
                onChange={(e) => setDoc((p) => ({ ...p, userName: e.target.value }))}
                sx={inputSx} InputLabelProps={{ shrink: true }} />
            </FieldGrid>
            <FieldGrid>
              <TextField fullWidth label="Mobile No *" placeholder="Type Here..." value={doc.mobileNo}
                onChange={(e) => setDoc((p) => ({ ...p, mobileNo: e.target.value }))}
                sx={inputSx} InputLabelProps={{ shrink: true }} />
            </FieldGrid>
            <FieldGrid>
              <TextField fullWidth label="Email ID *" placeholder="Type Here..." value={doc.emailId}
                onChange={(e) => setDoc((p) => ({ ...p, emailId: e.target.value }))}
                sx={inputSx} InputLabelProps={{ shrink: true }} />
            </FieldGrid>
            <FieldGrid>
              <DateField label="Date Of Joining" value={doc.dateOfJoining}
                onChange={(v) => setDoc((p) => ({ ...p, dateOfJoining: v }))} />
            </FieldGrid>
            <FieldGrid>
              <PasswordField label="Password *" value={doc.password}
                onChange={(v) => setDoc((p) => ({ ...p, password: v }))}
                show={showPassword} onToggle={() => setShowPassword((x) => !x)} />
            </FieldGrid>
            <FieldGrid>
              <PasswordField label="Confirm Password *" value={doc.confirmPassword}
                onChange={(v) => setDoc((p) => ({ ...p, confirmPassword: v }))}
                show={showConfirm} onToggle={() => setShowConfirm((x) => !x)} />
            </FieldGrid>
          </Grid>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            sx={{
              borderColor: "#BDBDBD", color: "#505050", textTransform: "none",
              fontSize: 13, borderRadius: "6px", px: 3,
              "&:hover": { borderColor: "#505050", bgcolor: "transparent" },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => onNext(userType, userType === "employee" ? emp : doc)}
            sx={{
              bgcolor: "#232323", color: "#fff", textTransform: "none",
              fontSize: 13, borderRadius: "6px", px: 3,
              "&:hover": { bgcolor: "#111" },
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
