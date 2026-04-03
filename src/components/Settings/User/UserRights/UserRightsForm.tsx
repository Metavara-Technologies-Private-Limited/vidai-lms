import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  IconButton,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckIcon from "@mui/icons-material/Check";
import { LEADS_MENU } from "../../../../config/sidebar.menu";

interface PermissionRow {
  label: string;
  genderMale: boolean;
  genderFemale: boolean;
  all: boolean;
  add: boolean;
  edit: boolean;
  view: boolean;
  print: boolean;
}

type PermissionFlags = Omit<PermissionRow, "label">;

interface RoleRights {
  modules: string[];
  categories: string[];
  subCategories: string[];
}

interface RoleEntry {
  name: "Super Admin" | "Admin" | "User";
  totalCount: number;
  badgeCount: number;
  checked: boolean;
  savedRights: RoleRights;
  savedPermissions: Record<string, PermissionFlags>;
}

interface Props {
  onCancel: () => void;
  onSave: () => void;
}

const STEP_LABELS = ["Module", "Category", "Sub Category"];
const MODULE_OPTIONS = ["Admin", "Clinical", "Lab", "Settings"];

const emptyRights = (): RoleRights => ({
  modules: [],
  categories: [],
  subCategories: [],
});

const getDefaultPermission = (label: string): PermissionFlags => {
  const value = label.toLowerCase();

  if (value.includes("andrology")) {
    return {
      genderMale: true,
      genderFemale: false,
      all: true,
      add: true,
      edit: true,
      view: true,
      print: true,
    };
  }

  if (value.includes("embryology")) {
    return {
      genderMale: true,
      genderFemale: false,
      all: true,
      add: true,
      edit: true,
      view: true,
      print: true,
    };
  }

  if (value.includes("billing")) {
    return {
      genderMale: false,
      genderFemale: true,
      all: false,
      add: false,
      edit: false,
      view: true,
      print: false,
    };
  }

  if (value.includes("menstrual")) {
    return {
      genderMale: false,
      genderFemale: false,
      all: false,
      add: false,
      edit: false,
      view: true,
      print: false,
    };
  }

  return {
    genderMale: true,
    genderFemale: true,
    all: true,
    add: true,
    edit: true,
    view: true,
    print: true,
  };
};

const initialRoles: RoleEntry[] = [
  {
    name: "Super Admin",
    totalCount: 1,
    badgeCount: 1,
    checked: false,
    savedRights: emptyRights(),
    savedPermissions: {},
  },
  {
    name: "Admin",
    totalCount: 43,
    badgeCount: 8,
    checked: false,
    savedRights: emptyRights(),
    savedPermissions: {},
  },
  {
    name: "User",
    totalCount: 25,
    badgeCount: 5,
    checked: false,
    savedRights: emptyRights(),
    savedPermissions: {},
  },
];

const StepItem = ({
  number,
  label,
  active,
}: {
  number: number;
  label: string;
  active: boolean;
}) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
    <Box
      sx={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        bgcolor: active ? "#E97B5A" : "#BDBDBD",
        color: "#fff",
        fontSize: 11,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {number}
    </Box>
    <Typography
      sx={{
        fontSize: 13,
        fontWeight: 600,
        color: active ? "#E97B5A" : "#9E9E9E",
      }}
    >
      {label}
    </Typography>
  </Box>
);

const StepLine = () => <Box sx={{ width: 68, height: 12, bgcolor: "#D9D9D9", mx: 1.5 }} />;

const PermissionToggle = ({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle?: () => void;
}) => (
  <Box
    onClick={onToggle}
    sx={{
      width: 18,
      height: 18,
      borderRadius: "5px",
      border: checked ? "none" : "1px solid #D9D9D9",
      bgcolor: checked ? "#DFF3E5" : "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: onToggle ? "pointer" : "default",
      mx: "auto",
    }}
  >
    {checked ? <CheckIcon sx={{ color: "#56B56B", fontSize: 13 }} /> : null}
  </Box>
);

const legendItems = [
  { label: "Exceptional User", color: "#E07A59" },
  { label: "Module", color: "#3A7BD5" },
  { label: "Category", color: "#37BF1D" },
  { label: "Subcategory", color: "#ECD63F" },
  { label: "Type", color: "#E8B07E" },
  { label: "Subtype", color: "#A6A6A6" },
];

const borderColors = ["#5B8FF9", "#5EBB63", "#5EBB63", "#F0C247", "#E8A16D"];

const UserRightsForm: React.FC<Props> = ({ onCancel, onSave }) => {
  const [roles, setRoles] = useState<RoleEntry[]>(initialRoles);
  const [selectedRoleIdx, setSelectedRoleIdx] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [draftRights, setDraftRights] = useState<RoleRights>(initialRoles[0].savedRights);
  const [draftPermissions, setDraftPermissions] = useState<Record<string, PermissionFlags>>({});

  const categories = useMemo(() => LEADS_MENU.map((menu) => menu.label), []);
  const settingsSubCategories = useMemo(() => {
    const settingsMenu = LEADS_MENU.find((menu) => menu.key === "settings");
    return settingsMenu?.subMenu?.map((menu) => menu.label) ?? [];
  }, []);

  const handleRoleSelect = (idx: number) => {
    setSelectedRoleIdx(idx);
    setDraftRights(roles[idx]?.savedRights ?? emptyRights());
    setDraftPermissions(roles[idx]?.savedPermissions ?? {});
    setActiveStep(0);
  };

  const selectedLabels = useMemo(
    () => Array.from(new Set([...draftRights.modules, ...draftRights.categories, ...draftRights.subCategories])),
    [draftRights],
  );

  const permissionRows: PermissionRow[] = useMemo(
    () =>
      selectedLabels.map((label) => ({
        label,
        ...(draftPermissions[label] ?? getDefaultPermission(label)),
      })),
    [selectedLabels, draftPermissions],
  );

  const toggleFromList = (label: string, key: keyof RoleRights, checked: boolean) => {
    setDraftRights((prev) => {
      const current = prev[key];
      if (checked) {
        if (current.includes(label)) return prev;
        return { ...prev, [key]: [...current, label] };
      }

      return { ...prev, [key]: current.filter((item) => item !== label) };
    });
  };

  const removeFromList = (label: string, key: keyof RoleRights) => {
    setDraftRights((prev) => ({
      ...prev,
      [key]: prev[key].filter((item) => item !== label),
    }));
  };

  const removeFromAny = (label: string) => {
    setDraftRights((prev) => ({
      modules: prev.modules.filter((item) => item !== label),
      categories: prev.categories.filter((item) => item !== label),
      subCategories: prev.subCategories.filter((item) => item !== label),
    }));
  };

  const togglePermission = (label: string, field: keyof PermissionFlags) => {
    setDraftPermissions((prev) => {
      const base = prev[label] ?? getDefaultPermission(label);

      if (field === "all") {
        const nextAll = !base.all;
        return {
          ...prev,
          [label]: {
            ...base,
            all: nextAll,
            add: nextAll,
            edit: nextAll,
            view: nextAll,
            print: nextAll,
          },
        };
      }

      const next = {
        ...base,
        [field]: !base[field],
      } as PermissionFlags;

      next.all = next.add && next.edit && next.view && next.print;
      return { ...prev, [label]: next };
    });
  };

  const handleSaveForRole = () => {
    setRoles((prev) =>
      prev.map((role, idx) =>
        idx === selectedRoleIdx
          ? { ...role, savedRights: draftRights, savedPermissions: draftPermissions }
          : role,
      ),
    );
  };

  const handleNext = () => {
    if (activeStep < 2) {
      setActiveStep((prev) => prev + 1);
      return;
    }

    handleSaveForRole();
  };

  const handleFinalSave = () => {
    handleSaveForRole();
    onSave();
  };

  const selectedRole = roles[selectedRoleIdx];

  const renderStepOptions = () => {
    if (activeStep === 0) {
      return (
        <>
          <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap" }}>
            {MODULE_OPTIONS.map((label) => (
              <FormControlLabel
                key={label}
                control={
                  <Checkbox
                    size="small"
                    checked={draftRights.modules.includes(label)}
                    onChange={(event) => toggleFromList(label, "modules", event.target.checked)}
                    sx={{ p: 0, mr: 0.5, color: "#BDBDBD", "&.Mui-checked": { color: "#1976d2" } }}
                  />
                }
                label={<Typography sx={{ fontSize: 13 }}>{label}</Typography>}
                sx={{ m: 0 }}
              />
            ))}
          </Box>
          <Box sx={{ mt: 0.3 }}>
            {draftRights.modules.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {draftRights.modules.map((label) => (
                  <Chip
                    key={label}
                    label={label}
                    size="small"
                    deleteIcon={<CancelIcon sx={{ fontSize: "14px !important", color: "#FF6666 !important" }} />}
                    onDelete={() => removeFromList(label, "modules")}
                    sx={{
                      fontSize: 12,
                      height: 30,
                      border: "1px solid #5B8FF9",
                      borderRadius: "8px",
                      bgcolor: "#fff",
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </>
      );
    }

    if (activeStep === 1) {
      return (
        <>
          <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap" }}>
            {categories.map((label) => (
              <FormControlLabel
                key={label}
                control={
                  <Checkbox
                    size="small"
                    checked={draftRights.categories.includes(label)}
                    onChange={(event) => toggleFromList(label, "categories", event.target.checked)}
                    sx={{ p: 0, mr: 0.5, color: "#BDBDBD", "&.Mui-checked": { color: "#1976d2" } }}
                  />
                }
                label={<Typography sx={{ fontSize: 13 }}>{label}</Typography>}
                sx={{ m: 0 }}
              />
            ))}
          </Box>
          <Box sx={{ mt: 0.3 }}>
            {draftRights.categories.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {draftRights.categories.map((label) => (
                  <Chip
                    key={label}
                    label={label}
                    size="small"
                    deleteIcon={<CancelIcon sx={{ fontSize: "14px !important", color: "#FF6666 !important" }} />}
                    onDelete={() => removeFromList(label, "categories")}
                    sx={{
                      fontSize: 12,
                      height: 30,
                      border: "1px solid #5EBB63",
                      borderRadius: "8px",
                      bgcolor: "#fff",
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>
        </>
      );
    }

    return (
      <>
        <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap" }}>
          {settingsSubCategories.map((label) => (
            <FormControlLabel
              key={label}
              control={
                <Checkbox
                  size="small"
                  checked={draftRights.subCategories.includes(label)}
                  onChange={(event) => toggleFromList(label, "subCategories", event.target.checked)}
                  sx={{ p: 0, mr: 0.5, color: "#BDBDBD", "&.Mui-checked": { color: "#1976d2" } }}
                />
              }
              label={<Typography sx={{ fontSize: 13 }}>{label}</Typography>}
              sx={{ m: 0 }}
            />
          ))}
        </Box>
        <Box sx={{ mt: 0.3 }}>
          {draftRights.subCategories.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {draftRights.subCategories.map((label) => (
                <Chip
                  key={label}
                  label={label}
                  size="small"
                  deleteIcon={<CancelIcon sx={{ fontSize: "14px !important", color: "#FF6666 !important" }} />}
                  onDelete={() => removeFromList(label, "subCategories")}
                  sx={{
                    fontSize: 12,
                    height: 30,
                    border: "1px solid #F0C247",
                    borderRadius: "8px",
                    bgcolor: "#fff",
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      </>
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, height: "100%", minHeight: 0 }}>
      <Box sx={{ display: "flex", gap: 2, minHeight: 0 }}>
        <Box
          sx={{
            width: 260,
            flexShrink: 0,
            border: "1px solid #E0E0E0",
            borderRadius: "8px",
            p: "14px 12px",
            display: "flex",
            flexDirection: "column",
            bgcolor: "#fff",
            overflowY: "auto",
          }}
        >
          <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1.5, color: "#232323" }}>
            All Roles
          </Typography>

          {roles.map((role, idx) => (
            <Box
              key={role.name}
              sx={{
                display: "flex",
                alignItems: "center",
                py: 0.55,
                px: 0.5,
                cursor: "pointer",
                borderRadius: "4px",
                bgcolor: selectedRoleIdx === idx ? "#FFF3EE" : undefined,
                "&:hover": { bgcolor: "#FFF8F5" },
              }}
              onClick={() => handleRoleSelect(idx)}
            >
              <Checkbox
                size="small"
                checked={role.checked}
                onChange={() => {
                  setRoles((prev) =>
                    prev.map((item, mapIdx) =>
                      mapIdx === idx ? { ...item, checked: !item.checked } : item,
                    ),
                  );
                }}
                sx={{ p: 0, mr: 0.8, color: "#BDBDBD", "&.Mui-checked": { color: "#1976d2" } }}
              />

              <Typography
                sx={{
                  fontSize: 12.5,
                  flex: 1,
                  fontWeight: selectedRoleIdx === idx ? 600 : 400,
                  color: "#232323",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {role.name}
              </Typography>

              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#E57373",
                  minWidth: 22,
                  textAlign: "right",
                  mr: 0.8,
                }}
              >
                {String(role.badgeCount).padStart(2, "0")}
              </Typography>

              <IconButton
                size="small"
                sx={{
                  p: 0,
                  width: 20,
                  height: 20,
                  bgcolor: "#F5F5F5",
                  borderRadius: "4px",
                  "&:hover": { bgcolor: "#E8E8E8" },
                }}
              >
                <AddIcon sx={{ fontSize: 14, color: "#505050" }} />
              </IconButton>
            </Box>
          ))}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              border: "1px solid #E0E0E0",
              borderRadius: "8px",
              p: 2,
              bgcolor: "#fff",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#232323" }}>
              Page Access
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                border: "1px solid #E0E0E0",
                borderRadius: "6px",
                px: 2,
                py: 0.8,
                width: "fit-content",
              }}
            >
              {STEP_LABELS.map((label, index) => (
                <React.Fragment key={label}>
                  <StepItem number={index + 1} label={label} active={activeStep === index} />
                  {index < STEP_LABELS.length - 1 && <StepLine />}
                </React.Fragment>
              ))}
            </Box>

            {renderStepOptions()}

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={onCancel}
                sx={{
                  textTransform: "none",
                  fontSize: 14,
                  borderColor: "#2D2D2D",
                  color: "#2D2D2D",
                  borderRadius: "10px",
                  px: 3,
                  py: 1,
                  "&:hover": { borderColor: "#000", bgcolor: "transparent" },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={handleNext}
                sx={{
                  textTransform: "none",
                  fontSize: 14,
                  borderColor: "#BDBDBD",
                  color: "#505050",
                  borderRadius: "8px",
                  px: 3,
                  py: 1,
                  "&:hover": { borderColor: "#757575", bgcolor: "transparent" },
                }}
              >
                {activeStep < 2 ? "Next" : "Save"}
              </Button>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "220px 190px 60px 60px 60px 60px 60px",
                alignItems: "center",
                py: 1,
                px: 1,
                bgcolor: "#F7F7F7",
                borderRadius: "10px",
              }}
            >
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#2A2A2A" }}>Doctor 1</Typography>
              <Typography sx={{ fontSize: 12.5, color: "#505050" }}>Gender</Typography>
              {["All", "Add", "Edit", "View", "Print"].map((col) => (
                <Box key={col} sx={{ textAlign: "center" }}>
                  <Typography sx={{ fontSize: 12.5, color: "#505050", mb: 0.5 }}>{col}</Typography>
                  <PermissionToggle checked={false} />
                </Box>
              ))}
            </Box>

            <Box
              sx={{
                overflowY: "auto",
                maxHeight: 320,
                pr: 0.5,
              }}
            >
              {permissionRows.length === 0 ? (
                <Box sx={{ py: 3, textAlign: "center" }}>
                  <Typography sx={{ fontSize: 13, color: "#9E9E9E" }}>
                    Select options above to add access rows.
                  </Typography>
                </Box>
              ) : (
                permissionRows.map((row, index) => (
                  <Box
                    key={row.label}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "220px 190px 60px 60px 60px 60px 60px",
                      alignItems: "center",
                      py: 0.75,
                      px: 1,
                    }}
                  >
                    <Chip
                      label={row.label}
                      size="small"
                      deleteIcon={<CancelIcon sx={{ fontSize: "14px !important", color: "#FF6666 !important" }} />}
                      onDelete={() => removeFromAny(row.label)}
                      sx={{
                        width: "fit-content",
                        fontSize: 12,
                        height: 30,
                        bgcolor: "#fff",
                        border: `1px solid ${borderColors[index % borderColors.length]}`,
                        borderRadius: "8px",
                        "& .MuiChip-label": { px: 1.2 },
                      }}
                    />

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <PermissionToggle
                          checked={row.genderMale}
                          onToggle={() => togglePermission(row.label, "genderMale")}
                        />
                        <Typography sx={{ fontSize: 12, color: "#505050" }}>Male</Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <PermissionToggle
                          checked={row.genderFemale}
                          onToggle={() => togglePermission(row.label, "genderFemale")}
                        />
                        <Typography sx={{ fontSize: 12, color: "#505050" }}>Female</Typography>
                      </Box>
                    </Box>

                    <PermissionToggle checked={row.all} onToggle={() => togglePermission(row.label, "all")} />
                    <PermissionToggle checked={row.add} onToggle={() => togglePermission(row.label, "add")} />
                    <PermissionToggle checked={row.edit} onToggle={() => togglePermission(row.label, "edit")} />
                    <PermissionToggle checked={row.view} onToggle={() => togglePermission(row.label, "view")} />
                    <PermissionToggle checked={row.print} onToggle={() => togglePermission(row.label, "print")} />
                  </Box>
                ))
              )}
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.3, pt: 0.5 }}>
              <Button
                variant="outlined"
                onClick={onCancel}
                sx={{
                  textTransform: "none",
                  minWidth: 110,
                  height: 38,
                  borderRadius: "10px",
                  borderColor: "#2D2D2D",
                  color: "#2D2D2D",
                  fontSize: 14,
                  fontWeight: 600,
                  "&:hover": { borderColor: "#000", bgcolor: "transparent" },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleFinalSave}
                sx={{
                  textTransform: "none",
                  minWidth: 200,
                  height: 38,
                  borderRadius: "10px",
                  bgcolor: "#525252",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#444", boxShadow: "none" },
                }}
              >
                Save & Grant Access
              </Button>
            </Box>

            <Typography sx={{ fontSize: 12, color: "#7A7A7A" }}>
              Current role: {selectedRole.name}. Save stores access for this role only.
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          border: "1px solid #E0E0E0",
          borderRadius: "8px",
          bgcolor: "#fff",
          px: 2.5,
          py: 1.1,
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 3,
        }}
      >
        {legendItems.map((item) => (
          <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: item.color }} />
            <Typography sx={{ fontSize: 12, color: "#2E2E2E" }}>{item.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default UserRightsForm;
