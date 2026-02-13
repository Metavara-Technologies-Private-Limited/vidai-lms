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
import type { Lead } from "../../types/leads.types";

// ✅ Import delete actions from Redux
import { deleteLead, selectIsLeadDeleting } from "../../store/leadSlice";

interface MenuProps {
  lead: Lead;
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  tab: "active" | "archived";
}

let openCallSetter: ((name: string) => void) | null = null;

/* ---------------- CALL BUTTON ---------------- */
export const CallButton = ({ lead }: { lead: Lead }) => (
  <IconButton onClick={() => openCallSetter?.(lead.full_name || lead.name)}>
    <CallIcon fontSize="small" />
  </IconButton>
);

/* ---------------- MENU BUTTON ---------------- */
export const MenuButton: React.FC<MenuProps> = ({ lead, setLeads, tab }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [openArchive, setOpenArchive] = React.useState(false);
  const [openDelete, setOpenDelete] = React.useState(false);
  const [openReassign, setOpenReassign] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // ✅ Check if this lead is being deleted
  const isDeleting = useSelector(selectIsLeadDeleting(lead.id));

  // Helper function to clean lead ID for URL
  const getCleanLeadId = (leadId: string) => {
    return leadId.replace("#", "").replace("LN-", "").replace("LD-", "");
  };

  // ✅ Handle delete with API integration
  const handleDeleteConfirm = async () => {
    try {
      setDeleteError(null);

      console.log("🗑️ Deleting lead:", lead.id);

      // Dispatch delete action to Redux
      const result = await dispatch(deleteLead(lead.id) as any);

      if (deleteLead.fulfilled.match(result)) {
        console.log("✅ Lead deleted successfully");
        
        // ✅ Redux already removed it from state
        // Just update local state for immediate UI feedback
        setLeads((prev) => prev.filter((l) => l.id !== lead.id));
        setOpenDelete(false);

        // Emit event for sync with other components
        const event = new CustomEvent("lead-deleted", {
          detail: { id: lead.id },
        });
        window.dispatchEvent(event);
      } else {
        // Error - show message in dialog
        console.error("❌ Delete failed:", result.payload);
        setDeleteError(result.payload as string || "Failed to delete lead");
      }
    } catch (err: any) {
      console.error("❌ Delete error:", err);
      setDeleteError(err.message || "Failed to delete lead");
    }
  };

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {/* 🔵 ACTIVE LEADS MENU */}
        {tab === "active" && (
          <>
            <MenuItem
              onClick={() => {
                navigate(`/leads/edit/${getCleanLeadId(lead.id)}`, {
                  state: { lead },
                });
                setAnchorEl(null);
              }}
              disabled={isDeleting}
            >
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
              disabled={isDeleting}
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
              disabled={isDeleting}
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
                setDeleteError(null);
                setAnchorEl(null);
              }}
              disabled={isDeleting}
            >
              <ListItemIcon>
                <DeleteOutlineOutlinedIcon 
                  fontSize="small" 
                  sx={{ color: "error.main" }}
                />
              </ListItemIcon>
              {isDeleting ? "Deleting..." : "Delete"}
            </MenuItem>
          </>
        )}

        {/* 🟠 ARCHIVED LEADS MENU */}
        {tab === "archived" && (
          <>
            <MenuItem
              onClick={() => {
                setLeads((prev) =>
                  prev.map((l) =>
                    l.id === lead.id ? { ...l, archived: false } : l
                  )
                );
                setAnchorEl(null);
              }}
              disabled={isDeleting}
            >
              <ListItemIcon>
                <UnarchiveOutlinedIcon fontSize="small" />
              </ListItemIcon>
              Unarchive
            </MenuItem>

            <MenuItem
              sx={{ color: "error.main" }}
              onClick={() => {
                setOpenDelete(true);
                setDeleteError(null);
                setAnchorEl(null);
              }}
              disabled={isDeleting}
            >
              <ListItemIcon>
                <DeleteOutlineOutlinedIcon 
                  fontSize="small" 
                  sx={{ color: "error.main" }}
                />
              </ListItemIcon>
              {isDeleting ? "Deleting..." : "Delete"}
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Archive Dialog */}
      <ArchiveLeadDialog
        open={openArchive}
        leadName={lead.full_name || lead.name}
        onClose={() => setOpenArchive(false)}
        onConfirm={() => {
          setLeads((prev) =>
            prev.map((l) =>
              l.id === lead.id ? { ...l, archived: true } : l
            )
          );
          setOpenArchive(false);
        }}
      />

      {/* Delete Dialog */}
      <DeleteLeadDialog
        open={openDelete}
        leadName={lead.full_name || lead.name}
        leadId={lead.id}
        isDeleting={isDeleting}
        error={deleteError}
        onClose={() => {
          setOpenDelete(false);
          setDeleteError(null);
        }}
        onConfirm={handleDeleteConfirm}
      />

      {/* Reassign Dialog */}
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
    <CallDialog
      open={openCall}
      name={name}
      onClose={() => setOpenCall(false)}
    />
  );
};