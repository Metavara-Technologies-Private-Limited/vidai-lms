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
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Filter_Leads from "../assets/icons/Filter_Leads.svg";
import Leads_Gridview from "../assets/icons/Leads_Gridview.svg";
import Leads_Tableview_icon from "../assets/icons/Leads_Tableview_icon.svg";

import LeadsTable from "../components/LeadsHub/LeadsTable";
import LeadsBoard from "../components/LeadsHub/LeadsBoard";
import LeadsConversation from "../components/LeadsHub/LeadsConversation";
import Activity from "../components/LeadsHub/Activity";
import FilterDialog from "../components/LeadsHub/FilterDialog";
import LeadsFollowUp from "../components/LeadsHub/LeadsFollowUp";

import { fetchLeads, selectLeads } from "../store/leadSlice";
import "../styles/Leads/leads.css";

const Leads: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ====================== Redux State ======================
  const leads = useSelector(selectLeads);

  // ====================== Local State ======================
  const [tab, setTab] = React.useState(0);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"table" | "board">("table");
  const [counts, setCounts] = React.useState({
    all: 0,
    followUps: 0,
    archived: 0,
  });

  // ====================== Fetch Leads on Mount ======================
  React.useEffect(() => {
    dispatch(fetchLeads() as any);
  }, [dispatch]);

  // ====================== Calculate Counts ======================
  React.useEffect(() => {
    if (leads && leads.length > 0) {
      const followUpStatuses = ["new", "lost", "cycle conversion"];

      const allCount = leads.filter((l) => !l.archived).length;

      // ✅ FIXED: use lead_status instead of status
      const followUpCount = leads.filter((l) => {
        const status = (l.lead_status || "").toLowerCase().trim();
        return !l.archived && followUpStatuses.includes(status);
      }).length;

      const archivedCount = leads.filter((l) => l.archived).length;

      setCounts({
        all: allCount,
        followUps: followUpCount,
        archived: archivedCount,
      });
    } else {
      setCounts({
        all: 0,
        followUps: 0,
        archived: 0,
      });
    }
  }, [leads]);

  // ====================== Tab Configuration ======================
  const tabs = [
    { label: "All Leads", count: counts.all },
    { label: "Follow-Ups", count: counts.followUps },
    { label: "Archived Leads", count: counts.archived },
    { label: "Leads Conversation", count: null },
    { label: "Activity", count: null },
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
          {/* Search Input */}
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

          {/* View Mode Buttons */}
          <div className="header-icon-container">
            <IconButton
              className="header-icon-btn"
              onClick={() => setViewMode("table")}
              title="Table view"
            >
              <img
                src={Leads_Tableview_icon}
                style={{ width: 18, height: 18 }}
                alt="Table view"
              />
            </IconButton>

            <IconButton
              className="header-icon-btn"
              onClick={() => setViewMode("board")}
              title="Board view"
            >
              <img
                src={Leads_Gridview}
                style={{ width: 22, height: 22 }}
                alt="Board view"
              />
            </IconButton>
          </div>

          {/* Filter Button */}
          <IconButton
            sx={{ padding: "4px" }}
            onClick={() => setFilterOpen(true)}
            title="Open filters"
          >
            <img src={Filter_Leads} height={36} width={36} alt="Filter" />
          </IconButton>

          {/* Add New Lead Button */}
          <Button
            className="add-lead-btn"
            onClick={() => navigate("/leads/add")}
          >
            + Add New Lead
          </Button>
        </Stack>
      </Stack>

      {/* ================= PILL TABS WITH BADGES ================= */}
      <Stack direction="row" spacing={1} className="pill-tabs" sx={{ mb: 3 }}>
        {tabs.map((t, i) => (
          <Box
            key={i}
            className={`pill-tab ${tab === i ? "active" : ""}`}
            onClick={() => setTab(i)}
          >
            {t.label}
            {t.count !== null && <span className="tab-count">({t.count})</span>}
          </Box>
        ))}
      </Stack>

      {/* ================= CONTENT SWITCH ================= */}
      {tab === 1 && <LeadsFollowUp search={search} />}
      {tab === 3 && <LeadsConversation />}
      {tab === 4 && <Activity />}

      {tab !== 1 && tab !== 3 && tab !== 4 && (
        viewMode === "table" ? (
          <LeadsTable search={search} tab={tab === 2 ? "archived" : "active"} />
        ) : (
          <LeadsBoard search={search} />
        )
      )}

      {/* Filter Dialog */}
      <FilterDialog open={filterOpen} onClose={() => setFilterOpen(false)} />
    </Box>
  );
};

export default Leads;