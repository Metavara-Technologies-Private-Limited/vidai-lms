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
import type { FilterValues } from "../types/leads.types";

import { fetchLeads, selectLeads } from "../store/leadSlice";
import "../styles/Leads/leads.css";

const STORAGE_KEY_FILTERS = "leads_filters";
const STORAGE_KEY_TAB = "leads_active_tab";
const STORAGE_KEY_VIEW = "leads_view_mode";

const Leads: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ====================== Redux State ======================
  const leads = useSelector(selectLeads);

  // ====================== Load Saved State from localStorage ======================
  const loadSavedFilters = (): FilterValues => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FILTERS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error("Failed to load saved filters:", error);
    }
    return {
      department: "",
      assignee: "",
      status: "",
      quality: "",
      source: "",
      dateFrom: null,
      dateTo: null,
    };
  };

  const loadSavedTab = (): number => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TAB);
      if (saved) {
        return parseInt(saved, 10);
      }
    } catch (error) {
      console.error("Failed to load saved tab:", error);
    }
    return 0;
  };

  const loadSavedViewMode = (): "table" | "board" => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VIEW);
      if (saved === "board" || saved === "table") {
        return saved;
      }
    } catch (error) {
      console.error("Failed to load saved view mode:", error);
    }
    return "table";
  };

  // ====================== Local State ======================
  const [tab, setTab] = React.useState(loadSavedTab());
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"table" | "board">(loadSavedViewMode());
  const [activeFilters, setActiveFilters] = React.useState<FilterValues>(loadSavedFilters());
  const [counts, setCounts] = React.useState({
    all: 0,
    followUps: 0,
    archived: 0,
  });

  // ====================== Save to localStorage when filters change ======================
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(activeFilters));
    } catch (error) {
      console.error("Failed to save filters:", error);
    }
  }, [activeFilters]);

  // ====================== Save tab to localStorage ======================
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TAB, tab.toString());
    } catch (error) {
      console.error("Failed to save tab:", error);
    }
  }, [tab]);

  // ====================== Save view mode to localStorage ======================
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VIEW, viewMode);
    } catch (error) {
      console.error("Failed to save view mode:", error);
    }
  }, [viewMode]);

  // ====================== Fetch Leads on Mount ======================
  React.useEffect(() => {
    dispatch(fetchLeads() as any);
  }, [dispatch]);

  // ====================== Calculate Counts (with Filters) ======================
  React.useEffect(() => {
    if (leads && leads.length > 0) {
      const followUpStatuses = ["new", "lost", "cycle conversion"];

      // Apply filters to leads before counting
      const filteredLeads = applyFilters(leads);

      // Active leads: is_active !== false (true or undefined)
      // Archived leads: is_active === false
      const allCount = filteredLeads.filter((l) => l.is_active !== false).length;

      const followUpCount = filteredLeads.filter((l) => {
        const status = (l.lead_status || "").toLowerCase().trim();
        return l.is_active !== false && followUpStatuses.includes(status);
      }).length;

      const archivedCount = filteredLeads.filter((l) => l.is_active === false).length;

      setCounts({
        all: allCount,
        followUps: followUpCount,
        archived: archivedCount,
      });

      console.log("📊 Counts updated:", {
        all: allCount,
        followUps: followUpCount,
        archived: archivedCount,
        total: filteredLeads.length,
      });
    } else {
      setCounts({
        all: 0,
        followUps: 0,
        archived: 0,
      });
    }
  }, [leads, activeFilters]);

  // ====================== Apply Filters Function ======================
  const applyFilters = (leadsToFilter: any[]) => {
    return leadsToFilter.filter((lead) => {
      // Department filter
      if (activeFilters.department && lead.department_id !== Number(activeFilters.department)) {
        return false;
      }

      // Assignee filter
      if (activeFilters.assignee && lead.assigned_to_id !== Number(activeFilters.assignee)) {
        return false;
      }

      // Status filter
      if (activeFilters.status) {
        const leadStatus = (lead.lead_status || lead.status || "").toLowerCase();
        if (leadStatus !== activeFilters.status.toLowerCase()) {
          return false;
        }
      }

      // Quality filter (derived from lead data)
      if (activeFilters.quality) {
        const hasAssignee = Boolean(lead.assigned_to_id || lead.assigned_to_name);
        const hasNextAction = Boolean(
          lead.next_action_description && lead.next_action_description.trim() !== ""
        );
        const nextActionPending = lead.next_action_status === "pending";

        let leadQuality = "Cold";
        if (hasAssignee && hasNextAction && nextActionPending) {
          leadQuality = "Hot";
        } else if (hasAssignee || hasNextAction) {
          leadQuality = "Warm";
        }

        if (leadQuality !== activeFilters.quality) {
          return false;
        }
      }

      // Source filter
      if (activeFilters.source && lead.source !== activeFilters.source) {
        return false;
      }

      // Date range filter
      if (activeFilters.dateFrom || activeFilters.dateTo) {
        const leadDate = lead.created_at ? new Date(lead.created_at) : null;
        if (!leadDate) return false;

        if (activeFilters.dateFrom) {
          const fromDate = new Date(activeFilters.dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (leadDate < fromDate) return false;
        }

        if (activeFilters.dateTo) {
          const toDate = new Date(activeFilters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          if (leadDate > toDate) return false;
        }
      }

      return true;
    });
  };

  // ====================== Handle Filter Apply ======================
  const handleApplyFilters = (filters: FilterValues) => {
    console.log("🔍 Applying filters to leads:", filters);
    setActiveFilters(filters);
  };

  // ====================== Get Active Filter Count ======================
  const activeFilterCount = React.useMemo(() => {
    return Object.values(activeFilters).filter((v) => v !== "" && v !== null).length;
  }, [activeFilters]);

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
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography className="leads-title">Leads Hub</Typography>

        <Stack direction="row" spacing={1.5} alignItems="center">
          {/* Search Input */}
          <TextField
            size="small"
            placeholder="Search by Lead name / Lead No"
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "#9CA3AF" }} />
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

          {/* Filter Button - Standalone Icon (No Box) */}
          <Box sx={{ position: "relative" }}>
            <IconButton
              className="filter-icon-btn"
              onClick={() => setFilterOpen(true)}
              title="Open filters"
            >
              <img src={Filter_Leads} alt="Filter" />
            </IconButton>
            {/* Filter Badge */}
            {activeFilterCount > 0 && (
              <Box className="filter-badge">
                {activeFilterCount}
              </Box>
            )}
          </Box>

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
      {tab === 1 && <LeadsFollowUp search={search} filters={activeFilters} />}
      {tab === 3 && <LeadsConversation />}
      {tab === 4 && <Activity />}

      {tab !== 1 && tab !== 3 && tab !== 4 && (
        viewMode === "table" ? (
          <LeadsTable 
            search={search} 
            tab={tab === 2 ? "archived" : "active"} 
            filters={activeFilters}
          />
        ) : (
          <LeadsBoard 
            search={search} 
            filters={activeFilters}
          />
        )
      )}

      {/* Filter Dialog with API Integration */}
      <FilterDialog 
        open={filterOpen} 
        onClose={() => setFilterOpen(false)}
        onApplyFilters={handleApplyFilters}
      />
    </Box>
  );
};

export default Leads;