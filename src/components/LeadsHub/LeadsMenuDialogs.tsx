import * as React from "react";
import { Menu, MenuItem, IconButton, ListItemIcon } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import UnarchiveOutlinedIcon from "@mui/icons-material/UnarchiveOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import CallIcon from "@mui/icons-material/Call";

import ArchiveLeadDialog from "../../components/LeadsHub/ArchiveLeadDialog";
import DeleteLeadDialog from "../../components/LeadsHub/DeleteLeadDialog";
import ReassignAssigneeDialog from "../../components/LeadsHub/ReassignAssigneeDialog";
import CallDialog from "../../components/LeadsHub/CallDialog";
import type { Lead } from "../../types/leads.types";

interface MenuProps {
  lead: Lead;
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  tab: "active" | "archived";
}

let openCallSetter: ((name: string) => void) | null = null;

/* ---------------- CALL BUTTON ---------------- */
export const CallButton = ({ lead }: { lead: Lead }) => (
  <IconButton onClick={() => openCallSetter?.(lead.name)}>
    <CallIcon fontSize="small" />
  </IconButton>
);

/* ---------------- MENU BUTTON ---------------- */
export const MenuButton: React.FC<MenuProps> = ({ lead, setLeads, tab }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [openArchive, setOpenArchive] = React.useState(false);
  const [openDelete, setOpenDelete] = React.useState(false);
  const [openReassign, setOpenReassign] = React.useState(false);

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>

        {/* 🔵 ACTIVE LEADS MENU */}
        {tab === "active" && (
          <>
            <MenuItem onClick={() => { /* navigate to edit page */ setAnchorEl(null); }}>
              <ListItemIcon>
                <EditOutlinedIcon fontSize="small" />
              </ListItemIcon>
              Edit
            </MenuItem>

            <MenuItem onClick={() => { setOpenReassign(true); setAnchorEl(null); }}>
              <ListItemIcon>
                <PersonAddAltOutlinedIcon fontSize="small" />
              </ListItemIcon>
              Reassign
            </MenuItem>

            <MenuItem onClick={() => { setOpenArchive(true); setAnchorEl(null); }}>
              <ListItemIcon>
                <ArchiveOutlinedIcon fontSize="small" />
              </ListItemIcon>
              Archive
            </MenuItem>

            <MenuItem sx={{ color: "error.main" }} onClick={() => { setOpenDelete(true); setAnchorEl(null); }}>
              <ListItemIcon>
                <DeleteOutlineOutlinedIcon fontSize="small" />
              </ListItemIcon>
              Delete
            </MenuItem>
          </>
        )}

        {/* 🟠 ARCHIVED LEADS MENU */}
        {tab === "archived" && (
          <>
            <MenuItem
              onClick={() => {
                setLeads(prev =>
                  prev.map(l => (l.id === lead.id ? { ...l, archived: false } : l))
                );
                setAnchorEl(null);
              }}
            >
              <ListItemIcon>
                <UnarchiveOutlinedIcon fontSize="small" />
              </ListItemIcon>
              Unarchive
            </MenuItem>

            <MenuItem sx={{ color: "error.main" }} onClick={() => { setOpenDelete(true); setAnchorEl(null); }}>
              <ListItemIcon>
                <DeleteOutlineOutlinedIcon fontSize="small" />
              </ListItemIcon>
              Delete
            </MenuItem>
          </>
        )}

      </Menu>

      <ArchiveLeadDialog
        open={openArchive}
        leadName={lead.name}
        onClose={() => setOpenArchive(false)}
        onConfirm={() => {
          setLeads(prev =>
            prev.map(l => (l.id === lead.id ? { ...l, archived: true } : l))
          );
          setOpenArchive(false);
        }}
      />

      <DeleteLeadDialog
        open={openDelete}
        leadName={lead.name}
        onClose={() => setOpenDelete(false)}
        onConfirm={() => {
          setLeads(prev => prev.filter(l => l.id !== lead.id));
          setOpenDelete(false);
        }}
      />

      <ReassignAssigneeDialog
        open={openReassign}
        lead={lead}
        onClose={() => setOpenReassign(false)}
      />
    </>
  );
};

/* ---------------- CALL DIALOG ---------------- */
export const Dialogs = () => {
  const [openCall, setOpenCall] = React.useState(false);
  const [name, setName] = React.useState("");

  React.useEffect(() => {
    openCallSetter = (leadName: string) => {
      setName(leadName);
      setOpenCall(true);
    };
  }, []);

  return (
    <CallDialog open={openCall} name={name} onClose={() => setOpenCall(false)} />
  );
};