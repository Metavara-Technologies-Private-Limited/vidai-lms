import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import { useNavigate } from "react-router-dom";

import LeadsTable from "../components/LeadsHub/LeadsTable";
import LeadsConversation from "../components/LeadsHub/LeadsConversation";
import Activity from "../components/LeadsHub/Activity";
import FilterDialog from "../components/LeadsHub/FilterDialog";

import "../styles/Leads/leads.css";

const Leads: React.FC = () => {
  const navigate = useNavigate();

  const [tab, setTab] = React.useState(0);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const tabs = [
    "All Leads ",
    "Follow-Ups ",
    "Archived Leads",
    "Leads Conversation",
    "Activity",
  ];

  return (
    <Box className="leads-page">
      {/* ================= HEADER ================= */}
      <Stack
        className="leads-header"
        direction="row"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography className="leads-title">Leads Hub</Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by Lead name / Lead No."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <IconButton className="header-icon-btn">
            <ViewListIcon fontSize="small" />
          </IconButton>

          <IconButton className="header-icon-btn">
            <ViewModuleIcon fontSize="small" />
          </IconButton>

          <IconButton
            className="header-icon-btn"
            onClick={() => setFilterOpen(true)}
          >
            <FilterAltOutlinedIcon fontSize="small" />
          </IconButton>

          <Button
            className="add-lead-btn"
            onClick={() => navigate("/leads/add")}
          >
            + Add New Lead
          </Button>
        </Stack>
      </Stack>

      {/* ================= TABS ================= */}
      <Stack direction="row" spacing={1} className="pill-tabs" sx={{ mb: 3 }}>
        {tabs.map((label, i) => (
          <Box
            key={i}
            className={`pill-tab ${tab === i ? "active" : ""}`}
            onClick={() => setTab(i)}
          >
            {label}
          </Box>
        ))}
      </Stack>

      {/* ================= CONTENT SWITCH ================= */}
      {tab === 3 && <LeadsConversation />}

      {tab === 4 && <Activity />}

      {tab !== 3 && tab !== 4 && (
        <LeadsTable
          search={search}
          tab={tab === 2 ? "archived" : "active"} // ⭐ ARCHIVE CONNECTION
        />
      )}

      <FilterDialog open={filterOpen} onClose={() => setFilterOpen(false)} />
    </Box>
  );
};

export default Leads;
