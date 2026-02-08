import * as React from "react";
import {
  Box,
  Checkbox,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Avatar,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import CallIcon from "@mui/icons-material/Call";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

import { leadsMock } from "./leadsMock";
import "../../styles/Leads/leads.css";

import ReassignAssigneeDialog from "../../components/LeadsHub/ReassignAssigneeDialog";
import ArchiveLeadDialog from "../../components/LeadsHub/ArchiveLeadDialog";
import DeleteLeadDialog from "../../components/LeadsHub/DeleteLeadDialog";
import CallDialog from "../../components/LeadsHub/CallDialog";

import type { Lead } from "../../types/leads.types";

interface Props {
  search: string;
}

const statusClass = (status: string) =>
  `lead-chip status-${status.toLowerCase().replace(/\s+/g, "-")}`;

const qualityClass = (quality: string) =>
  `lead-chip quality-${quality.toLowerCase()}`;

const LeadsTable: React.FC<Props> = ({ search }) => {
  const navigate = useNavigate();
  const rowsPerPage = 10;

  // ================= STATE =================
  const [page, setPage] = React.useState(1);
  const [filteredLeads, setFilteredLeads] = React.useState(leadsMock);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);

  const [openArchive, setOpenArchive] = React.useState(false);
  const [openReassign, setOpenReassign] = React.useState(false);
  const [openDelete, setOpenDelete] = React.useState(false);

  const [openCall, setOpenCall] = React.useState(false);
  const [callLeadName, setCallLeadName] = React.useState("");

  // ================= EFFECT =================
  React.useEffect(() => {
    const result = leadsMock.filter((lead) =>
      `${lead.name} ${lead.id}`.toLowerCase().includes(search.toLowerCase()),
    );
    setFilteredLeads(result);
    setPage(1);
  }, [search]);

  // ================= PAGINATION =================
  const totalEntries = filteredLeads.length;
  const totalPages = Math.ceil(totalEntries / rowsPerPage);

  const currentLeads = filteredLeads.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );

  const startEntry = (page - 1) * rowsPerPage + 1;
  const endEntry = Math.min(page * rowsPerPage, totalEntries);

  // ================= STICKY =================
  const stickyContact = {
    position: "sticky",
    right: 60,
    background: "#fff",
    zIndex: 2,
    minWidth: 120,
  };

  const stickyMenu = {
    position: "sticky",
    right: 0,
    background: "#fff",
    zIndex: 3,
    width: 60,
  };

  return (
    <>
      {/* ================= TABLE ================= */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          overflowX: "auto", // ✅ horizontal scroll
          overflowY: "hidden", // ❌ no vertical scroll
        }}
      >
        <Table stickyHeader sx={{ minWidth: 1800 }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox />
              </TableCell>
              <TableCell>Lead Name | No</TableCell>
              <TableCell>Date | Time</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Quality</TableCell>
              <TableCell>AI Score</TableCell>
              <TableCell>Assigned</TableCell>
              <TableCell>Task Type</TableCell>
              <TableCell>Task Status</TableCell>
              <TableCell>Activity</TableCell>
              <TableCell align="center" sx={stickyContact}>
                Contact
              </TableCell>
              <TableCell align="center" sx={stickyMenu} />
            </TableRow>
          </TableHead>

          <TableBody>
            {currentLeads.map((lead) => (
              <TableRow key={lead.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox />
                </TableCell>

                <TableCell>
                  <Stack direction="row" spacing={2}>
                    <Avatar>{lead.initials}</Avatar>
                    <Box>
                      <Typography fontWeight={600}>{lead.name}</Typography>
                      <Typography variant="caption">{lead.id}</Typography>
                    </Box>
                  </Stack>
                </TableCell>

                <TableCell>
                  <Typography>{lead.date}</Typography>
                  <Typography variant="caption">{lead.time}</Typography>
                </TableCell>

                <TableCell>{lead.location}</TableCell>
                <TableCell>{lead.source}</TableCell>

                <TableCell>
                  <Chip
                    label={lead.status}
                    className={statusClass(lead.status)}
                    size="small"
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    label={lead.quality}
                    className={qualityClass(lead.quality)}
                    size="small"
                  />
                </TableCell>

                <TableCell>{lead.score}</TableCell>
                <TableCell>{lead.assigned}</TableCell>
                <TableCell>{lead.task}</TableCell>

                <TableCell>
                  <Chip label={lead.taskStatus || "Pending"} size="small" />
                </TableCell>

                <TableCell
                  sx={{ cursor: "pointer", color: "primary.main" }}
                  onClick={() =>
                    navigate("/leads/activity", { state: { lead } })
                  }
                >
                  {lead.activity || "View Activity"}
                </TableCell>

                {/* CONTACT */}
                <TableCell align="center" sx={stickyContact}>
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <IconButton
                      onClick={() => {
                        setCallLeadName(lead.name);
                        setOpenCall(true);
                      }}
                    >
                      <CallIcon fontSize="small" />
                    </IconButton>

                    <IconButton>
                      <ChatBubbleOutlineIcon fontSize="small" />
                    </IconButton>

                    <IconButton>
                      <EmailOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>

                {/* MENU */}
                <TableCell align="center" sx={stickyMenu}>
                  <IconButton
                    onClick={(e) => {
                      setAnchorEl(e.currentTarget);
                      setSelectedLead(lead);
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ================= PAGINATION ================= */}
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
        <Typography>
          Showing {startEntry} to {endEntry} of {totalEntries}
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
              onClick={() => setPage(p)}
              className={`page-number ${page === p ? "active" : ""}`}
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

      {/* ================= MENU ================= */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem>
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Edit
        </MenuItem>

        <MenuItem
          onClick={() => {
            setOpenReassign(true);
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <PersonAddAltOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Reassign
        </MenuItem>

        <MenuItem
          onClick={() => {
            setOpenArchive(true);
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <ArchiveOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Archive
        </MenuItem>

        <MenuItem
          sx={{ color: "error.main" }}
          onClick={() => {
            setOpenDelete(true);
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <DeleteOutlineOutlinedIcon fontSize="small" color="error" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* ================= DIALOGS ================= */}
      <ReassignAssigneeDialog
        open={openReassign}
        lead={selectedLead}
        onClose={() => setOpenReassign(false)}
      />

      <ArchiveLeadDialog
        open={openArchive}
        leadName={selectedLead?.name}
        onClose={() => setOpenArchive(false)}
        onConfirm={() => setOpenArchive(false)}
      />

      <DeleteLeadDialog
        open={openDelete}
        leadName={selectedLead?.name}
        onClose={() => setOpenDelete(false)}
        onConfirm={() => setOpenDelete(false)}
      />

      <CallDialog
        open={openCall}
        name={callLeadName}
        onClose={() => setOpenCall(false)}
      />
    </>
  );
};

export default LeadsTable;
