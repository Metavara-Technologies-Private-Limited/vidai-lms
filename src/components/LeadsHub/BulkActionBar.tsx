import * as React from "react";
import { useState } from "react";
import {
  Box,
  Stack,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  IconButton,
  Radio,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";

// Main Action Icons
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import UnarchiveOutlinedIcon from "@mui/icons-material/UnarchiveOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";

// Dialog & Compose Icons
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import ChangeHistoryIcon from "@mui/icons-material/ChangeHistory";
import LockClockOutlinedIcon from "@mui/icons-material/LockClockOutlined";
import CreateOutlinedIcon from "@mui/icons-material/CreateOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

// Redux imports
import {
  deleteLeads,
  selectDeletingIds,
  fetchLeads,
} from "../../store/leadSlice";

// API imports
import { LeadAPI } from "../../services/leads.api";

// Dialog component
import ArchiveLeadDialog from "./ArchiveLeadDialog";

interface Props {
  selectedIds: string[];
  tab: "active" | "archived";
  onDelete: () => void;
  onArchive: (archive: boolean) => void;
  onSendEmail?: (
    to: string,
    subject: string,
    body: string,
    templateId?: string,
  ) => void;
}

const templates = [
  { id: "1", title: "IVF Next Steps Form Request" },
  { id: "2", title: "IVF Treatment Information" },
  { id: "3", title: "IVF Follow-Up Reminder" },
  { id: "4", title: "New Consultation Confirmation" },
  { id: "5", title: "Welcome Email – Patient Inquiry" },
];

const DialogIcon = ({
  icon,
  bg,
  color,
}: {
  icon: React.ReactNode;
  bg: string;
  color: string;
}) => (
  <Box
    sx={{
      width: 64,
      height: 64,
      borderRadius: "50%",
      backgroundColor: bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      mx: "auto",
      mb: 2,
    }}
  >
    <Box sx={{ color }}>{icon}</Box>
  </Box>
);

const BulkActionBar: React.FC<Props> = ({
  selectedIds,
  tab,
  onDelete,
  onArchive,
  onSendEmail,
}) => {
  const dispatch = useDispatch();
  const deletingIds = useSelector(selectDeletingIds);

  // Dialog states
  const [openDelete, setOpenDelete] = useState(false);
  const [openArchive, setOpenArchive] = useState(false);
  const [openEmail, setOpenEmail] = useState(false);
  const [openComposer, setOpenComposer] = useState(false);

  // Operation states
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  // Email composer states
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [toAddress, setToAddress] = useState("");
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");

  if (selectedIds.length === 0) return null;

  // Handle Delete
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setDeleteError(null);

      const result = await dispatch(deleteLeads(selectedIds) as any);

      if (deleteLeads.fulfilled.match(result)) {
        await dispatch(fetchLeads() as any);
        setOpenDelete(false);
        onDelete();
      } else {
        const errorMsg = result.payload as string || "Failed to delete leads";
        setDeleteError(errorMsg);
      }
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete leads");
    } finally {
      setIsDeleting(false);
    }
  };

  // ✅ Handle Archive/Unarchive - Direct API calls
  const handleArchiveConfirm = async () => {
    try {
      setIsArchiving(true);
      setArchiveError(null);

      const isArchiveAction = tab === "active";
      
      console.log(
        isArchiveAction
          ? `📦 Archiving ${selectedIds.length} leads (calling inactivate API)...`
          : `📂 Unarchiving ${selectedIds.length} leads (calling activate API)...`
      );

      // ✅ Call the correct API based on tab
      if (isArchiveAction) {
        // Archive: Call inactivate API for each lead
        await Promise.all(
          selectedIds.map((id) => LeadAPI.inactivate(id))
        );
      } else {
        // Unarchive: Call activate API for each lead
        await Promise.all(
          selectedIds.map((id) => LeadAPI.activate(id))
        );
      }

      console.log(
        isArchiveAction
          ? "✅ All leads archived successfully"
          : "✅ All leads unarchived successfully"
      );

      // Refetch leads to update UI
      await dispatch(fetchLeads() as any);

      // Close dialog and clear selection
      setOpenArchive(false);
      onArchive(isArchiveAction);
    } catch (err: any) {
      console.error("❌ Archive/Unarchive error:", err);
      const errorMsg =
        err?.response?.data?.detail ||
        err?.message ||
        `Failed to ${tab === "active" ? "archive" : "unarchive"} leads`;
      setArchiveError(errorMsg);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleSend = () => {
    if (onSendEmail) {
      onSendEmail(
        toAddress,
        subject,
        messageBody,
        selectedTemplate || undefined,
      );
    }
    setOpenComposer(false);
    setOpenEmail(false);
    setSelectedTemplate(null);
    setToAddress("");
    setSubject("");
    setMessageBody("");
  };

  const someDeleting = selectedIds.some((id) => deletingIds.includes(id));
  const anyProcessing = someDeleting || isDeleting || isArchiving;

  return (
    <Box
      sx={{
        position: "sticky",
        bottom: 0,
        backgroundColor: "#fff",
        borderTop: "1px solid #E5E7EB",
        py: 1.5,
        px: 2,
        mt: 2,
        zIndex: 20,
      }}
    >
      <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
        <Button
          variant="outlined"
          startIcon={
            someDeleting || isDeleting ? (
              <CircularProgress size={16} sx={{ color: "black" }} />
            ) : (
              <DeleteOutlineOutlinedIcon />
            )
          }
          onClick={() => {
            setOpenDelete(true);
            setDeleteError(null);
          }}
          disabled={anyProcessing}
          sx={{
            color: "black",
            borderColor: "black",
            "&:disabled": {
              color: "#9CA3AF",
              borderColor: "#E5E7EB",
            },
          }}
        >
          {someDeleting || isDeleting ? "Deleting..." : "Delete"}
        </Button>

        <Button
          variant="outlined"
          startIcon={
            isArchiving ? (
              <CircularProgress size={16} sx={{ color: "black" }} />
            ) : tab === "active" ? (
              <ArchiveOutlinedIcon />
            ) : (
              <UnarchiveOutlinedIcon />
            )
          }
          onClick={() => {
            setOpenArchive(true);
            setArchiveError(null);
          }}
          disabled={anyProcessing}
          sx={{
            color: "black",
            borderColor: "black",
            "&:disabled": {
              color: "#9CA3AF",
              borderColor: "#E5E7EB",
            },
          }}
        >
          {isArchiving
            ? tab === "active"
              ? "Archiving..."
              : "Restoring..."
            : tab === "active"
            ? "Archive"
            : "Restore"}
        </Button>

        <Button
          variant="outlined"
          startIcon={<ChatBubbleOutlineIcon />}
          disabled={anyProcessing}
          sx={{
            color: "black",
            borderColor: "black",
            "&:disabled": {
              color: "#9CA3AF",
              borderColor: "#E5E7EB",
            },
          }}
        >
          SMS
        </Button>

        <Button
          variant="outlined"
          startIcon={<EmailOutlinedIcon />}
          onClick={() => setOpenEmail(true)}
          disabled={anyProcessing}
          sx={{
            color: "black",
            borderColor: "black",
            "&:disabled": {
              color: "#9CA3AF",
              borderColor: "#E5E7EB",
            },
          }}
        >
          Email
        </Button>
      </Stack>

      {/* Delete Dialog */}
      <Dialog
        open={openDelete}
        onClose={() => !isDeleting && setOpenDelete(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent sx={{ textAlign: "center", pt: 4 }}>
          <DialogIcon
            icon={<DeleteOutlineOutlinedIcon fontSize="large" />}
            bg="#FEE2E2"
            color="#DC2626"
          />

          <Typography variant="h6" fontWeight={600} mb={1}>
            Delete {selectedIds.length} Lead{selectedIds.length > 1 ? "s" : ""}
          </Typography>

          {deleteError && (
            <Alert severity="error" sx={{ mb: 2, textAlign: "left" }}>
              <Typography variant="body2" fontWeight={600}>
                {deleteError}
              </Typography>
            </Alert>
          )}

          <Typography color="text.secondary" sx={{ mb: 2 }}>
            This action cannot be undone. Are you sure you want to delete{" "}
            {selectedIds.length > 1 ? "these leads" : "this lead"} permanently?
          </Typography>

          <Box
            sx={{
              p: 2,
              bgcolor: "#FEE2E2",
              borderRadius: 2,
              border: "1px solid #FCA5A5",
              maxHeight: "150px",
              overflowY: "auto",
              mb: 2,
              textAlign: "left",
            }}
          >
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }} color="#991B1B">
              Selected leads:
            </Typography>
            {selectedIds.slice(0, 10).map((id) => (
              <Typography
                key={id}
                variant="caption"
                sx={{ display: "block" }}
                color="text.secondary"
              >
                • {id}
              </Typography>
            ))}
            {selectedIds.length > 10 && (
              <Typography variant="caption" color="text.secondary">
                ... and {selectedIds.length - 10} more
              </Typography>
            )}
          </Box>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              p: 1.5,
              bgcolor: "#FEF3C7",
              borderRadius: 2,
              border: "1px solid #FCD34D",
              textAlign: "left",
            }}
          >
            <WarningAmberIcon sx={{ color: "#D97706", fontSize: 20, mt: 0.2 }} />
            <Typography variant="caption" color="#92400E">
              All selected leads will be permanently removed from the system.
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            fullWidth
            onClick={() => setOpenDelete(false)}
            disabled={isDeleting}
            sx={{
              backgroundColor: "#F3F4F6",
              color: "black",
              "&:hover": { backgroundColor: "#E5E7EB" },
              "&:disabled": {
                backgroundColor: "#F9FAFB",
                color: "#D1D5DB",
              },
            }}
          >
            Cancel
          </Button>

          <Button
            fullWidth
            onClick={handleDelete}
            disabled={isDeleting}
            startIcon={
              isDeleting ? (
                <CircularProgress size={16} sx={{ color: "white" }} />
              ) : (
                <DeleteOutlineOutlinedIcon />
              )
            }
            sx={{
              backgroundColor: "#DC2626",
              color: "white",
              "&:hover": { backgroundColor: "#B91C1C" },
              "&:disabled": {
                backgroundColor: "#FCA5A5",
                color: "white",
              },
            }}
          >
            {isDeleting
              ? `Deleting ${selectedIds.length}...`
              : `Delete ${selectedIds.length} Lead${selectedIds.length > 1 ? "s" : ""}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Archive/Unarchive Dialog */}
      <ArchiveLeadDialog
        open={openArchive}
        onClose={() => !isArchiving && setOpenArchive(false)}
        leadName={
          selectedIds.length === 1
            ? selectedIds[0]
            : `${selectedIds.length} leads`
        }
        onConfirm={handleArchiveConfirm}
        isUnarchive={tab === "archived"}
      />

      {/* Email Selector Dialog */}
      <Dialog
        open={openEmail}
        onClose={() => setOpenEmail(false)}
        maxWidth="md"
        fullWidth
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Typography fontWeight={600}>New Email</Typography>
          <IconButton onClick={() => setOpenEmail(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent>
          <Box
            sx={{
              border: "1px dashed #D1D5DB",
              borderRadius: 2,
              py: 4,
              textAlign: "center",
              cursor: "pointer",
              mb: 3,
            }}
            onClick={() => {
              setOpenEmail(false);
              setOpenComposer(true);
            }}
          >
            <EditOutlinedIcon />
            <Typography fontWeight={500} mt={1}>
              Compose New Email
            </Typography>
          </Box>

          <Divider sx={{ mb: 2 }}>OR</Divider>

          <Typography fontSize={13} fontWeight={500} mb={1}>
            Select Email Template
          </Typography>

          {templates.map((t) => (
            <Box
              key={t.id}
              sx={{
                display: "flex",
                alignItems: "center",
                py: 2,
                borderBottom: "1px solid #F3F4F6",
                cursor: "pointer",
              }}
              onClick={() => setSelectedTemplate(t.id)}
            >
              <Radio
                checked={selectedTemplate === t.id}
                onChange={() => setSelectedTemplate(t.id)}
              />
              <Typography flex={1}>{t.title}</Typography>
              <VisibilityOutlinedIcon sx={{ color: "#6B7280" }} />
            </Box>
          ))}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setOpenEmail(false)}
            variant="outlined"
            sx={{
              borderColor: "#D1D5DB",
              color: "#374151",
              "&:hover": {
                borderColor: "#9CA3AF",
                backgroundColor: "#F9FAFB",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setOpenEmail(false);
              setOpenComposer(true);
            }}
            variant="contained"
            disabled={!selectedTemplate}
            sx={{
              backgroundColor: "#111827",
              "&:hover": { backgroundColor: "#000" },
            }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Compose Email Dialog */}
      <Dialog
        open={openComposer}
        onClose={() => setOpenComposer(false)}
        maxWidth="md"
        fullWidth
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography fontWeight={600}>New Email</Typography>
          <IconButton onClick={() => setOpenComposer(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 3 }}>
          <TextField
            fullWidth
            variant="standard"
            placeholder="To :"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            InputProps={{ disableUnderline: true }}
            sx={{ py: 1, borderBottom: "1px solid #E5E7EB" }}
          />

          <TextField
            fullWidth
            variant="standard"
            placeholder="Subject :"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            InputProps={{ disableUnderline: true }}
            sx={{ py: 1, borderBottom: "1px solid #E5E7EB", mt: 1 }}
          />

          <TextField
            fullWidth
            multiline
            rows={10}
            variant="outlined"
            placeholder="Type your message here..."
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            sx={{ mt: 2, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
        </DialogContent>

        <Box
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid #E5E7EB",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              border: "1px solid #E5E7EB",
              borderRadius: 2,
              px: 1,
              py: 0.5,
            }}
          >
            <IconButton size="small">
              <Typography fontWeight="bold" fontSize="1.2rem">A</Typography>
            </IconButton>
            <IconButton size="small"><AttachFileOutlinedIcon fontSize="small" /></IconButton>
            <IconButton size="small"><LinkOutlinedIcon fontSize="small" /></IconButton>
            <IconButton size="small"><EmojiEmotionsOutlinedIcon fontSize="small" /></IconButton>
            <IconButton size="small"><ChangeHistoryIcon fontSize="small" /></IconButton>
            <IconButton size="small"><ImageOutlinedIcon fontSize="small" /></IconButton>
            <IconButton size="small"><LockClockOutlinedIcon fontSize="small" /></IconButton>
            <IconButton size="small"><CreateOutlinedIcon fontSize="small" /></IconButton>
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              onClick={() => {
                setOpenComposer(false);
                setOpenEmail(true);
              }}
              variant="outlined"
              sx={{
                borderColor: "#D1D5DB",
                color: "#374151",
                "&:hover": {
                  borderColor: "#9CA3AF",
                  backgroundColor: "#F9FAFB",
                },
              }}
            >
              Back
            </Button>

            <Button
              variant="contained"
              disabled
              sx={{
                backgroundColor: "#F3F4F6",
                color: "#9CA3AF",
                "&:hover": { backgroundColor: "#F3F4F6" },
              }}
            >
              Save as Template
            </Button>

            <Button
              variant="contained"
              endIcon={<SendOutlinedIcon />}
              onClick={handleSend}
              disabled={!toAddress || !subject || !messageBody}
              sx={{
                backgroundColor: "#4B5563",
                "&:hover": { backgroundColor: "#374151" },
              }}
            >
              Send
            </Button>
          </Stack>
        </Box>
      </Dialog>
    </Box>
  );
};

export default BulkActionBar;