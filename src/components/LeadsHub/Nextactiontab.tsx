import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Card,
  Chip,
  Divider,
  Button,
  IconButton,
  TextField,
  CircularProgress,
  Alert,
  MenuItem,
  Dialog,
  DialogContent,
} from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import SendIcon from "@mui/icons-material/Send";

import { CallButton } from "./LeadsMenuDialogs";
import type { LeadRecord, NoteData } from "./LeadDetailTypes";

interface NextActionTabProps {
  lead: LeadRecord;
  // Next action fields
  nextActionType: string;
  nextActionStatus: string;
  nextActionDescription: string;
  isAppointment: boolean;
  isFollowUp: boolean;
  availableActions: { value: string; label: string }[];
  // Add action dialog
  openAddActionDialog: boolean;
  setOpenAddActionDialog: (open: boolean) => void;
  actionType: string;
  setActionType: (v: string) => void;
  actionStatus: string;
  setActionStatus: (v: string) => void;
  actionDescription: string;
  setActionDescription: (v: string) => void;
  actionSubmitting: boolean;
  actionError: string | null;
  setActionError: (err: string | null) => void;
  onAddNextAction: () => void;
  onCloseActionDialog: () => void;
  // Notes
  notes: NoteData[];
  notesLoading: boolean;
  notesError: string | null;
  setNotesError: (err: string | null) => void;
  editingNoteId: string | null;
  editTitle: string;
  setEditTitle: (v: string) => void;
  editContent: string;
  setEditContent: (v: string) => void;
  editSubmitting: boolean;
  newNoteTitle: string;
  setNewNoteTitle: (v: string) => void;
  newNoteContent: string;
  setNewNoteContent: (v: string) => void;
  noteSubmitting: boolean;
  deleteNoteDialog: string | null;
  setDeleteNoteDialog: (id: string | null) => void;
  onStartEditNote: (note: NoteData) => void;
  onCancelEditNote: () => void;
  onSaveEditNote: (noteId: string) => void;
  onAddNote: () => void;
  onDeleteNote: (noteId: string) => void;
}

const NextActionTab: React.FC<NextActionTabProps> = ({
  lead,
  nextActionType,
  nextActionStatus,
  nextActionDescription,
  isAppointment,
  isFollowUp,
  availableActions,
  openAddActionDialog,
  setOpenAddActionDialog,
  actionType,
  setActionType,
  actionStatus,
  setActionStatus,
  actionDescription,
  setActionDescription,
  actionSubmitting,
  actionError,
  setActionError,
  onAddNextAction,
  onCloseActionDialog,
  notes,
  notesLoading,
  notesError,
  setNotesError,
  editingNoteId,
  editTitle,
  setEditTitle,
  editContent,
  setEditContent,
  editSubmitting,
  newNoteTitle,
  setNewNoteTitle,
  newNoteContent,
  setNewNoteContent,
  noteSubmitting,
  deleteNoteDialog,
  setDeleteNoteDialog,
  onStartEditNote,
  onCancelEditNote,
  onSaveEditNote,
  onAddNote,
  onDeleteNote,
}) => {
  return (
    <Stack direction="row" spacing={3} alignItems="flex-start">
      {/* ── LEFT: Next Action Panel ── */}
      <Box sx={{ width: 320, flexShrink: 0 }}>
        <Card sx={{ borderRadius: "16px", overflow: "hidden" }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ px: 2.5, py: 2, borderBottom: "1px solid #F1F5F9" }}
          >
            <Typography variant="subtitle2" fontWeight={700}>
              Next Action
            </Typography>
            <IconButton size="small" onClick={() => setOpenAddActionDialog(true)}>
              <AddCircleOutlineIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Box sx={{ p: 2 }}>
            {/* AI Suggestion */}
            <Box
              sx={{
                p: 2,
                bgcolor: "#EEF2FF",
                borderRadius: "12px",
                mb: 2,
                border: "1px solid #E0E7FF",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <AutoFixHighIcon sx={{ color: "#6366F1", fontSize: 16 }} />
                <Typography variant="caption" fontWeight={700} color="#6366F1">
                  AI Suggestion
                </Typography>
              </Stack>
              <Typography variant="body2" fontWeight={600} mb={0.5}>
                Book Appointment{" "}
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                  fontWeight={400}
                >
                  | Lead confirmed interest via WhatsApp
                </Typography>
              </Typography>
              <Typography
                variant="caption"
                color="#6366F1"
                sx={{ cursor: "pointer", fontWeight: 600 }}
              >
                Apply suggestion
              </Typography>
            </Box>

            {/* Current Next Action */}
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                display: "block",
                mb: 1.5,
              }}
            >
              Next Action
            </Typography>
            <Card
              variant="outlined"
              sx={{ p: 2, borderRadius: "12px", mb: 3, border: "1px solid #E2E8F0" }}
            >
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                  sx={{
                    p: 1,
                    bgcolor: "#EFF6FF",
                    borderRadius: "8px",
                    mt: 0.25,
                  }}
                >
                  <CallOutlinedIcon sx={{ color: "#3B82F6", fontSize: 20 }} />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" fontWeight={700} mb={1.5}>
                    {nextActionType}
                  </Typography>
                  <Stack direction="row" spacing={4} mb={1}>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                        sx={{
                          textTransform: "uppercase",
                          fontSize: "0.65rem",
                          letterSpacing: "0.5px",
                        }}
                      >
                        DUE
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        Today
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                        sx={{
                          textTransform: "uppercase",
                          fontSize: "0.65rem",
                          letterSpacing: "0.5px",
                        }}
                      >
                        STATUS
                      </Typography>
                      <Box mt={0.25}>
                        <Chip
                          label={nextActionStatus}
                          size="small"
                          sx={{
                            bgcolor: "#EFF6FF",
                            color: "#3B82F6",
                            fontWeight: 600,
                            borderRadius: "6px",
                            height: 22,
                            fontSize: "0.7rem",
                          }}
                        />
                      </Box>
                    </Box>
                  </Stack>
                  <Box mb={2}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight={600}
                      sx={{
                        textTransform: "uppercase",
                        fontSize: "0.65rem",
                        letterSpacing: "0.5px",
                      }}
                    >
                      DESCRIPTION
                    </Typography>
                    <Typography variant="body2">{nextActionDescription}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 14 }} />}
                      sx={{
                        textTransform: "none",
                        borderRadius: "8px",
                        borderColor: "#E2E8F0",
                        color: "#475569",
                        fontSize: "0.75rem",
                        py: 0.5,
                      }}
                    >
                      Mark Done
                    </Button>
                    <CallButton lead={lead} />
                  </Stack>
                </Box>
              </Stack>
            </Card>

            {/* Previous Actions */}
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                display: "block",
                mb: 1.5,
              }}
            >
              Previous Actions
            </Typography>
            <Card
              variant="outlined"
              sx={{ p: 2, borderRadius: "12px", border: "1px solid #E2E8F0" }}
            >
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                  sx={{ p: 1, bgcolor: "#F0FDF4", borderRadius: "8px", mt: 0.25 }}
                >
                  <CallOutlinedIcon sx={{ color: "#10B981", fontSize: 20 }} />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" fontWeight={700} mb={1.5}>
                    Follow-Up Call
                  </Typography>
                  <Stack direction="row" spacing={4} mb={1}>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                        sx={{
                          textTransform: "uppercase",
                          fontSize: "0.65rem",
                          letterSpacing: "0.5px",
                        }}
                      >
                        DUE
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        16/01/2026
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                        sx={{
                          textTransform: "uppercase",
                          fontSize: "0.65rem",
                          letterSpacing: "0.5px",
                        }}
                      >
                        STATUS
                      </Typography>
                      <Box mt={0.25}>
                        <Chip
                          label="Completed"
                          size="small"
                          sx={{
                            bgcolor: "#F0FDF4",
                            color: "#16A34A",
                            fontWeight: 600,
                            borderRadius: "6px",
                            height: 22,
                            fontSize: "0.7rem",
                          }}
                        />
                      </Box>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </Card>
          </Box>
        </Card>
      </Box>

      {/* ── RIGHT: Notes Panel ── */}
      <Box sx={{ flexGrow: 1 }}>
        <Card sx={{ borderRadius: "16px", overflow: "hidden" }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid #F1F5F9" }}>
            <Typography variant="subtitle2" fontWeight={700}>
              Notes
            </Typography>
          </Box>
          <Box sx={{ p: 2.5 }}>
            {notesError && (
              <Alert
                severity="error"
                onClose={() => setNotesError(null)}
                sx={{ mb: 2, borderRadius: "10px" }}
              >
                {notesError}
              </Alert>
            )}
            {notesLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <Stack alignItems="center" spacing={1}>
                  <CircularProgress size={24} />
                  <Typography variant="caption" color="text.secondary">
                    Loading notes...
                  </Typography>
                </Stack>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 2,
                  mb: 3,
                }}
              >
                {notes.map((note) =>
                  editingNoteId === note.id ? (
                    /* Edit mode */
                    <Card
                      key={note.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: "12px",
                        border: "2px solid #6366F1",
                        bgcolor: "#FAFAFE",
                      }}
                    >
                      <TextField
                        fullWidth
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        variant="standard"
                        placeholder="Title"
                        inputProps={{ style: { fontWeight: 700, fontSize: "0.875rem" } }}
                        sx={{
                          mb: 1,
                          "& .MuiInput-underline:before": {
                            borderBottomColor: "#E2E8F0",
                          },
                          "& .MuiInput-underline:after": {
                            borderBottomColor: "#6366F1",
                          },
                        }}
                      />
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        variant="standard"
                        placeholder="Note content..."
                        inputProps={{
                          style: {
                            fontSize: "0.875rem",
                            color: "#475569",
                            lineHeight: 1.6,
                          },
                        }}
                        sx={{
                          mb: 2,
                          "& .MuiInput-underline:before": { borderBottom: "none" },
                          "& .MuiInput-underline:after": { borderBottom: "none" },
                          "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                            borderBottom: "none",
                          },
                        }}
                      />
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          onClick={onCancelEditNote}
                          disabled={editSubmitting}
                          sx={{
                            textTransform: "none",
                            fontSize: "0.75rem",
                            color: "#64748B",
                            borderRadius: "8px",
                            "&:hover": { bgcolor: "#F1F5F9" },
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => onSaveEditNote(note.id)}
                          disabled={editSubmitting}
                          sx={{
                            textTransform: "none",
                            fontSize: "0.75rem",
                            bgcolor: "#334155",
                            borderRadius: "8px",
                            boxShadow: "none",
                            minWidth: 64,
                            "&:hover": { bgcolor: "#1E293B", boxShadow: "none" },
                          }}
                        >
                          {editSubmitting ? (
                            <CircularProgress size={14} sx={{ color: "white" }} />
                          ) : (
                            "Save"
                          )}
                        </Button>
                      </Stack>
                    </Card>
                  ) : (
                    /* View mode */
                    <Card
                      key={note.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: "12px",
                        border: "1px solid #E2E8F0",
                        position: "relative",
                      }}
                    >
                      <Typography variant="body2" fontWeight={700} mb={0.5}>
                        {note.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ whiteSpace: "pre-line", mb: 1.5, lineHeight: 1.6 }}
                      >
                        {note.content}
                      </Typography>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="caption" color="text.secondary">
                          {note.time}
                        </Typography>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton
                            size="small"
                            onClick={() => onStartEditNote(note)}
                            sx={{ color: "#3B82F6", "&:hover": { bgcolor: "#EFF6FF" } }}
                          >
                            <EditIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => setDeleteNoteDialog(note.id)}
                            sx={{ color: "#EF4444", "&:hover": { bgcolor: "#FEF2F2" } }}
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </Card>
                  )
                )}
              </Box>
            )}

            {/* Add Note Input */}
            <Card
              variant="outlined"
              sx={{ borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden" }}
            >
              <TextField
                fullWidth
                placeholder="Title"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                variant="standard"
                sx={{
                  px: 2,
                  pt: 1.5,
                  "& .MuiInputBase-root": {
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  },
                  "& .MuiInput-underline:before": { borderBottom: "none" },
                  "& .MuiInput-underline:after": { borderBottom: "none" },
                  "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                    borderBottom: "none",
                  },
                }}
              />
              <Divider sx={{ mx: 2, borderColor: "#F1F5F9" }} />
              <Stack direction="row" alignItems="flex-end">
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  placeholder="Write note here..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  variant="standard"
                  sx={{
                    px: 2,
                    py: 1,
                    "& .MuiInputBase-root": {
                      fontSize: "0.875rem",
                      color: "#64748B",
                    },
                    "& .MuiInput-underline:before": { borderBottom: "none" },
                    "& .MuiInput-underline:after": { borderBottom: "none" },
                    "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                      borderBottom: "none",
                    },
                  }}
                />
                <Box sx={{ p: 1.5, flexShrink: 0 }}>
                  <IconButton
                    onClick={onAddNote}
                    disabled={noteSubmitting}
                    sx={{
                      bgcolor:
                        (newNoteTitle.trim() || newNoteContent.trim()) && !noteSubmitting
                          ? "#334155"
                          : "#F1F5F9",
                      color:
                        (newNoteTitle.trim() || newNoteContent.trim()) && !noteSubmitting
                          ? "white"
                          : "#94A3B8",
                      width: 36,
                      height: 36,
                      transition: "all 0.2s",
                      "&:hover": {
                        bgcolor:
                          (newNoteTitle.trim() || newNoteContent.trim()) && !noteSubmitting
                            ? "#1E293B"
                            : "#E2E8F0",
                      },
                    }}
                  >
                    {noteSubmitting ? (
                      <CircularProgress size={16} sx={{ color: "#94A3B8" }} />
                    ) : (
                      <SendIcon sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                </Box>
              </Stack>
            </Card>
          </Box>
        </Card>
      </Box>

      {/* ══ ADD NEXT ACTION DIALOG ══ */}
      <Dialog
        open={openAddActionDialog}
        onClose={onCloseActionDialog}
        PaperProps={{
          sx: { borderRadius: "16px", p: 3, maxWidth: "500px", width: "100%" },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Add Next Action
                </Typography>
                <Typography fontSize="12px" color="#64748B" mt={0.5}>
                  Lead status:{" "}
                  <Chip
                    label={lead?.status || lead?.lead_status || "New"}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: "11px",
                      fontWeight: 600,
                      bgcolor: isAppointment
                        ? "#EFF6FF"
                        : isFollowUp
                        ? "#FEF3C7"
                        : "#F0FDF4",
                      color: isAppointment
                        ? "#3B82F6"
                        : isFollowUp
                        ? "#F59E0B"
                        : "#16A34A",
                    }}
                  />
                </Typography>
              </Box>
            </Stack>

            {isAppointment && (
              <Alert severity="info" sx={{ borderRadius: "10px", fontSize: "13px" }}>
                This lead already has an <strong>Appointment</strong> status. Fields are
                disabled.
              </Alert>
            )}
            {actionError && (
              <Alert
                severity="error"
                onClose={() => setActionError(null)}
                sx={{ borderRadius: "10px", fontSize: "13px" }}
              >
                {actionError}
              </Alert>
            )}

            <Box>
              <Typography fontSize="13px" fontWeight={600} mb={1}>
                Action Type *
                {!isAppointment && (
                  <Typography
                    component="span"
                    fontSize="11px"
                    color="#94A3B8"
                    fontWeight={400}
                    ml={1}
                  >
                    {isFollowUp
                      ? "(Follow Up leads can only move to Appointment)"
                      : "(New leads can move to Follow Up or Appointment)"}
                  </Typography>
                )}
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                disabled={isAppointment}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
              >
                <MenuItem value="">-- Select --</MenuItem>
                {availableActions.map((a) => (
                  <MenuItem key={a.value} value={a.value}>
                    {a.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box>
              <Typography fontSize="13px" fontWeight={600} mb={1}>
                Status *
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={actionStatus}
                onChange={(e) => setActionStatus(e.target.value)}
                disabled={isAppointment}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </TextField>
            </Box>

            <Box>
              <Typography fontSize="13px" fontWeight={600} mb={1}>
                Description *
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                value={actionDescription}
                onChange={(e) => setActionDescription(e.target.value)}
                placeholder="Enter action description..."
                disabled={isAppointment}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
              />
            </Box>

            {!isAppointment && actionType && (
              <Box
                sx={{
                  bgcolor: "#F8FAFC",
                  borderRadius: "8px",
                  px: 2,
                  py: 1.25,
                  border: "1px solid #E2E8F0",
                }}
              >
                <Typography fontSize="11px" color="#64748B">
                  Next action type will be set to{" "}
                  <Typography
                    component="span"
                    fontWeight={700}
                    color="#0F172A"
                    fontSize="11px"
                  >
                    {actionType}
                  </Typography>{" "}
                  with status{" "}
                  <Typography
                    component="span"
                    fontWeight={700}
                    color="#0F172A"
                    fontSize="11px"
                  >
                    {actionStatus}
                  </Typography>
                </Typography>
              </Box>
            )}

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                onClick={onCloseActionDialog}
                variant="outlined"
                disabled={actionSubmitting}
                sx={{
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                  color: "#475569",
                  borderColor: "#E2E8F0",
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={onAddNextAction}
                variant="contained"
                disabled={
                  isAppointment || !actionType || !actionDescription || actionSubmitting
                }
                sx={{
                  bgcolor: "#334155",
                  borderRadius: "8px",
                  textTransform: "none",
                  fontWeight: 600,
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#1E293B" },
                  "&:disabled": { bgcolor: "#E2E8F0", color: "#94A3B8" },
                }}
              >
                {actionSubmitting ? (
                  <CircularProgress size={20} sx={{ color: "white" }} />
                ) : (
                  "Save"
                )}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* ══ DELETE NOTE DIALOG ══ */}
      <Dialog
        open={deleteNoteDialog !== null}
        onClose={() => setDeleteNoteDialog(null)}
        PaperProps={{
          sx: {
            borderRadius: "24px",
            p: 4,
            textAlign: "center",
            maxWidth: "420px",
            boxShadow: "0px 20px 25px -5px rgba(0,0,0,0.1)",
          },
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Stack alignItems="center" spacing={2.5}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: "#FEF2F2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DeleteOutlineIcon sx={{ fontSize: 32, color: "#EF4444" }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Delete Note
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ px: 2, lineHeight: 1.6 }}
              >
                This action cannot be undone. Are you sure you want to delete this note
                permanently?
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} sx={{ width: "100%", mt: 2 }}>
              <Button
                fullWidth
                onClick={() => setDeleteNoteDialog(null)}
                variant="outlined"
                sx={{
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: 600,
                  color: "#475569",
                  borderColor: "#E2E8F0",
                  py: 1.2,
                }}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={() => deleteNoteDialog && onDeleteNote(deleteNoteDialog)}
                sx={{
                  bgcolor: "#EF4444",
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: 600,
                  py: 1.2,
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#DC2626" },
                }}
              >
                Delete
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  );
};

export default NextActionTab;