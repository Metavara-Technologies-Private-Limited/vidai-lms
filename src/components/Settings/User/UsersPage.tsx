import React, { lazy, Suspense, useState } from "react";
import { Box, CircularProgress, Tab, Tabs, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { UserProfileRead } from "../../../services/userProfile.api";

const UsersList = lazy(() => import("./UserDetails/UsersList"));
const UserDetailsForm = lazy(() => import("./UserDetails/UserDetailsForm.tsx"));
const UserRightsForm = lazy(() => import("./UserRights/UserRightsForm.tsx"));

// ─── Types ────────────────────────────────────────────────────────────────────
type TabKey = "details" | "rights";
type DetailsView = "list" | "form";
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
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minHeight: 22 }}>
    <Box
      sx={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: done ? "#016A1C" : active ? "#E17E61" : "#BBBBBB",
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
        color: done ? "#016A1C" : active ? "#E17E61" : "#BBBBBB",
      }}
    >
      {label}
    </Typography>
  </Box>
);

const StepConnector = ({ done }: { done: boolean }) => (
  <Box
    sx={{
      width: 120,
      height: "2px",
      bgcolor: done ? "#016A1C" : "#BBBBBB",
      mx: 1.5,
      borderRadius: 1,
      transition: "background-color 0.2s ease",
    }}
  />
);

// ─── Component ────────────────────────────────────────────────────────────────

const UsersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("details");
  const [detailsView, setDetailsView] = useState<DetailsView>("list");
  const [editingProfile, setEditingProfile] = useState<UserProfileRead | null>(null);
  const [listRefreshKey, setListRefreshKey] = useState(0);

  const handleSaveAndNext = () => {
    setListRefreshKey((prev) => prev + 1);
    setActiveTab("rights");
  };

  const handleOpenNewUser = () => {
    setEditingProfile(null);
    setDetailsView("form");
    setActiveTab("details");
  };

  const handleEditUser = (profile: UserProfileRead) => {
    setEditingProfile(profile);
    setDetailsView("form");
    setActiveTab("details");
  };

  const handleCancelDetails = () => {
    setEditingProfile(null);
    setDetailsView("list");
    setActiveTab("details");
  };

  const handleCancelRights = () => {
    setEditingProfile(null);
    setListRefreshKey((prev) => prev + 1);
    setDetailsView("list");
    setActiveTab("details");
  };

  const handleSaveGrantAccess = () => {
    setEditingProfile(null);
    setListRefreshKey((prev) => prev + 1);
    setDetailsView("list");
    setActiveTab("details");
  };

  return (
    <Box
      sx={{ height: "100%", display: "flex", flexDirection: "column", pt: 0 }}
    >
      {/* ── Top tab bar (matches the Figma tab header) ── */}
      <Tabs
        value={activeTab}
        onChange={(_, v: TabKey) => setActiveTab(v)}
        variant="fullWidth"
        sx={{
          borderBottom: "1px solid #E0E0E0",
          minHeight: 40,
          mx: -3,
          mt: -2,
          "& .MuiTabs-indicator": {
            backgroundColor: "#E17E61",
            height: 2.1,
          },

          "& .MuiTab-root": {
            textTransform: "none",
            fontSize: 15,
            fontWeight: 500,
            color: "#BBBBBB",
            minHeight: 40,
            p: 0,
          },

          "& .MuiTab-root.Mui-selected": {
            color: "#212121",
            fontWeight: 600,
          },
        }}
      >
        <Tab label="User Details" value="details" />
        <Tab label="User Rights" value="rights" />
      </Tabs>

      {/* ── Content area ── */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
        {(activeTab === "rights" || detailsView === "form") && (
          <>
            <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>
              Add New User
            </Typography>

            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                border: "1px solid #E0E0E0",
                borderRadius: "8px",
                px: 2,
                py: 1,
                mb: 3,
                backgroundColor: "#FFFFFF",
                boxShadow: "0px 2px 6px rgba(0,0,0,0.08)",
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
          </>
        )}

        {/* Tab panels */}
        <Suspense fallback={<CircularProgress size={24} />}>
          {activeTab === "details" && detailsView === "list" && (
            <UsersList
              refreshKey={listRefreshKey}
              onNewUser={handleOpenNewUser}
              onEditUser={handleEditUser}
            />
          )}
          {activeTab === "details" && detailsView === "form" && (
            <UserDetailsForm
              initialProfile={editingProfile}
              onNext={handleSaveAndNext}
              onCancel={handleCancelDetails}
            />
          )}
          {activeTab === "rights" && (
            <UserRightsForm
              onCancel={handleCancelRights}
              onSave={handleSaveGrantAccess}
            />
          )}
        </Suspense>
      </Box>
    </Box>
  );
};

export default UsersPage;
