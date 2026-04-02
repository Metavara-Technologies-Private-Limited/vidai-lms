import React, { lazy, Suspense, useState } from "react";
import { Box, CircularProgress, Tab, Tabs, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const UserDetailsForm = lazy(() => import("./UserDetails/UserDetailsForm"));
const UserRightsForm = lazy(() => import("./UserRights/UserRightsForm"));

// ─── Types ────────────────────────────────────────────────────────────────────
type TabKey = "details" | "rights";
// ─── Step indicator ───────────────────────────────────────────────────────────
const StepDot = ({
  index,
  label,
  active,
  done,
}: {
  index: number;
  label: string;
  active: boolean;
  done: boolean;
}) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
    <Box
      sx={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: done ? "#4CAF50" : active ? "#E97B5A" : "#BDBDBD",
        color: "#fff",
        fontSize: 11,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {done ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : index + 1}
    </Box>
    <Typography
      sx={{
        fontSize: 12,
        fontWeight: 500,
        color: done ? "#4CAF50" : active ? "#E97B5A" : "#9E9E9E",
      }}
    >
      {label}
    </Typography>
  </Box>
);

const StepConnector = ({ done }: { done: boolean }) => (
  <Box
    sx={{
      flex: 1,
      height: 2,
      bgcolor: done ? "#4CAF50" : "#E0E0E0",
      mx: 1,
    }}
  />
);

// ─── Component ────────────────────────────────────────────────────────────────

const UsersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("details");

  const handleSaveAndNext = () => {
    // Step 1 done → switch to User Rights tab
    setActiveTab("rights");
  };

  const handleCancel = () => {
    setActiveTab("details");
  };

  const handleSaveGrantAccess = () => {
    // TODO: submit to API
    setActiveTab("details");
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* ── Top tab bar (matches the Figma tab header) ── */}
      <Tabs
        value={activeTab}
        onChange={(_, v: TabKey) => setActiveTab(v)}
        sx={{
          borderBottom: "1px solid #E0E0E0",
          "& .MuiTabs-indicator": { bgcolor: "#D32F2F", height: 2 },
          "& .MuiTab-root": {
            textTransform: "none",
            fontSize: 14,
            fontWeight: 500,
            color: "#9E9E9E",
            minHeight: 44,
          },
          "& .MuiTab-root.Mui-selected": {
            color: "#232323",
            fontWeight: 600,
          },
        }}
      >
        <Tab label="User Details" value="details" />
        <Tab label="User Rights" value="rights" />
      </Tabs>

      {/* ── Content area ── */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
        {/* Add New User heading */}
        <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>
          Add New User
        </Typography>

        {/* Stepper */}
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            border: "1px solid #E0E0E0",
            borderRadius: "8px",
            px: 2,
            py: 1,
            mb: 3,
          }}
        >
          <StepDot
            index={0}
            label="User Details"
            active={activeTab === "details"}
            done={activeTab === "rights"}
          />
          <StepConnector done={activeTab === "rights"} />
          <StepDot
            index={1}
            label="User Rights"
            active={activeTab === "rights"}
            done={false}
          />
        </Box>

        {/* Tab panels */}
        <Suspense fallback={<CircularProgress size={24} />}>
          {activeTab === "details" && (
            <UserDetailsForm
              onNext={handleSaveAndNext}
              onCancel={handleCancel}
            />
          )}
          {activeTab === "rights" && (
            <UserRightsForm
              onCancel={handleCancel}
              onSave={handleSaveGrantAccess}
            />
          )}
        </Suspense>
      </Box>
    </Box>
  );
};

export default UsersPage;
