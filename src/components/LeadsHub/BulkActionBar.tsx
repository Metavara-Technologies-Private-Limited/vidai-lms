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
} from "@mui/material";

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
import ChangeHistoryIcon from "@mui/icons-material/ChangeHistory"; // Represents Drive Triangle
import LockClockOutlinedIcon from "@mui/icons-material/LockClockOutlined"; // Represents Lock/Time
import CreateOutlinedIcon from "@mui/icons-material/CreateOutlined"; // Represents Pen

interface Props {
  selectedIds: string[];
  tab: "active" | "archived";
  onDelete: () => void;
  onArchive: (archive: boolean) => void;
  // Callback function to handle sending the finalized email
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

/* ---------- Reusable dialog icon ---------- */
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
  const [openDelete, setOpenDelete] = useState(false);
  const [openArchive, setOpenArchive] = useState(false);
  const [openEmail, setOpenEmail] = useState(false);
  const [openComposer, setOpenComposer] = useState(false);

  // --- State for Functionality ---
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [toAddress, setToAddress] = useState("");
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState(""); // State for the actual message text

  if (selectedIds.length === 0) return null;

  const handleDelete = () => {
    onDelete();
    setOpenDelete(false);
  };

  const handleArchive = () => {
    onArchive(tab === "active");
    setOpenArchive(false);
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
    // Reset state after sending
    setOpenComposer(false);
    setOpenEmail(false);
    setSelectedTemplate(null);
    setToAddress("");
    setSubject("");
    setMessageBody("");
  };

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
      {/* ---------- Action buttons ---------- */}
      <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
        <Button
          variant="outlined"
          startIcon={<DeleteOutlineOutlinedIcon />}
          onClick={() => setOpenDelete(true)}
          sx={{ color: "black", borderColor: "black" }}
        >
          Delete
        </Button>

        <Button
          variant="outlined"
          startIcon={
            tab === "active" ? (
              <ArchiveOutlinedIcon />
            ) : (
              <UnarchiveOutlinedIcon />
            )
          }
          onClick={() => setOpenArchive(true)}
          sx={{ color: "black", borderColor: "black" }}
        >
          {tab === "active" ? "Archive" : "Restore"}
        </Button>

        <Button
          variant="outlined"
          startIcon={<ChatBubbleOutlineIcon />}
          sx={{ color: "black", borderColor: "black" }}
        >
          SMS
        </Button>

        <Button
          variant="outlined"
          startIcon={<EmailOutlinedIcon />}
          sx={{ color: "black", borderColor: "black" }}
          onClick={() => setOpenEmail(true)}
        >
          Email
        </Button>
      </Stack>

      {/* ---------- Delete Dialog ---------- */}
      <Dialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent sx={{ textAlign: "center", pt: 4 }}>
          <DialogIcon
            icon={<DeleteOutlineOutlinedIcon fontSize="large" />}
            bg="#FEE2E2"
            color="#DC2626"
          />

          <Typography variant="h6" fontWeight={600} mb={1}>
            Delete Lead
          </Typography>

          <Typography color="text.secondary">
            This action cannot be undone. Are you sure you want to delete the
            selected lead permanently?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            fullWidth
            onClick={() => setOpenDelete(false)}
            sx={{
              backgroundColor: "#F3F4F6",
              color: "black",
              "&:hover": { backgroundColor: "#E5E7EB" },
            }}
          >
            Cancel
          </Button>

          <Button
            fullWidth
            onClick={handleDelete}
            sx={{
              backgroundColor: "#111827",
              color: "white",
              "&:hover": { backgroundColor: "#000" },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------- Archive / Restore Dialog ---------- */}
      <Dialog
        open={openArchive}
        onClose={() => setOpenArchive(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent sx={{ textAlign: "center", pt: 4 }}>
          <DialogIcon
            icon={
              tab === "active" ? (
                <ArchiveOutlinedIcon fontSize="large" />
              ) : (
                <UnarchiveOutlinedIcon fontSize="large" />
              )
            }
            bg="#FEF3C7"
            color="#D97706"
          />

          <Typography variant="h6" fontWeight={600} mb={1}>
            {tab === "active" ? "Archive Lead" : "Restore Lead"}
          </Typography>

          <Typography color="text.secondary">
            {tab === "active"
              ? "Are you sure you want to archive the selected lead? You can restore it anytime."
              : "Are you sure you want to restore the selected lead?"}
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            fullWidth
            onClick={() => setOpenArchive(false)}
            sx={{
              backgroundColor: "#F3F4F6",
              color: "black",
              "&:hover": { backgroundColor: "#E5E7EB" },
            }}
          >
            Cancel
          </Button>

          <Button
            fullWidth
            onClick={handleArchive}
            sx={{
              backgroundColor: "#111827",
              color: "white",
              "&:hover": { backgroundColor: "#000" },
            }}
          >
            {tab === "active" ? "Archive" : "Restore"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------- Email Selector ---------- */}
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

      {/* ---------- COMPOSE EMAIL ---------- */}
      <Dialog
        open={openComposer}
        onClose={() => setOpenComposer(false)}
        maxWidth="md"
        fullWidth
      >
        {/* Header */}
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

          {/* MESSAGE BODY FIELD - Makes typing possible */}
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

        {/* Footer */}
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
          {/* Left toolbar */}
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
              <Typography fontWeight="bold" fontSize="1.2rem">
                A
              </Typography>
            </IconButton>
            <IconButton size="small">
              <AttachFileOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton size="small">
              <LinkOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton size="small">
              <EmojiEmotionsOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton size="small">
              <ChangeHistoryIcon fontSize="small" />
            </IconButton>
            <IconButton size="small">
              <ImageOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton size="small">
              <LockClockOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton size="small">
              <CreateOutlinedIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Right buttons */}
          <Stack direction="row" spacing={1}>
            <Button
              onClick={() => {
                setOpenComposer(false);
                setOpenEmail(true); // Go back to template selection
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
