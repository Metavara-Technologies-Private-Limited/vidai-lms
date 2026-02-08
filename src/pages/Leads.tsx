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
// Correct icons for your design
import ViewListIcon from "@mui/icons-material/ViewList"; 
import ViewQuiltOutlinedIcon from "@mui/icons-material/ViewQuiltOutlined"; 

import { useNavigate } from "react-router-dom";
import LeadsTable from "../components/LeadsHub/LeadsTable";
import LeadsBoard from "../components/LeadsHub/LeadsBoard"; 
import LeadsConversation from "../components/LeadsHub/LeadsConversation";
import Activity from "../components/LeadsHub/Activity";
import FilterDialog from "../components/LeadsHub/FilterDialog";

import "../styles/Leads/leads.css";

const Leads: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = React.useState(0);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"table" | "board">("table");

  const tabs = ["All Leads", "Follow-Ups", "Archived Leads", "Leads Conversation", "Activity"];

  return (
    <Box className="leads-page" sx={{ p: 3 }}>
      {/* ================= HEADER ================= */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Leads Hub</Typography>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by Lead name / Lead No."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              width: "350px",
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                backgroundColor: "#fff",
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "#94A3B8" }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Table View Icon */}
          <IconButton 
            onClick={() => setViewMode("table")}
            sx={{ 
              border: "1px solid #E2E8F0", 
              borderRadius: "12px",
              backgroundColor: viewMode === "table" ? "#EEF2FF" : "#fff",
              color: viewMode === "table" ? "#6366F1" : "#64748B",
            }}
          >
            <ViewListIcon sx={{ fontSize: "20px" }} />
          </IconButton>

          {/* Board View Icon (The 2 Vertical Boxes from your CSS/Figma) */}
          <IconButton 
            onClick={() => setViewMode("board")}
            sx={{ 
              border: "1px solid #E2E8F0", 
              borderRadius: "12px",
              backgroundColor: viewMode === "board" ? "#EEF2FF" : "#fff",
              color: viewMode === "board" ? "#6366F1" : "#64748B",
            }}
          >
            <ViewQuiltOutlinedIcon sx={{ fontSize: "20px", transform: "rotate(90deg)" }} />
          </IconButton>

          {/* Filter Icon */}
          <IconButton
            onClick={() => setFilterOpen(true)}
            sx={{ 
              border: "1px solid #E2E8F0", 
              borderRadius: "12px", 
              color: "#64748B" 
            }}
          >
            <FilterAltOutlinedIcon sx={{ fontSize: "20px" }} />
          </IconButton>

          <Button
            variant="contained"
            onClick={() => navigate("/leads/add")}
            sx={{
              backgroundColor: "#334155",
              textTransform: "none",
              borderRadius: "12px",
              fontWeight: 600,
              px: 3,
              height: "40px"
            }}
          >
            + Add New Lead
          </Button>
        </Stack>
      </Stack>

      {/* ================= TABS ================= */}
      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        {tabs.map((label, i) => (
          <Box
            key={i}
            onClick={() => setTab(i)}
            sx={{
              cursor: "pointer",
              px: 2.5,
              py: 0.8,
              borderRadius: "20px",
              fontWeight: 600,
              fontSize: "0.85rem",
              backgroundColor: tab === i ? "#6366F1" : "transparent",
              color: tab === i ? "#fff" : "#64748B",
            }}
          >
            {label}
          </Box>
        ))}
      </Stack>

      {/* ================= CONTENT ================= */}
      <Box>
        {tab === 3 && <LeadsConversation />}
        {tab === 4 && <Activity />}
        {tab !== 3 && tab !== 4 && (
          viewMode === "table" ? (
            <LeadsTable search={search} tab={tab === 2 ? "archived" : "active"} />
          ) : (
            <LeadsBoard search={search} />
          )
        )}
      </Box>

      <FilterDialog open={filterOpen} onClose={() => setFilterOpen(false)} />
    </Box>
  );
};

export default Leads;