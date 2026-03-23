import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Filter_Leads from "../assets/icons/Filter_Leads.svg";
import Leads_Gridview from "../assets/icons/Leads_Gridview.svg";
import Leads_Tableview_icon from "../assets/icons/Leads_Tableview_icon.svg";

import type { FilterValues } from "../types/leads.types";
import type { Lead } from "../services/leads.api";

import { fetchLeads, selectLeads } from "../store/leadSlice";
import type { AppDispatch } from "../store";
import "../styles/Leads/leads.css";

const STORAGE_KEY_FILTERS = "leads_filters";
const STORAGE_KEY_TAB = "leads_active_tab";
const STORAGE_KEY_VIEW = "leads_view_mode";

const LeadsTable = React.lazy(() => import("../components/LeadsHub/LeadsTable"));
const LeadsBoard = React.lazy(() => import("../components/LeadsHub/LeadsBoard"));
const LeadsConversation = React.lazy(() => import("../components/LeadsHub/LeadsConversation"));
const Activity = React.lazy(() => import("../components/LeadsHub/Activity"));
const FilterDialog = React.lazy(() => import("../components/LeadsHub/FilterDialog"));
const LeadsFollowUp = React.lazy(() => import("../components/LeadsHub/LeadsFollowUp"));

const Leads: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const leads = useSelector(selectLeads);

  const loadSavedFilters = (): FilterValues => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FILTERS);
      if (saved) return JSON.parse(saved);
    } catch (error) {
      console.error("Failed to load saved filters:", error);
    }
    return { department: "", assignee: "", status: "", quality: "", source: "", dateFrom: null, dateTo: null };
  };

  const loadSavedTab = (): number => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TAB);
      if (saved) return parseInt(saved, 10);
    } catch (error) {
      console.error("Failed to load saved tab:", error);
    }
    return 0;
  };

  const loadSavedViewMode = (): "table" | "board" => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VIEW);
      if (saved === "board" || saved === "table") return saved;
    } catch (error) {
      console.error("Failed to load saved view mode:", error);
    }
    return "table";
  };

  const [tab, setTab] = React.useState(loadSavedTab());
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"table" | "board">(loadSavedViewMode());
  const [activeFilters, setActiveFilters] = React.useState<FilterValues>(loadSavedFilters());
  const [counts, setCounts] = React.useState({ all: 0, followUps: 0, archived: 0 });

  const applyFilters = React.useCallback((leadsToFilter: Array<Lead & { status?: string }>) => {
    return leadsToFilter.filter((lead) => {
      if (activeFilters.department && lead.department_id !== Number(activeFilters.department)) return false;
      if (activeFilters.assignee && lead.assigned_to_id !== Number(activeFilters.assignee)) return false;
      if (activeFilters.status) {
        const leadStatus = (lead.lead_status || lead.status || "").toLowerCase();
        if (leadStatus !== activeFilters.status.toLowerCase()) return false;
      }
      if (activeFilters.quality) {
        const hasAssignee = Boolean(lead.assigned_to_id || lead.assigned_to_name);
        const hasNextAction = Boolean(lead.next_action_description && lead.next_action_description.trim() !== "");
        const nextActionPending = lead.next_action_status === "pending";
        let leadQuality = "Cold";
        if (hasAssignee && hasNextAction && nextActionPending) leadQuality = "Hot";
        else if (hasAssignee || hasNextAction) leadQuality = "Warm";
        if (leadQuality !== activeFilters.quality) return false;
      }
      if (activeFilters.source && lead.source !== activeFilters.source) return false;
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
  }, [activeFilters]);

  React.useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(activeFilters)); }
    catch (error) { console.error("Failed to save filters:", error); }
  }, [activeFilters]);

  React.useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_TAB, tab.toString()); }
    catch (error) { console.error("Failed to save tab:", error); }
  }, [tab]);

  React.useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY_VIEW, viewMode); }
    catch (error) { console.error("Failed to save view mode:", error); }
  }, [viewMode]);

  React.useEffect(() => { dispatch(fetchLeads()); }, [dispatch]);

  React.useEffect(() => {
    if (leads && leads.length > 0) {
      const followUpStatuses = ["new", "lost", "cycle conversion"];
      const filteredLeads = applyFilters(leads);
      const allCount = filteredLeads.filter((l) => l.is_active !== false).length;
      const followUpCount = filteredLeads.filter((l) => {
        const status = (l.lead_status || "").toLowerCase().trim();
        return l.is_active !== false && followUpStatuses.includes(status);
      }).length;
      const archivedCount = filteredLeads.filter((l) => l.is_active === false).length;
      setCounts({ all: allCount, followUps: followUpCount, archived: archivedCount });
      console.log("📊 Counts updated:", { all: allCount, followUps: followUpCount, archived: archivedCount, total: filteredLeads.length });
    } else {
      setCounts({ all: 0, followUps: 0, archived: 0 });
    }
  }, [leads, applyFilters]);

  const handleApplyFilters = (filters: FilterValues) => {
    console.log("🔍 Applying filters to leads:", filters);
    setActiveFilters(filters);
  };

  const activeFilterCount = React.useMemo(() => {
    return Object.values(activeFilters).filter((v) => v !== "" && v !== null).length;
  }, [activeFilters]);

  const tabs = [
    { label: "All Leads", count: counts.all },
    { label: "Follow-Ups", count: counts.followUps },
    { label: "Archived Leads", count: counts.archived },
    { label: "Leads Conversation", count: null },
    { label: "Activity", count: null },
  ];

  return (
    <Box className="leads-page">
      {/* HEADER */}
      <Stack
        className="leads-header"
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3, flexWrap: "nowrap", minWidth: 0, width: "100%", gap: 2 }}
      >
        <Typography className="leads-title" sx={{ flexShrink: 0 }}>
          Leads Hub
        </Typography>

        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexShrink: 0, flexWrap: "nowrap" }}>
          {/* Search */}
          <Box
            sx={{
              display: "flex", alignItems: "center", width: 300, minWidth: 140, height: 40,
              borderRadius: "10px", border: "1px solid #E5E7EB", backgroundColor: "#FFFFFF",
              paddingLeft: "10px", paddingRight: "10px", gap: "6px", flexShrink: 1,
              "&:hover": { border: "1px solid #D1D5DB" },
              "&:focus-within": { border: "1px solid #9CA3AF" },
            }}
          >
            <SearchIcon sx={{ color: "#9CA3AF", width: 18, height: 18, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by Lead name / Lead No"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: "none", outline: "none", background: "transparent", fontSize: "13px", fontFamily: "Nunito, sans-serif", color: "#111827", width: "100%", height: "100%" }}
            />
          </Box>

          {/* ── View Mode Toggle — highlighted when active ── */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #E5E7EB",
              borderRadius: "10px",
              overflow: "hidden",
              bgcolor: "#F9FAFB",
            }}
          >
            <IconButton
              onClick={() => setViewMode("table")}
              title="Table view"
              sx={{
                borderRadius: 0,
                width: 38,
                height: 38,
                bgcolor: viewMode === "table" ? "#E5E7EB" : "transparent",
                "&:hover": {
                  bgcolor: viewMode === "table" ? "#D1D5DB" : "#F3F4F6",
                },
                transition: "background-color 0.15s ease",
              }}
            >
              <img
                src={Leads_Tableview_icon}
                style={{
                  width: 18,
                  height: 18,
                  // invert icon to white when active on dark background
                  filter: "none",
                  transition: "filter 0.15s ease",
                }}
                alt="Table view"
              />
            </IconButton>

            {/* thin divider between icons */}
            <Box sx={{ width: "1px", height: 20, bgcolor: "#E5E7EB", flexShrink: 0 }} />

            <IconButton
              onClick={() => setViewMode("board")}
              title="Board view"
              sx={{
                borderRadius: 0,
                width: 38,
                height: 38,
                bgcolor: viewMode === "board" ? "#E5E7EB" : "transparent",
                "&:hover": {
                  bgcolor: viewMode === "board" ? "#D1D5DB" : "#F3F4F6",
                },
                transition: "background-color 0.15s ease",
              }}
            >
              <img
                src={Leads_Gridview}
                style={{
                  width: 22,
                  height: 22,
                  filter: "none",
                  transition: "filter 0.15s ease",
                }}
                alt="Board view"
              />
            </IconButton>
          </Box>

          {/* Filter Button */}
          <Box sx={{ position: "relative", flexShrink: 0 }}>
            <IconButton className="filter-icon-btn" onClick={() => setFilterOpen(true)} title="Open filters">
              <img src={Filter_Leads} alt="Filter" />
            </IconButton>
            {activeFilterCount > 0 && (
              <Box className="filter-badge">{activeFilterCount}</Box>
            )}
          </Box>

          {/* Add New Lead */}
          <Button className="add-lead-btn" onClick={() => navigate("/leads/add")} sx={{ flexShrink: 0 }}>
            + Add New Lead
          </Button>
        </Stack>
      </Stack>

      {/* PILL TABS */}
      <Stack direction="row" spacing={1} className="pill-tabs" sx={{ mb: 3 }}>
        {tabs.map((t, i) => (
          <Box key={i} className={`pill-tab ${tab === i ? "active" : ""}`} onClick={() => setTab(i)}>
            {t.label}
            {t.count !== null && <span className="tab-count">({t.count})</span>}
          </Box>
        ))}
      </Stack>

      {/* CONTENT */}
      <React.Suspense fallback={<Box sx={{ py: 4, textAlign: "center" }}><Typography variant="caption" color="text.secondary">Loading...</Typography></Box>}>
        {tab === 1 && <LeadsFollowUp search={search} filters={activeFilters} />}
        {tab === 3 && <LeadsConversation />}
        {tab === 4 && <Activity />}
        {tab !== 1 && tab !== 3 && tab !== 4 && (
          viewMode === "table" ? (
            <LeadsTable search={search} tab={tab === 2 ? "archived" : "active"} filters={activeFilters} />
          ) : (
            <LeadsBoard search={search} filters={activeFilters} />
          )
        )}
      </React.Suspense>

      {filterOpen && (
        <React.Suspense fallback={null}>
          <FilterDialog open={filterOpen} onClose={() => setFilterOpen(false)} onApplyFilters={handleApplyFilters} />
        </React.Suspense>
      )}
    </Box>
  );
};

export default Leads;