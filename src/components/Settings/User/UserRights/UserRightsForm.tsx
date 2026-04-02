import React, { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  IconButton,
  InputBase,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import SearchIcon from "@mui/icons-material/Search";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModuleAccess {
  admin: boolean;
  clinical: boolean;
  lab: boolean;
  ai: boolean;
}

interface PermissionRow {
  module: string;
  genderMale: boolean;
  genderFemale: boolean;
  all: boolean;
  add: boolean;
  edit: boolean;
  view: boolean;
  print: boolean;
}

interface RoleEntry {
  name: string;
  count: number;
  users: string[];
  expanded: boolean;
  permissions: PermissionRow[];
}

interface Props {
  onCancel: () => void;
  onSave: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defaultPermissions = (): PermissionRow[] => [
  {
    module: "Clinical",
    genderMale: true,
    genderFemale: true,
    all: true,
    add: true,
    edit: true,
    view: true,
    print: true,
  },
  {
    module: "Andrology",
    genderMale: true,
    genderFemale: false,
    all: true,
    add: true,
    edit: true,
    view: true,
    print: true,
  },
  {
    module: "Embryology",
    genderMale: true,
    genderFemale: false,
    all: true,
    add: true,
    edit: true,
    view: true,
    print: true,
  },
  {
    module: "Billing",
    genderMale: false,
    genderFemale: true,
    all: false,
    add: false,
    edit: false,
    view: true,
    print: false,
  },
  {
    module: "Menstrual History",
    genderMale: false,
    genderFemale: false,
    all: false,
    add: false,
    edit: false,
    view: true,
    print: false,
  },
];

const initialRoles: RoleEntry[] = [
  {
    name: "Doctor",
    count: 58,
    users: ["Doctor 1", "Doctor 2", "Doctor 3"],
    expanded: true,
    permissions: defaultPermissions(),
  },
  {
    name: "Nurse",
    count: 58,
    users: ["Nurse 1"],
    expanded: false,
    permissions: defaultPermissions(),
  },
  {
    name: "Embryologist",
    count: 58,
    users: ["Embryologist 1", "Embryologist 2"],
    expanded: false,
    permissions: defaultPermissions(),
  },
  {
    name: "Andrologist",
    count: 58,
    users: ["Andrologist 1", "Andrologist 2"],
    expanded: false,
    permissions: defaultPermissions(),
  },
  {
    name: "Billing",
    count: 58,
    users: [],
    expanded: false,
    permissions: defaultPermissions(),
  },
  {
    name: "Inventory",
    count: 58,
    users: ["Inv 1", "Inv 2", "Inv 3", "Inv 4"],
    expanded: false,
    permissions: defaultPermissions(),
  },
];

// ─── Legend dot ───────────────────────────────────────────────────────────────
const Dot = ({ color }: { color: string }) => (
  <Box
    sx={{
      width: 10,
      height: 10,
      borderRadius: "50%",
      bgcolor: color,
      display: "inline-block",
      mr: 0.5,
    }}
  />
);

// ─── Checkbox cell ────────────────────────────────────────────────────────────
const CB = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <Checkbox
    size="small"
    checked={checked}
    onChange={(e) => onChange(e.target.checked)}
    sx={{
      p: 0,
      color: "#BDBDBD",
      "&.Mui-checked": { color: "#4CAF50" },
      "& .MuiSvgIcon-root": { fontSize: 16 },
    }}
  />
);

// ─── Component ────────────────────────────────────────────────────────────────

const UserRightsForm: React.FC<Props> = ({ onCancel, onSave }) => {
  const [roles, setRoles] = useState<RoleEntry[]>(initialRoles);
  const [selectedRoleIdx, setSelectedRoleIdx] = useState<number>(0);
  const [moduleAccess, setModuleAccess] = useState<ModuleAccess>({
    admin: false,
    clinical: true,
    lab: false,
    ai: false,
  });
  const [search, setSearch] = useState("");
  const [clinic, setClinic] = useState("Clinic");

  const selectedRole = roles[selectedRoleIdx];

  // Toggle role expanded / select
  const handleRoleClick = (idx: number) => {
    setSelectedRoleIdx(idx);
    setRoles((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, expanded: !r.expanded } : r)),
    );
  };

  // Remove a user from the role
  const removeUser = (roleIdx: number, userIdx: number) => {
    setRoles((prev) =>
      prev.map((r, i) =>
        i === roleIdx
          ? { ...r, users: r.users.filter((_, ui) => ui !== userIdx) }
          : r,
      ),
    );
  };

  // Toggle permission field
  const togglePerm = (
    roleIdx: number,
    rowIdx: number,
    field: keyof PermissionRow,
  ) => {
    if (field === "module") return;
    setRoles((prev) =>
      prev.map((r, ri) => {
        if (ri !== roleIdx) return r;
        return {
          ...r,
          permissions: r.permissions.map((row, pi) =>
            pi === rowIdx ? { ...row, [field]: !row[field] } : row,
          ),
        };
      }),
    );
  };

  // Remove a module row
  const removePermRow = (roleIdx: number, rowIdx: number) => {
    setRoles((prev) =>
      prev.map((r, ri) =>
        ri !== roleIdx
          ? r
          : {
              ...r,
              permissions: r.permissions.filter((_, pi) => pi !== rowIdx),
            },
      ),
    );
  };

  const permColumns: { label: string; field: keyof PermissionRow }[] = [
    { label: "All", field: "all" },
    { label: "Add", field: "add" },
    { label: "Edit", field: "edit" },
    { label: "View", field: "view" },
    { label: "Print", field: "print" },
  ];

  return (
    <Box sx={{ display: "flex", gap: 2, height: "100%" }}>
      {/* ── Left panel ── */}
      <Box
        sx={{
          width: 220,
          flexShrink: 0,
          border: "1px solid #E0E0E0",
          borderRadius: "8px",
          p: 1.5,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {/* Clinic filter + search */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 70 }}>
            <Select
              value={clinic}
              onChange={(e) => setClinic(e.target.value)}
              variant="standard"
              disableUnderline
              sx={{ fontSize: 12, fontWeight: 500 }}
            >
              <MenuItem value="Clinic">Clinic</MenuItem>
            </Select>
          </FormControl>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flex: 1,
              border: "1px solid #E0E0E0",
              borderRadius: "6px",
              px: 1,
              height: 30,
            }}
          >
            <SearchIcon sx={{ fontSize: 14, color: "#9E9E9E", mr: 0.5 }} />
            <InputBase
              placeholder="Search by User"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ fontSize: 11, flex: 1 }}
            />
          </Box>
        </Box>

        <Typography sx={{ fontSize: 12, fontWeight: 600, mt: 0.5 }}>
          User Roles
        </Typography>

        {/* Role list */}
        {roles.map((role, ri) => (
          <Box key={role.name}>
            {/* Role row */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                py: 0.4,
                px: 0.5,
                borderRadius: "4px",
                "&:hover": { bgcolor: "#F5F5F5" },
              }}
              onClick={() => handleRoleClick(ri)}
            >
              <Checkbox
                size="small"
                sx={{ p: 0, mr: 0.5, "& .MuiSvgIcon-root": { fontSize: 15 } }}
                checked={selectedRoleIdx === ri}
                onClick={(e) => e.stopPropagation()}
                onChange={() => setSelectedRoleIdx(ri)}
              />
              <Typography sx={{ fontSize: 12, flex: 1 }}>
                {role.name}{" "}
                <span style={{ color: "#9E9E9E", fontSize: 11 }}>
                  ({role.count})
                </span>
              </Typography>
              <Chip
                label={role.users.length}
                size="small"
                sx={{ height: 18, fontSize: 10, mr: 0.5, bgcolor: "#F5F5F5" }}
              />
              <IconButton
                size="small"
                sx={{ p: 0, color: "#505050" }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRoleClick(ri);
                }}
              >
                {role.expanded ? (
                  <RemoveIcon sx={{ fontSize: 14 }} />
                ) : (
                  <AddIcon sx={{ fontSize: 14 }} />
                )}
              </IconButton>
            </Box>

            {/* Expanded users */}
            {role.expanded &&
              role.users.map((user, ui) => (
                <Box
                  key={ui}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    pl: 3,
                    py: 0.3,
                    "&:hover": { bgcolor: "#FAFAFA" },
                  }}
                >
                  <Typography sx={{ fontSize: 11, flex: 1, color: "#505050" }}>
                    {user}
                  </Typography>
                  <IconButton
                    size="small"
                    sx={{ p: 0 }}
                    onClick={() => removeUser(ri, ui)}
                  >
                    <CancelOutlinedIcon
                      sx={{ fontSize: 14, color: "#E57373" }}
                    />
                  </IconButton>
                </Box>
              ))}
          </Box>
        ))}
      </Box>

      {/* ── Right panel ── */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Page Access section */}
        <Box sx={{ border: "1px solid #E0E0E0", borderRadius: "8px", p: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1.5 }}>
            Page Access :
          </Typography>

          {/* Module / Category / Subcategory / Type / Subtype row */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            {/* Module */}
            <Box>
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#D32F2F",
                  borderBottom: "2px solid #D32F2F",
                  pb: 0.3,
                  mb: 1,
                }}
              >
                Module
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CB
                  checked={moduleAccess.admin}
                  onChange={(v) => setModuleAccess((p) => ({ ...p, admin: v }))}
                />
                <Typography sx={{ fontSize: 12 }}>Admin</Typography>
              </Box>
            </Box>

            {/* Category */}
            <Box>
              <Typography
                sx={{ fontSize: 11, fontWeight: 600, color: "#505050", mb: 1 }}
              >
                Category
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CB
                  checked={moduleAccess.clinical}
                  onChange={(v) =>
                    setModuleAccess((p) => ({ ...p, clinical: v }))
                  }
                />
                <Typography sx={{ fontSize: 12 }}>Clinical</Typography>
              </Box>
            </Box>

            {/* Subcategory */}
            <Box>
              <Typography
                sx={{ fontSize: 11, fontWeight: 600, color: "#505050", mb: 1 }}
              >
                Subcategory
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CB
                  checked={moduleAccess.lab}
                  onChange={(v) => setModuleAccess((p) => ({ ...p, lab: v }))}
                />
                <Typography sx={{ fontSize: 12 }}>Lab</Typography>
              </Box>
            </Box>

            {/* Type */}
            <Box>
              <Typography
                sx={{ fontSize: 11, fontWeight: 600, color: "#505050", mb: 1 }}
              >
                Type
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CB
                  checked={moduleAccess.ai}
                  onChange={(v) => setModuleAccess((p) => ({ ...p, ai: v }))}
                />
                <Typography sx={{ fontSize: 12 }}>AI</Typography>
              </Box>
            </Box>

            {/* Subtype placeholder */}
            <Box>
              <Typography
                sx={{ fontSize: 11, fontWeight: 600, color: "#505050", mb: 1 }}
              >
                Subtype
              </Typography>
            </Box>
          </Box>

          {/* Next / Add row */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1,
              mt: 1.5,
            }}
          >
            <Button
              variant="outlined"
              size="small"
              sx={{
                textTransform: "none",
                fontSize: 12,
                borderRadius: "6px",
                borderColor: "#BDBDBD",
                color: "#505050",
              }}
            >
              Next
            </Button>
            <Button
              variant="outlined"
              size="small"
              sx={{
                textTransform: "none",
                fontSize: 12,
                borderRadius: "6px",
                borderColor: "#BDBDBD",
                color: "#505050",
              }}
            >
              Add
            </Button>
          </Box>
        </Box>

        {/* Permissions table for selected role */}
        <Box sx={{ border: "1px solid #E0E0E0", borderRadius: "8px", p: 2 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1.5 }}>
            {selectedRole?.name ?? "Role"}
          </Typography>

          {/* Table header */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "160px 90px 50px 50px 50px 50px 50px",
              alignItems: "center",
              mb: 0.5,
              px: 0.5,
            }}
          >
            <Box />
            <Typography
              sx={{ fontSize: 11, fontWeight: 600, color: "#505050" }}
            >
              Gender
            </Typography>
            {permColumns.map((c) => (
              <Typography
                key={c.field}
                sx={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#505050",
                  textAlign: "center",
                }}
              >
                {c.label}
              </Typography>
            ))}
          </Box>

          {/* Table rows */}
          {selectedRole?.permissions.map((row, pi) => (
            <Box
              key={pi}
              sx={{
                display: "grid",
                gridTemplateColumns: "160px 90px 50px 50px 50px 50px 50px",
                alignItems: "center",
                py: 0.5,
                px: 0.5,
                borderTop: "1px solid #F5F5F5",
              }}
            >
              {/* Module chip */}
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Chip
                  label={row.module}
                  size="small"
                  deleteIcon={<CancelOutlinedIcon sx={{ fontSize: 14 }} />}
                  onDelete={() => removePermRow(selectedRoleIdx, pi)}
                  sx={{
                    fontSize: 11,
                    height: 24,
                    bgcolor: "#FFF",
                    border: "1px solid #E0E0E0",
                    borderRadius: "6px",
                  }}
                />
              </Box>

              {/* Gender checkboxes */}
              <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                <CB
                  checked={row.genderMale}
                  onChange={() => togglePerm(selectedRoleIdx, pi, "genderMale")}
                />
                <Typography sx={{ fontSize: 11 }}>Male</Typography>
                <CB
                  checked={row.genderFemale}
                  onChange={() =>
                    togglePerm(selectedRoleIdx, pi, "genderFemale")
                  }
                />
                <Typography sx={{ fontSize: 11 }}>Female</Typography>
              </Box>

              {/* Permission checkboxes */}
              {permColumns.map((c) => (
                <Box
                  key={c.field}
                  sx={{ display: "flex", justifyContent: "center" }}
                >
                  <CB
                    checked={row[c.field] as boolean}
                    onChange={() => togglePerm(selectedRoleIdx, pi, c.field)}
                  />
                </Box>
              ))}
            </Box>
          ))}
        </Box>

        {/* Footer */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            mt: "auto",
          }}
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
            onClick={onSave}
            sx={{
              bgcolor: "#232323",
              color: "#fff",
              textTransform: "none",
              fontSize: 13,
              borderRadius: "6px",
              px: 3,
              "&:hover": { bgcolor: "#111" },
            }}
          >
            Save & Grant Access
          </Button>
        </Box>

        {/* Legend */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
            justifyContent: "center",
            mt: 1,
          }}
        >
          {[
            { label: "Exceptional User", color: "#E57373" },
            { label: "Module", color: "#5C6BC0" },
            { label: "Category", color: "#66BB6A" },
            { label: "Subcategory", color: "#FFA726" },
            { label: "Type", color: "#FFCA28" },
            { label: "Subtype", color: "#BDBDBD" },
          ].map((item) => (
            <Box
              key={item.label}
              sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <Dot color={item.color} />
              <Typography sx={{ fontSize: 11, color: "#505050" }}>
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default UserRightsForm;
