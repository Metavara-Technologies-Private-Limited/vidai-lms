import * as React from "react";
import { Menu, MenuItem, IconButton, ListItemIcon } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

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

import { deleteLead, selectIsLeadDeleting, fetchLeads } from "../../store/leadSlice";
import { LeadAPI } from "../../services/leads.api";
import type { AppDispatch } from "../../store";

export interface Lead {
  id: string;
  full_name?: string;
  name?: string;
  is_active?: boolean;
}

interface AxiosLikeError extends Error {
  response?: { data?: { detail?: string } };
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    const axiosErr = err as AxiosLikeError;
    return axiosErr?.response?.data?.detail || axiosErr.message || fallback;
  }
  return fallback;
}

interface MenuProps<T extends Lead> {
  lead: T;
  setLeads: React.Dispatch<React.SetStateAction<T[]>>;
  tab: "active" | "archived";
}

let openCallSetter: ((name: string) => void) | null = null;

export const CallButton = ({ lead }: { lead: Lead }) => (
  <IconButton onClick={() => openCallSetter?.(lead.full_name || lead.name || "")}>
    <CallIcon fontSize="small" />
  </IconButton>
);

export function MenuButton<T extends Lead>({ lead, setLeads, tab }: MenuProps<T>) {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [openArchive, setOpenArchive] = React.useState(false);
  const [openDelete, setOpenDelete] = React.useState(false);
  const [openReassign, setOpenReassign] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [archiveError, setArchiveError] = React.useState<string | null>(null);
  const [isArchiving, setIsArchiving] = React.useState(false);

  const isDeleting = useSelector(selectIsLeadDeleting(lead.id));

  const getCleanLeadId = (leadId: string) => {
    return leadId.replace("#", "").replace("LN-", "").replace("LD-", "");
  };

  const leadName = lead.full_name || lead.name || "";

  const handleDeleteConfirm = async () => {
    try {
      setDeleteError(null);
      const result = await dispatch(deleteLead(lead.id));
      if (deleteLead.fulfilled.match(result)) {
        setLeads((prev) => prev.filter((l) => l.id !== lead.id));
        setOpenDelete(false);
        await dispatch(fetchLeads());
        window.dispatchEvent(new CustomEvent("lead-deleted", { detail: { id: lead.id } }));
      } else {
        const errMsg = typeof result.payload === "string" ? result.payload : "Failed to delete lead";
        setDeleteError(errMsg);
      }
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err, "Failed to delete lead"));
    }
  };

  const handleArchiveConfirm = async () => {
    try {
      setIsArchiving(true);
      setArchiveError(null);
      await LeadAPI.inactivate(lead.id);
      await dispatch(fetchLeads());
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, is_active: false } : l)));
      setOpenArchive(false);
    } catch (err: unknown) {
      setArchiveError(getErrorMessage(err, "Failed to archive lead"));
    } finally {
      setIsArchiving(false);
    }
  };

  const handleUnarchiveConfirm = async () => {
    try {
      setIsArchiving(true);
      setArchiveError(null);
      await LeadAPI.activate(lead.id);
      await dispatch(fetchLeads());
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, is_active: true } : l)));
      setAnchorEl(null);
    } catch (err: unknown) {
      setArchiveError(getErrorMessage(err, "Failed to unarchive lead"));
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {tab === "active" && (
          <>
            <MenuItem
              onClick={() => { navigate(`/leads/edit/${getCleanLeadId(lead.id)}`, { state: { lead } }); setAnchorEl(null); }}
              disabled={isDeleting || isArchiving}
            >
              <ListItemIcon><EditOutlinedIcon fontSize="small" /></ListItemIcon>
              Edit
            </MenuItem>

            <MenuItem
              onClick={() => { setOpenReassign(true); setAnchorEl(null); }}
              disabled={isDeleting || isArchiving}
            >
              <ListItemIcon><PersonAddAltOutlinedIcon fontSize="small" /></ListItemIcon>
              Reassign
            </MenuItem>

            <MenuItem
              onClick={() => { setOpenArchive(true); setArchiveError(null); setAnchorEl(null); }}
              disabled={isDeleting || isArchiving}
            >
              <ListItemIcon><ArchiveOutlinedIcon fontSize="small" /></ListItemIcon>
              {isArchiving ? "Archiving..." : "Archive"}
            </MenuItem>

            <MenuItem
              sx={{ color: "error.main" }}
              onClick={() => { setOpenDelete(true); setDeleteError(null); setAnchorEl(null); }}
              disabled={isDeleting || isArchiving}
            >
              <ListItemIcon><DeleteOutlineOutlinedIcon fontSize="small" sx={{ color: "error.main" }} /></ListItemIcon>
              {isDeleting ? "Deleting..." : "Delete"}
            </MenuItem>
          </>
        )}

        {tab === "archived" && (
          <>
            <MenuItem onClick={handleUnarchiveConfirm} disabled={isDeleting || isArchiving}>
              <ListItemIcon><UnarchiveOutlinedIcon fontSize="small" /></ListItemIcon>
              {isArchiving ? "Restoring..." : "Unarchive"}
            </MenuItem>

            <MenuItem
              sx={{ color: "error.main" }}
              onClick={() => { setOpenDelete(true); setDeleteError(null); setAnchorEl(null); }}
              disabled={isDeleting || isArchiving}
            >
              <ListItemIcon><DeleteOutlineOutlinedIcon fontSize="small" sx={{ color: "error.main" }} /></ListItemIcon>
              {isDeleting ? "Deleting..." : "Delete"}
            </MenuItem>
          </>
        )}
      </Menu>

      <ArchiveLeadDialog
        open={openArchive}
        leadName={leadName}
        onClose={() => !isArchiving && setOpenArchive(false)}
        onConfirm={handleArchiveConfirm}
        isUnarchive={false}
        isArchiving={isArchiving}
        error={archiveError}
      />

      {/* ── leadId prop removed — no longer in DeleteLeadDialog Props ── */}
      <DeleteLeadDialog
        open={openDelete}
        leadName={leadName}
        isDeleting={isDeleting}
        error={deleteError}
        onClose={() => { setOpenDelete(false); setDeleteError(null); }}
        onConfirm={handleDeleteConfirm}
      />

      <ReassignAssigneeDialog
        open={openReassign}
        lead={lead}
        onClose={() => setOpenReassign(false)}
      />
    </>
  );
}

export const Dialogs = () => {
  const [openCall, setOpenCall] = React.useState(false);
  const [name, setName] = React.useState("");

  React.useEffect(() => {
    openCallSetter = (leadName: string) => {
      setName(leadName);
      setOpenCall(true);
    };
  }, []);

  return <CallDialog open={openCall} name={name} onClose={() => setOpenCall(false)} />;
};