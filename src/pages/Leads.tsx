import * as React from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Avatar,
  Paper,
  Tabs,
  Tab,
  Menu,
  MenuItem,
  ListItemIcon,
} from "@mui/material";

import { useNavigate } from "react-router-dom";

import SearchIcon from "@mui/icons-material/Search";
import CallIcon from "@mui/icons-material/Call";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

import { leadsMock } from "../components/LeadsHub/leadsMock";
import FilterDialog from "../components/LeadsHub/FilterDialog";

import "../styles/Leads/leads.css";

const Leads: React.FC = () => {
  const navigate = useNavigate();

  const rowsPerPage = 10;

  const [page, setPage] = React.useState(1);
  const [tab, setTab] = React.useState(0);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const [filteredLeads, setFilteredLeads] = React.useState(leadsMock);

  // menu
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedLead, setSelectedLead] = React.useState<any>(null);
  const openMenu = Boolean(anchorEl);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    lead: any
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedLead(lead);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedLead(null);
  };

  // SEARCH
  React.useEffect(() => {
    const result = leadsMock.filter((lead) =>
      `${lead.name} ${lead.id}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
    setFilteredLeads(result);
    setPage(1);
  }, [search]);

  const totalEntries = filteredLeads.length;
  const totalPages = Math.ceil(totalEntries / rowsPerPage);

  const currentLeads = filteredLeads.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const startEntry = (page - 1) * rowsPerPage + 1;
  const endEntry = Math.min(page * rowsPerPage, totalEntries);

  const toClass = (value: string) =>
    value.toLowerCase().replace(/\s+/g, "-");

  const tabs = [
    "All Leads",
    "Follow-Ups",
    "Archived Leads",
    "Leads Conversation",
    "Activity",
  ];

  return (
    <Box className="leads-page">
      {/* HEADER */}
      <Stack
        className="leads-header"
        direction="row"
        justifyContent="space-between"
        alignItems="center"
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

      {/* TABS */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons={false}
        className="leads-tabs"
        sx={{ "& .MuiTabs-indicator": { display: "none" } }}
      >
        {tabs.map((label, i) => (
          <Tab key={i} label={label} className="leads-tab" />
        ))}
      </Tabs>

      <br />

      {/* TABLE */}
      <TableContainer component={Paper} className="leads-table" elevation={0}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox />
              </TableCell>
              <TableCell>Lead Name | No</TableCell>
              <TableCell>Current Date | Time</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Lead Source</TableCell>
              <TableCell>Lead Status</TableCell>
              <TableCell>Quality</TableCell>
              <TableCell>AI Score</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Task Type</TableCell>
              <TableCell align="center">Contact Option</TableCell>
              <TableCell align="center" />
            </TableRow>
          </TableHead>

          <TableBody>
            {currentLeads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell padding="checkbox">
                  <Checkbox />
                </TableCell>

                <TableCell>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar className="lead-avatar">{lead.initials}</Avatar>
                    <Box>
                      <Typography fontWeight={600}>{lead.name}</Typography>
                      <Typography className="sub-text">{lead.id}</Typography>
                    </Box>
                  </Stack>
                </TableCell>

                <TableCell>
                  <Typography className="lead-date">{lead.date}</Typography>
                  <Typography className="lead-time">{lead.time}</Typography>
                </TableCell>

                <TableCell>{lead.location}</TableCell>
                <TableCell>{lead.source}</TableCell>

                <TableCell>
                  <Chip
                    label={lead.status}
                    className={`lead-chip status-${toClass(lead.status)}`}
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    label={lead.quality}
                    className={`lead-chip quality-${toClass(lead.quality)}`}
                  />
                </TableCell>

                <TableCell className="score">{lead.score}</TableCell>
                <TableCell>{lead.assigned}</TableCell>
                <TableCell>{lead.task}</TableCell>

                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    {[CallIcon, ChatBubbleOutlineIcon, EmailOutlinedIcon].map(
                      (Icon, i) => (
                        <IconButton key={i} className="action-btn">
                          <Icon fontSize="small" />
                        </IconButton>
                      )
                    )}
                  </Stack>
                </TableCell>

                <TableCell align="center">
                  <Box
  className="three-dot-btn"
  onClick={(e) => handleMenuOpen(e as any, lead)}
>
  <MoreVertIcon fontSize="small" />
</Box>

                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* MENU */}
      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Edit
        </MenuItem>

        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <PersonAddAltOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Reassign
        </MenuItem>

        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <ArchiveOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Archive
        </MenuItem>

        <MenuItem onClick={handleMenuClose} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <DeleteOutlineOutlinedIcon fontSize="small" color="error" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* PAGINATION */}
      <Stack
        className="pagination"
        direction="row"
        justifyContent="space-between"
      >
        <Typography className="sub-text">
          Showing {startEntry} to {endEntry} of {totalEntries} entries
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeftIcon />
          </IconButton>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Box
              key={p}
              className={`page-number ${page === p ? "active" : ""}`}
              onClick={() => setPage(p)}
            >
              {p}
            </Box>
          ))}

          <IconButton
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRightIcon />
          </IconButton>
        </Stack>
      </Stack>

      <FilterDialog
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
      />
    </Box>
  );
};

export default Leads;
