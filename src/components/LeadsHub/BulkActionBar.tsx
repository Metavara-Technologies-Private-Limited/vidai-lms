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
} from "@mui/material";

import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import UnarchiveOutlinedIcon from "@mui/icons-material/UnarchiveOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";

interface Props {
  selectedIds: string[];
  tab: "active" | "archived";
  onDelete: () => void;
  onArchive: (archive: boolean) => void;
}

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
}) => {
  const [openDelete, setOpenDelete] = useState(false);
  const [openArchive, setOpenArchive] = useState(false);

  if (selectedIds.length === 0) return null;

  const handleDelete = () => {
    onDelete();
    setOpenDelete(false);
  };

  const handleArchive = () => {
    onArchive(tab === "active");
    setOpenArchive(false);
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

        {tab === "active" ? (
          <Button
            variant="outlined"
            startIcon={<ArchiveOutlinedIcon />}
            onClick={() => setOpenArchive(true)}
            sx={{ color: "black", borderColor: "black" }}
          >
            Archive
          </Button>
        ) : (
          <Button
            variant="outlined"
            startIcon={<UnarchiveOutlinedIcon />}
            onClick={() => setOpenArchive(true)}
            sx={{ color: "black", borderColor: "black" }}
          >
            Restore
          </Button>
        )}

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
    </Box>
  );
};

export default BulkActionBar;
