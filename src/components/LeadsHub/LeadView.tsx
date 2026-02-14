import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Card,
  Chip,
  Divider,
  Button,
  Avatar,
  IconButton,
  Breadcrumbs,
  Link,
  TextField,
  InputAdornment,
  Dialog,
  DialogContent,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ShortcutIcon from "@mui/icons-material/Shortcut";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import SendIcon from "@mui/icons-material/Send";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import type { RootState } from "../../store";

import { CallButton, Dialogs } from "./LeadsMenuDialogs";

import {
  fetchLeads,
  selectLeads,
  selectLeadsLoading,
  selectLeadsError,
} from "../../store/leadSlice";
import type { Lead } from "../../types/leads.types";
import { LeadAPI, DepartmentAPI, EmployeeAPI, api } from "../../services/leads.api";
import type { Department, Employee } from "../../services/leads.api";

// ====================== Types ======================
type NoteData = {
  id: string;        // UUID from API
  uuid?: string;
  title: string;
  content: string;
  time: string;
};

export default function LeadDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const selectedTemplate = useSelector(
    (state: RootState) => state.emailTemplate.selectedTemplate
  );

  const leads = useSelector(selectLeads);
  const loading = useSelector(selectLeadsLoading);
  const error = useSelector(selectLeadsError);

  const [activeTab, setActiveTab] = React.useState("Patient Info");
  const [openConvertPopup, setOpenConvertPopup] = React.useState(false);
  const [historyView, setHistoryView] = React.useState<"chatbot" | "call" | "email">("chatbot");

  // ── Notes state ──────────────────────────────────────────
  const [notes, setNotes] = React.useState<NoteData[]>([]);
  const [notesLoading, setNotesLoading] = React.useState(false);
  const [notesError, setNotesError] = React.useState<string | null>(null);
  const [newNoteTitle, setNewNoteTitle] = React.useState("");
  const [newNoteContent, setNewNoteContent] = React.useState("");
  const [noteSubmitting, setNoteSubmitting] = React.useState(false);

  // ── Edit state ────────────────────────────────────────────
  const [editingNoteId, setEditingNoteId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editContent, setEditContent] = React.useState("");
  const [editSubmitting, setEditSubmitting] = React.useState(false);

  // Format a date string → "FRI, NOV 12, 6:25 PM"
  const formatNoteTime = (iso: string) =>
    new Date(iso)
      .toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      .toUpperCase();

  // ── Decode JWT to get current user id ────────────────────
  const getCurrentUserId = (): number | null => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      // Django SimpleJWT puts user_id or id in the payload
      return payload.user_id ?? payload.id ?? payload.sub ?? null;
    } catch {
      return null;
    }
  };

  // ── Fetch notes → GET /leads/{lead_id}/notes/ ────────────
  const fetchNotes = React.useCallback(async (leadUuid: string) => {
    try {
      setNotesLoading(true);
      setNotesError(null);
      const { data } = await api.get(`/leads/${leadUuid}/notes/`);
      const results = Array.isArray(data) ? data : data.results ?? [];
      setNotes(
        results
          .filter((n: any) => !n.is_deleted)
          .map((n: any) => ({
            id: n.id,
            uuid: n.id,
            title: n.title ?? "",
            content: n.note ?? "",
            time: n.created_at ? formatNoteTime(n.created_at) : "",
          }))
      );
    } catch (err: any) {
      setNotesError(err?.response?.data?.detail || err?.message || "Failed to load notes");
    } finally {
      setNotesLoading(false);
    }
  }, []);

  // ── Add note → POST /leads/notes/ ────────────────────────
  const handleAddNote = async () => {
    if (!newNoteTitle.trim() && !newNoteContent.trim()) return;
    if (!lead) return;
    try {
      setNoteSubmitting(true);
      setNotesError(null);
      const userId = getCurrentUserId();
      const { data: created } = await api.post("/leads/notes/", {
        title: newNoteTitle.trim() || "Note",
        note: newNoteContent.trim(),
        lead: decodeURIComponent(id || ""),
        is_active: true,
        is_deleted: false,
        ...(userId !== null && { created_by: userId }),
      });
      setNotes((prev) => [
        ...prev,
        {
          id: created.id,
          uuid: created.id,
          title: created.title ?? newNoteTitle,
          content: created.note ?? newNoteContent,
          time: created.created_at ? formatNoteTime(created.created_at) : "",
        },
      ]);
      setNewNoteTitle("");
      setNewNoteContent("");
    } catch (err: any) {
      setNotesError(err?.response?.data?.detail || err?.message || "Failed to save note");
    } finally {
      setNoteSubmitting(false);
    }
  };

  // ── Start editing ─────────────────────────────────────────
  const handleStartEdit = (note: NoteData) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditTitle("");
    setEditContent("");
  };

  // ── Save edit → PUT /leads/notes/{note_id}/update/ ───────
  const handleSaveEdit = async (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note || !lead) return;
    try {
      setEditSubmitting(true);
      setNotesError(null);
      const userId = getCurrentUserId();
      const { data: updated } = await api.put(`/leads/notes/${noteId}/update/`, {
        title: editTitle.trim(),
        note: editContent.trim(),
        lead: decodeURIComponent(id || ""),
        ...(userId !== null && { created_by: userId }),
      });
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? { ...n, title: updated.title ?? editTitle, content: updated.note ?? editContent }
            : n
        )
      );
      setEditingNoteId(null);
      setEditTitle("");
      setEditContent("");
    } catch (err: any) {
      setNotesError(err?.response?.data?.detail || err?.message || "Failed to update note");
    } finally {
      setEditSubmitting(false);
    }
  };

  // ── Delete → DELETE /leads/notes/{note_id}/delete/ ───────
  const handleDeleteNote = async (noteId: string) => {
    try {
      await api.delete(`/leads/notes/${noteId}/delete/`);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err: any) {
      setNotesError(err?.response?.data?.detail || err?.message || "Failed to delete note");
    }
  };

  React.useEffect(() => {
    if (!leads || leads.length === 0) {
      dispatch(fetchLeads() as any);
    }
  }, [dispatch, leads]);

  const lead = React.useMemo(() => {
    if (!leads || leads.length === 0) return null;
    const cleanId = decodeURIComponent(id || "").replace("#", "").replace("LN-", "").replace("LD-", "");
    return leads.find((l) => {
      const leadCleanId = l.id.replace("#", "").replace("LN-", "").replace("LD-", "");
      return leadCleanId === cleanId;
    });
  }, [leads, id]);

  // Fetch notes once we know the lead's ID
  React.useEffect(() => {
    if (lead) {
      // Use the raw URL param — the same id used in /leads/{lead_id}/ routes
      const rawId = decodeURIComponent(id || "");
      fetchNotes(rawId);
    }
  }, [lead, fetchNotes, id]);

  const handleOpenPopup = () => setOpenConvertPopup(true);
  const handleClosePopup = () => setOpenConvertPopup(false);

  const getCleanLeadId = (leadId: string) =>
    leadId.replace("#", "").replace("LN-", "").replace("LD-", "");

  const handleEdit = () => {
    if (!lead) return;
    navigate(`/leads/edit/${getCleanLeadId(lead.id)}`, { state: { lead } });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">Loading lead details...</Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          <Typography fontWeight={600}>Failed to load lead</Typography>
          <Typography variant="body2">{error}</Typography>
          <Typography variant="body2" sx={{ mt: 1, color: "primary.main", cursor: "pointer", textDecoration: "underline" }} onClick={() => dispatch(fetchLeads() as any)}>
            Try again
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (!lead) {
    return (
      <Box p={3}>
        <Alert severity="warning">
          <Typography fontWeight={600}>Lead not found</Typography>
          <Typography variant="body2">The lead you're looking for doesn't exist or may have been deleted.</Typography>
          <Typography variant="body2" sx={{ mt: 1, color: "primary.main", cursor: "pointer", textDecoration: "underline" }} onClick={() => navigate("/leads")}>
            Go back to Leads Hub
          </Typography>
        </Alert>
      </Box>
    );
  }

  const leadName = lead.full_name || lead.name || "Unknown";
  const leadInitials = lead.initials || leadName.charAt(0).toUpperCase();
  const leadPhone = lead.phone || lead.contact_number || "(555) 555-0128";
  const leadEmail = lead.email || "johnson@gmail.com";
  const leadStatus = lead.status || "New";
  const leadQuality = lead.quality || "N/A";
  const leadScore = String(lead.score || 0).includes("%") ? lead.score : `${lead.score || 0}%`;
  const leadCreatedAt = lead.created_at
    ? new Date(lead.created_at).toLocaleString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "N/A";

  return (
    <Box p={3} bgcolor="#F8FAFC" minHeight="100vh">
      {/* BREADCRUMBS */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }} />

      {/* TOP SUMMARY CARD */}
      <Card sx={{ p: 2.5, mb: 3, borderRadius: "16px", boxShadow: "0px 1px 3px rgba(0,0,0,0.05)" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={3} alignItems="center">
            <Avatar sx={{ bgcolor: "#EEF2FF", color: "#6366F1", width: 56, height: 56, fontSize: "20px", fontWeight: 700 }}>
              {leadInitials}
            </Avatar>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">Lead Name</Typography>
              <Typography fontWeight={700} variant="body1">{leadName}</Typography>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">Lead ID</Typography>
              <Typography fontWeight={600} variant="body1">{lead.id}</Typography>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">Source</Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Box sx={{ width: 16, height: 16, bgcolor: "#FFB800", borderRadius: "50%" }} />
                <Typography fontWeight={600} variant="body1">{lead.source || "Unknown"}</Typography>
              </Stack>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">Lead Status</Typography>
              <Chip label={leadStatus} size="small" sx={{ bgcolor: "#EFF6FF", color: "#3B82F6", fontWeight: 600, borderRadius: "6px" }} />
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">Lead Quality</Typography>
              <Chip
                label={leadQuality}
                size="small"
                sx={{
                  bgcolor: leadQuality === "Hot" ? "#FEF2F2" : leadQuality === "Warm" ? "#FEF3C7" : "#F1F5F9",
                  color: leadQuality === "Hot" ? "#EF4444" : leadQuality === "Warm" ? "#F59E0B" : "#64748B",
                  fontWeight: 600,
                  borderRadius: "6px",
                }}
              />
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">AI Lead Score</Typography>
              <Typography fontWeight={700} color="#EC4899">{leadScore}</Typography>
            </Stack>
          </Stack>
        </Stack>
      </Card>

      {/* TABS & ACTION BUTTONS */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" spacing={4}>
          {["Patient Info", "History", "Next Action"].map((tab) => (
            <Box
              key={tab}
              onClick={() => setActiveTab(tab)}
              sx={{ borderBottom: activeTab === tab ? "2px solid #6366F1" : "none", pb: 1, cursor: "pointer" }}
            >
              <Typography fontWeight={600} color={activeTab === tab ? "#6366F1" : "text.secondary"}>
                {tab}
              </Typography>
            </Box>
          ))}
        </Stack>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={handleEdit}
            sx={{ borderRadius: "8px", textTransform: "none", color: "text.primary", borderColor: "#E2E8F0" }}>
            Edit
          </Button>
          <Button variant="contained" onClick={handleOpenPopup} startIcon={<SwapHorizIcon />}
            sx={{ borderRadius: "8px", textTransform: "none", bgcolor: "#1E293B", px: 2 }}>
            Convert Lead
          </Button>
        </Stack>
      </Stack>

      {/* ── PATIENT INFO TAB ── */}
      {activeTab === "Patient Info" && (
        <Stack direction="row" spacing={3}>
          <Box sx={{ flex: 2 }}>
            <Card sx={{ p: 3, borderRadius: "16px", mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={3}>Basic Information</Typography>
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={2} sx={{ textTransform: "uppercase", letterSpacing: "1px" }}>
                Lead Information
              </Typography>
              <Stack spacing={3}>
                <Stack direction="row" spacing={6}>
                  <Info label="CONTACT NO" value={leadPhone} />
                  <Info label="EMAIL" value={leadEmail} />
                  <Info label="LOCATION" value={lead.location || "N/A"} />
                </Stack>
                <Stack direction="row" spacing={6}>
                  <Info label="GENDER" value={lead.gender || "Male"} />
                  <Info label="AGE" value={lead.age?.toString() || "32"} />
                  <Info label="MARITAL STATUS" value={lead.marital_status || "Married"} />
                </Stack>
                <Stack direction="row" spacing={6}>
                  <Info label="ADDRESS" value={lead.address || "201, HV Streets, LA Jola, California"} />
                  <Info label="LANGUAGE PREFERENCE" value={lead.language_preference || "English"} />
                  <Info label="ASSIGNED TO" value={lead.assigned || "Unassigned"} isAvatar />
                </Stack>
                <Info label="CREATED DATE & TIME" value={leadCreatedAt} />
              </Stack>
              <Divider sx={{ my: 4 }} />
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={2} sx={{ textTransform: "uppercase", letterSpacing: "1px" }}>
                Partner Information
              </Typography>
              <Stack direction="row" spacing={6}>
                <Info label="FULL NAME" value={lead.partner_name || "Jennifer Smith"} />
                <Info label="AGE" value={lead.partner_age?.toString() || "29"} />
                <Info label="GENDER" value={lead.partner_gender || "Female"} />
              </Stack>
              <Divider sx={{ my: 4 }} />
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={2} sx={{ textTransform: "uppercase", letterSpacing: "1px" }}>
                Source & Campaign Details
              </Typography>
              <Stack direction="row" spacing={6}>
                <Info label="SUB-SOURCE" value={lead.sub_source || "Facebook"} />
                <Info label="CAMPAIGN NAME" value={lead.campaign_name || "Facebook IVF Awareness - December"} />
                <Info label="CAMPAIGN DURATION" value={lead.campaign_duration || "01/12/2025 - 07/12/2025"} />
              </Stack>
            </Card>
          </Box>
          <Stack spacing={3} sx={{ flex: 1 }}>
            <Card sx={{ p: 3, bgcolor: "#F0FDF4", borderRadius: "16px", border: "1px solid #DCFCE7" }}>
              <Typography color="#16A34A" fontWeight={700} variant="subtitle2" mb={2}>Appointment</Typography>
              <Stack direction="row" justifyContent="space-between" mb={2}>
                <Box><Typography variant="caption" color="text.secondary">DEPARTMENT</Typography><Typography fontWeight={600} variant="body2">Consultation</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">PERSONNEL</Typography><Typography fontWeight={600} variant="body2">Dr. Alex Carey</Typography></Box>
              </Stack>
              <Stack direction="row" justifyContent="space-between" mb={2}>
                <Box><Typography variant="caption" color="text.secondary">DATE</Typography><Typography fontWeight={600} variant="body2">12/09/2024</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">TIME</Typography><Typography fontWeight={600} variant="body2">12:30 PM - 01:00 PM</Typography></Box>
              </Stack>
              <Typography variant="caption" color="text.secondary">REMARK</Typography>
              <Typography variant="body2">Remark details in short come here</Typography>
            </Card>
            <Card sx={{ p: 3, borderRadius: "16px" }}>
              <Typography fontWeight={700} variant="subtitle2" mb={2}>Treatment Interest</Typography>
              <Stack direction="row" spacing={1}>
                <Chip label="Medical Checkup" size="small" sx={{ bgcolor: "#F5F3FF", color: "#7C3AED", fontWeight: 500 }} />
                <Chip label="IVF" size="small" sx={{ bgcolor: "#F5F3FF", color: "#7C3AED", fontWeight: 500 }} />
              </Stack>
            </Card>
            <Card sx={{ p: 3, borderRadius: "16px" }}>
              <Typography fontWeight={700} variant="subtitle2" mb={2}>Documents</Typography>
              <Stack spacing={2}>
                <DocumentRow name="ivf_report_2024.pdf" size="1.24 MB" />
                <DocumentRow name="body_checkup_2024.doc" size="2.03 MB" />
              </Stack>
            </Card>
          </Stack>
        </Stack>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === "History" && (
        <Stack direction="row" spacing={3}>
          <Card sx={{ flex: 1, p: 3, borderRadius: "16px" }}>
            <Typography variant="subtitle1" fontWeight={700} mb={3}>Activity Timeline</Typography>
            <Stack spacing={0}>
              <TimelineItem icon={<ChatBubbleOutlineIcon sx={{ fontSize: 16, color: "#6366F1" }} />} title="Appointment Booked - Confirmation sent (SMS)" time={leadCreatedAt} />
              <TimelineItem icon={<CallOutlinedIcon sx={{ fontSize: 16, color: "#10B981" }} />} title="Outgoing call attempted - Connected" time={leadCreatedAt} onClick={() => setHistoryView("call")} isClickable />
              <TimelineItem icon={<EmailOutlinedIcon sx={{ fontSize: 16, color: "#F59E0B" }} />} title="Patient shared contact number and email" time={leadCreatedAt} onClick={() => setHistoryView("email")} isClickable />
              <TimelineItem icon={<EmailOutlinedIcon sx={{ fontSize: 16, color: "#3B82F6" }} />} title="Sent an Welcome Email" time={leadCreatedAt} onClick={() => setHistoryView("email")} isClickable />
              <TimelineItem isAvatar avatarInitial={(lead.assigned || "U").charAt(0)} title={`Assigned to ${lead.assigned || "Unassigned"}`} time={leadCreatedAt} />
              <TimelineItem icon={<ChatBubbleOutlineIcon sx={{ fontSize: 16, color: "#8B5CF6" }} />} title="Lead arrived from Website Chatbot" time={leadCreatedAt} onClick={() => setHistoryView("chatbot")} isClickable isLast />
            </Stack>
          </Card>
          <Card sx={{ flex: 2, borderRadius: "16px", display: "flex", flexDirection: "column", maxHeight: "600px" }}>
            {historyView === "chatbot" && (
              <>
                <Box p={2} borderBottom="1px solid #E2E8F0"><Typography variant="subtitle1" fontWeight={700}>Chatbot</Typography></Box>
                <Box sx={{ flexGrow: 1, p: 3, overflowY: "auto", bgcolor: "#F8FAFC" }}>
                  <Stack spacing={3}>
                    <Typography variant="caption" align="center" color="text.secondary" display="block">
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase() : "TODAY"}
                    </Typography>
                    <ChatBubble side="left" text="Hello! How can I help you today?" time="9:41 AM" />
                    <ChatBubble side="right" text="I'm looking for a general health check-up" time="9:42 AM" />
                    <ChatBubble side="left" text="Great! I can help you schedule that." time="9:43 AM" />
                    <ChatBubble side="right" text="Sometime this week, preferably in the morning" time="9:44 AM" />
                    <ChatBubble side="right" text={`My name is ${leadName}, and my number is ${leadPhone}`} time="9:46 AM" />
                  </Stack>
                </Box>
                <Box p={2} borderTop="1px solid #E2E8F0">
                  <TextField fullWidth placeholder="Type your message..." size="small"
                    InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton color="primary"><SendIcon sx={{ fontSize: 18 }} /></IconButton></InputAdornment>) }} />
                </Box>
              </>
            )}
            {historyView === "call" && (
              <>
                <Box p={2} borderBottom="1px solid #E2E8F0">
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" fontWeight={700}>Call Transcript</Typography>
                    <CallButton lead={lead} />
                  </Stack>
                </Box>
                <Box sx={{ flexGrow: 1, p: 3, overflowY: "auto", bgcolor: "#F8FAFC" }}>
                  <Stack spacing={3}>
                    <Typography variant="caption" align="center" color="text.secondary" display="block">
                      CALL - {lead.created_at ? new Date(lead.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase() : "TODAY"}
                    </Typography>
                    <CallMessage speaker="Mike" time="0:03" text="Good morning! You've reached Bloom Fertility Center. This is Mike. How can I help you today?" />
                    <CallMessage speaker={leadName.split(" ")[0]} time="0:15" text="Hi Mike, I'm calling to get some information about IVF. My wife and I are considering starting treatment." />
                    <CallMessage speaker="Mike" time="0:25" text="Of course. I'd be happy to guide you. May I know your wife's age and how long you both have been trying to conceive?" />
                    <CallMessage speaker={leadName.split(" ")[0]} time="0:32" text="She's 32, and we've been trying for about four years now." />
                    <CallMessage speaker="Mike" time="0:35" text="Thank you. Have you undergone any treatments earlier, like IUI or IVF?" />
                    <CallMessage speaker={leadName.split(" ")[0]} time="0:39" text="We tried two IVIs this year, but they weren't successful. No IVF yet." />
                    <CallMessage speaker="Mike" time="0:46" text="Thank you. Have AMH or ultrasound tests been done for your wife?" />
                    <CallMessage speaker={leadName.split(" ")[0]} time="1:03" text="Yes, that would be great. Preferably sometime this week in the morning." />
                  </Stack>
                </Box>
              </>
            )}
            {historyView === "email" && (
              <>
                <Box p={2} borderBottom="1px solid #E2E8F0">
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" fontWeight={700}>Email History</Typography>
                    <IconButton onClick={() => (window.location.href = `mailto:${leadEmail}`)} sx={{ bgcolor: "#EFF6FF", "&:hover": { bgcolor: "#DBEAFE" } }}>
                      <EmailOutlinedIcon sx={{ color: "#3B82F6" }} />
                    </IconButton>
                  </Stack>
                </Box>
                <Box sx={{ flexGrow: 1, p: 3, overflowY: "auto", bgcolor: "#F8FAFC" }}>
                  <Stack spacing={3}>
                    <Card sx={{ p: 2.5, borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                      <Stack direction="row" justifyContent="space-between" mb={2}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ width: 40, height: 40, bgcolor: "#EEF2FF", color: "#6366F1" }}>{leadInitials}</Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>{leadName}</Typography>
                            <Typography variant="caption" color="text.secondary">{leadEmail}</Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            {lead.created_at ? new Date(lead.created_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "Today"}
                          </Typography>
                          <IconButton size="small"><ShortcutIcon sx={{ fontSize: 16 }} /></IconButton>
                        </Stack>
                      </Stack>
                      <Typography variant="body2" color="text.primary" mb={1}>Hello,</Typography>
                      <Typography variant="body2" color="text.secondary" mb={1}>I came across Crysta IVF while searching online and would like to know more about fertility check-up consultations.</Typography>
                      <Typography variant="body2" color="text.secondary" mb={1}>Could you please let me know the consultation process and available appointment slots this week?</Typography>
                      <Typography variant="body2" color="text.secondary" mb={2}>Looking forward to your response.</Typography>
                      <Typography variant="body2" color="text.secondary">Regards,</Typography>
                      <Typography variant="body2" color="text.secondary">{leadName}</Typography>
                      <Typography variant="body2" color="text.secondary">{leadPhone}</Typography>
                    </Card>
                    {selectedTemplate && (
                      <Card sx={{ p: 2.5, borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                        <Stack direction="row" justifyContent="space-between" mb={2}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar sx={{ width: 40, height: 40, bgcolor: "#FEF2F2", color: "#EF4444" }}>CC</Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700}>Crysta Clinic</Typography>
                              <Typography variant="caption" color="text.secondary">team@crystaivf.com</Typography>
                            </Box>
                          </Stack>
                        </Stack>
                        <Typography variant="body2" fontWeight={700} mb={1}>{selectedTemplate.subject}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>{selectedTemplate.content}</Typography>
                      </Card>
                    )}
                  </Stack>
                </Box>
              </>
            )}
          </Card>
        </Stack>
      )}

      {/* ── NEXT ACTION TAB ── */}
      {activeTab === "Next Action" && (
        <Stack direction="row" spacing={3} alignItems="flex-start">

          {/* ── LEFT: Actions Panel ── */}
          <Box sx={{ width: 320, flexShrink: 0 }}>
            <Card sx={{ borderRadius: "16px", overflow: "hidden" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 2, borderBottom: "1px solid #F1F5F9" }}>
                <Typography variant="subtitle2" fontWeight={700}>Next Action</Typography>
                <IconButton size="small"><AddCircleOutlineIcon fontSize="small" /></IconButton>
              </Stack>

              <Box sx={{ p: 2 }}>
                {/* AI Suggestion */}
                <Box sx={{ p: 2, bgcolor: "#EEF2FF", borderRadius: "12px", mb: 2, border: "1px solid #E0E7FF" }}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <AutoFixHighIcon sx={{ color: "#6366F1", fontSize: 16 }} />
                    <Typography variant="caption" fontWeight={700} color="#6366F1">AI Suggestion</Typography>
                  </Stack>
                  <Typography variant="body2" fontWeight={600} mb={0.5}>
                    Book Appointment{" "}
                    <Typography component="span" variant="caption" color="text.secondary" fontWeight={400}>
                      | Lead confirmed interest via WhatsApp
                    </Typography>
                  </Typography>
                  <Typography variant="caption" color="#6366F1" sx={{ cursor: "pointer", fontWeight: 600 }}>
                    Apply suggestion
                  </Typography>
                </Box>

                {/* NEXT ACTION label */}
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.8px", display: "block", mb: 1.5 }}>
                  Next Action
                </Typography>

                {/* Active action card */}
                <Card variant="outlined" sx={{ p: 2, borderRadius: "12px", mb: 3, border: "1px solid #E2E8F0" }}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Box sx={{ p: 1, bgcolor: "#EFF6FF", borderRadius: "8px", mt: 0.25 }}>
                      <CallOutlinedIcon sx={{ color: "#3B82F6", fontSize: 20 }} />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight={700} mb={1.5}>Call</Typography>

                      <Stack direction="row" spacing={4} mb={1}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}>DUE</Typography>
                          <Typography variant="body2" fontWeight={600}>Today</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}>STATUS</Typography>
                          <Box mt={0.25}>
                            <Chip label="To Do" size="small" sx={{ bgcolor: "#EFF6FF", color: "#3B82F6", fontWeight: 600, borderRadius: "6px", height: 22, fontSize: "0.7rem" }} />
                          </Box>
                        </Box>
                      </Stack>

                      <Box mb={2}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}>DESCRIPTION</Typography>
                        <Typography variant="body2">Call patient to confirm preferred consultation time.</Typography>
                      </Box>

                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 14 }} />}
                          sx={{ textTransform: "none", borderRadius: "8px", borderColor: "#E2E8F0", color: "#475569", fontSize: "0.75rem", py: 0.5 }}
                        >
                          Mark Done
                        </Button>
                        <CallButton lead={lead} />
                      </Stack>
                    </Box>
                  </Stack>
                </Card>

                {/* PREVIOUS ACTIONS label */}
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.8px", display: "block", mb: 1.5 }}>
                  Previous Actions
                </Typography>

                {/* Previous action card */}
                <Card variant="outlined" sx={{ p: 2, borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Box sx={{ p: 1, bgcolor: "#F0FDF4", borderRadius: "8px", mt: 0.25 }}>
                      <CallOutlinedIcon sx={{ color: "#10B981", fontSize: 20 }} />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight={700} mb={1.5}>Follow-Up Call</Typography>
                      <Stack direction="row" spacing={4} mb={1}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}>DUE</Typography>
                          <Typography variant="body2" fontWeight={600}>16/01/2026</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}>STATUS</Typography>
                          <Box mt={0.25}>
                            <Chip label="Completed" size="small" sx={{ bgcolor: "#F0FDF4", color: "#16A34A", fontWeight: 600, borderRadius: "6px", height: 22, fontSize: "0.7rem" }} />
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
                <Typography variant="subtitle2" fontWeight={700}>Notes</Typography>
              </Box>

              {/* Notes grid */}
              <Box sx={{ p: 2.5 }}>
                {/* Error banner */}
                {notesError && (
                  <Alert severity="error" onClose={() => setNotesError(null)} sx={{ mb: 2, borderRadius: "10px" }}>
                    {notesError}
                  </Alert>
                )}

                {/* Loading skeleton */}
                {notesLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <Stack alignItems="center" spacing={1}>
                      <CircularProgress size={24} />
                      <Typography variant="caption" color="text.secondary">Loading notes...</Typography>
                    </Stack>
                  </Box>
                ) : (
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 3 }}>
                  {notes.map((note) =>
                    editingNoteId === note.id ? (
                      // ── EDIT MODE ──────────────────────────────────────────
                      <Card
                        key={note.id}
                        variant="outlined"
                        sx={{ p: 2, borderRadius: "12px", border: "2px solid #6366F1", bgcolor: "#FAFAFE" }}
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
                            "& .MuiInput-underline:before": { borderBottomColor: "#E2E8F0" },
                            "& .MuiInput-underline:after": { borderBottomColor: "#6366F1" },
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
                          inputProps={{ style: { fontSize: "0.875rem", color: "#475569", lineHeight: 1.6 } }}
                          sx={{
                            mb: 2,
                            "& .MuiInput-underline:before": { borderBottom: "none" },
                            "& .MuiInput-underline:after": { borderBottom: "none" },
                            "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottom: "none" },
                          }}
                        />
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            onClick={handleCancelEdit}
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
                            onClick={() => handleSaveEdit(note.id)}
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
                            {editSubmitting ? <CircularProgress size={14} sx={{ color: "white" }} /> : "Save"}
                          </Button>
                        </Stack>
                      </Card>
                    ) : (
                      // ── READ MODE ──────────────────────────────────────────
                      <Card key={note.id} variant="outlined" sx={{ p: 2, borderRadius: "12px", border: "1px solid #E2E8F0", position: "relative" }}>
                        <Typography variant="body2" fontWeight={700} mb={0.5}>{note.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line", mb: 1.5, lineHeight: 1.6 }}>{note.content}</Typography>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" color="text.secondary">{note.time}</Typography>
                          <Stack direction="row" spacing={0.5}>
                            <IconButton size="small" onClick={() => handleStartEdit(note)} sx={{ color: "#94A3B8", "&:hover": { color: "#6366F1" } }}>
                              <EditIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDeleteNote(note.id)} sx={{ color: "#94A3B8", "&:hover": { color: "#EF4444" } }}>
                              <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Stack>
                        </Stack>
                      </Card>
                    )
                  )}
                </Box>
                )} {/* end notesLoading conditional */}

                {/* Add note input area */}
                <Card variant="outlined" sx={{ borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                  <TextField
                    fullWidth
                    placeholder="Title"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    variant="standard"
                    sx={{
                      px: 2,
                      pt: 1.5,
                      "& .MuiInputBase-root": { fontSize: "0.875rem", fontWeight: 600 },
                      "& .MuiInput-underline:before": { borderBottom: "none" },
                      "& .MuiInput-underline:after": { borderBottom: "none" },
                      "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottom: "none" },
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
                        "& .MuiInputBase-root": { fontSize: "0.875rem", color: "#64748B" },
                        "& .MuiInput-underline:before": { borderBottom: "none" },
                        "& .MuiInput-underline:after": { borderBottom: "none" },
                        "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottom: "none" },
                      }}
                    />
                    <Box sx={{ p: 1.5, flexShrink: 0 }}>
                      <IconButton
                        onClick={handleAddNote}
                        disabled={noteSubmitting}
                        sx={{
                          bgcolor: (newNoteTitle.trim() || newNoteContent.trim()) && !noteSubmitting ? "#334155" : "#F1F5F9",
                          color: (newNoteTitle.trim() || newNoteContent.trim()) && !noteSubmitting ? "white" : "#94A3B8",
                          width: 36,
                          height: 36,
                          transition: "all 0.2s",
                          "&:hover": {
                            bgcolor: (newNoteTitle.trim() || newNoteContent.trim()) && !noteSubmitting ? "#1E293B" : "#E2E8F0",
                          },
                        }}
                      >
                        {noteSubmitting ? <CircularProgress size={16} sx={{ color: "#94A3B8" }} /> : <SendIcon sx={{ fontSize: 16 }} />}
                      </IconButton>
                    </Box>
                  </Stack>
                </Card>
              </Box>
            </Card>
          </Box>
        </Stack>
      )}

      {/* CONVERT POPUP */}
      <Dialog
        open={openConvertPopup}
        onClose={handleClosePopup}
        PaperProps={{ sx: { borderRadius: "24px", p: 4, textAlign: "center", maxWidth: "420px", boxShadow: "0px 20px 25px -5px rgba(0,0,0,0.1)" } }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Stack alignItems="center" spacing={2.5}>
            <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <SwapHorizIcon sx={{ fontSize: 32, color: "#F97316" }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>Convert Lead</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ px: 2, lineHeight: 1.6 }}>
                Are you sure you want to Convert <b>"{leadName}"</b> lead into a patient & register it?
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} sx={{ width: "100%", mt: 2 }}>
              <Button fullWidth onClick={handleClosePopup} variant="outlined"
                sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 600, color: "#475569", borderColor: "#E2E8F0", py: 1.2 }}>
                Cancel
              </Button>
              <Button fullWidth variant="contained" onClick={handleClosePopup}
                sx={{ bgcolor: "#475569", borderRadius: "12px", textTransform: "none", fontWeight: 600, py: 1.2, boxShadow: "none", "&:hover": { bgcolor: "#334155" } }}>
                Convert
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialogs />
    </Box>
  );
}

// ====================== Sub-components ======================

const CallMessage = ({ speaker, time, text }: any) => (
  <Box>
    <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
      <Typography variant="caption" fontWeight={700} color="text.primary">{speaker}</Typography>
      <Typography variant="caption" color="text.secondary">{time}</Typography>
    </Stack>
    <Typography variant="body2" color="text.secondary">{text}</Typography>
  </Box>
);

const TimelineItem = ({ icon, title, time, isAvatar, avatarInitial, isLast, onClick, isClickable }: any) => (
  <Stack direction="row" spacing={2}>
    <Stack alignItems="center">
      <Box sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {isAvatar ? <Avatar sx={{ width: 20, height: 20, fontSize: "10px" }}>{avatarInitial}</Avatar> : icon}
      </Box>
      {!isLast && <Box sx={{ width: "2px", flexGrow: 1, bgcolor: "#E2E8F0", my: 0.5 }} />}
    </Stack>
    <Box pb={3} onClick={onClick} sx={{ cursor: isClickable ? "pointer" : "default", "&:hover": isClickable ? { opacity: 0.7 } : {} }}>
      <Typography variant="body2" fontWeight={600}>{title}</Typography>
      <Typography variant="caption" color="text.secondary">{time}</Typography>
    </Box>
  </Stack>
);

const ChatBubble = ({ side, text, time }: any) => (
  <Box sx={{ alignSelf: side === "left" ? "flex-start" : "flex-end", maxWidth: "70%" }}>
    <Box sx={{ p: 1.5, borderRadius: side === "left" ? "0 12px 12px 12px" : "12px 0 12px 12px", bgcolor: side === "left" ? "#FFF" : "#1E293B", color: side === "left" ? "text.primary" : "#FFF", boxShadow: "0px 1px 2px rgba(0,0,0,0.05)" }}>
      <Typography variant="body2">{text}</Typography>
    </Box>
    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block", textAlign: side === "right" ? "right" : "left" }}>{time}</Typography>
  </Box>
);

const Info = ({ label, value, isAvatar }: any) => (
  <Box sx={{ minWidth: "150px" }}>
    <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" mb={0.5}>{label}</Typography>
    {isAvatar ? (
      <Stack direction="row" spacing={1} alignItems="center">
        <Avatar sx={{ width: 20, height: 20, fontSize: "10px" }}>{value?.charAt(0) || "U"}</Avatar>
        <Typography fontWeight={600} variant="body2">{value}</Typography>
      </Stack>
    ) : <Typography fontWeight={600} variant="body2">{value}</Typography>}
  </Box>
);

const DocumentRow = ({ name, size }: any) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center">
    <Stack direction="row" spacing={1.5} alignItems="center">
      <DescriptionOutlinedIcon sx={{ color: "#3B82F6" }} fontSize="small" />
      <Box>
        <Typography variant="body2" fontWeight={600}>{name}</Typography>
        <Typography variant="caption" color="text.secondary">{size}</Typography>
      </Box>
    </Stack>
    <Stack direction="row" spacing={0.5}>
      <IconButton size="small"><FileDownloadOutlinedIcon fontSize="inherit" /></IconButton>
      <IconButton size="small"><ShortcutIcon sx={{ transform: "rotate(90deg)", fontSize: "14px" }} /></IconButton>
    </Stack>
  </Stack>
);