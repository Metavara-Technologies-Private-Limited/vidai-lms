import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  Divider,
  Button,
  Avatar,
  IconButton,
  Breadcrumbs,
  TextField,
  InputAdornment,
  Dialog,
  DialogContent,
  CircularProgress,
  Alert,
  MenuItem,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../store";
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
import EditIcon from "@mui/icons-material/DriveFileRenameOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import HistoryIcon from "@mui/icons-material/History";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import type { RootState } from "../../store";

import { CallButton, Dialogs } from "./LeadsMenuDialogs";

import {
  fetchLeads,
  selectLeads,
  selectLeadsLoading,
  selectLeadsError,
} from "../../store/leadSlice";
import { api } from "../../services/leads.api";

// ====================== Types ======================

type NoteData = {
  id: string;
  uuid?: string;
  title: string;
  content: string;
  time: string;
};

/**
 * ApiLead — shape of leads as returned by the backend API.
 * The base `Lead` type in types.ts uses frontend-normalised field names;
 * the API uses snake_case and has additional fields not present on Lead.
 */
interface ApiLead {
  id: string;
  // name
  full_name?: string;
  name?: string;
  // contact
  phone?: string;
  contact_number?: string;
  contact_no?: string;
  phone_number?: string;
  email?: string;
  // personal
  location?: string;
  gender?: string;
  age?: string | number;
  marital_status?: string;
  address?: string;
  language_preference?: string;
  // assignment
  assigned_to_name?: string;
  assigned?: string;
  // status / quality / score
  status?: string;
  lead_status?: string;
  quality?: string;
  score?: string | number;
  // source
  source?: string;
  sub_source?: string;
  campaign_name?: string;
  campaign_duration?: string;
  // partner
  partner_name?: string;
  partner_full_name?: string;
  partner_age?: string | number;
  partner_gender?: string;
  // appointment
  department?: string;
  department_name?: string;
  personnel?: string;
  appointment_date?: string;
  slot?: string;
  appointment_slot?: string;
  remark?: string;
  appointment_remark?: string;
  // treatment / actions
  treatment_interest?: string;
  next_action_type?: string;
  next_action_status?: string;
  next_action_description?: string;
  task?: string;
  taskStatus?: string;
  // timestamps
  created_at?: string;
  // update-payload fields
  clinic_id?: string | number;
  department_id?: string | number;
  book_appointment?: boolean;
  is_active?: boolean;
  partner_inquiry?: boolean;
}

interface NoteApiResponse {
  id: string;
  title?: string;
  note?: string;
  created_at?: string;
  is_deleted?: boolean;
}

interface EmailTemplate {
  subject: string;
  content: string;
}

/** Minimal shape of axios-style errors we need to inspect */
interface ApiErrorShape {
  response?: {
    data?: {
      detail?: string;
      non_field_errors?: string[];
    };
  };
  message?: string;
}

/** JWT payload fields we care about */
interface JwtPayload {
  user_id?: number;
  id?: number;
  sub?: number | string;
}

// ====================== Helpers ======================

const formatLeadId = (id: string): string => {
  if (id.match(/^#?LN-\d+$/i)) return id.startsWith("#") ? id : `#${id}`;
  const lnMatch = id.match(/#?LN-(\d+)/i);
  if (lnMatch) return `#LN-${lnMatch[1]}`;
  const numMatch = id.match(/\d+/);
  if (numMatch) return `#LN-${numMatch[0]}`;
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `#LN-${(hash % 900) + 100}`;
};

const extractApiError = (err: unknown, fallback: string): string => {
  const e = err as ApiErrorShape;
  return (
    e?.response?.data?.detail ||
    e?.response?.data?.non_field_errors?.[0] ||
    e?.message ||
    fallback
  );
};

// ====================== Component ======================

export default function LeadDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const selectedTemplate = useSelector(
    (state: RootState) => state.emailTemplate.selectedTemplate
  ) as EmailTemplate | null;

  const leads = useSelector(selectLeads) as ApiLead[];
  const loading = useSelector(selectLeadsLoading) as boolean;
  const error = useSelector(selectLeadsError) as string | null;

  const [activeTab, setActiveTab] = React.useState("Patient Info");
  const [openConvertPopup, setOpenConvertPopup] = React.useState(false);
  const [historyView, setHistoryView] = React.useState<"chatbot" | "call" | "email">("chatbot");

  const [notes, setNotes] = React.useState<NoteData[]>([]);
  const [notesLoading, setNotesLoading] = React.useState(false);
  const [notesError, setNotesError] = React.useState<string | null>(null);
  const [newNoteTitle, setNewNoteTitle] = React.useState("");
  const [newNoteContent, setNewNoteContent] = React.useState("");
  const [noteSubmitting, setNoteSubmitting] = React.useState(false);

  const [editingNoteId, setEditingNoteId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editContent, setEditContent] = React.useState("");
  const [editSubmitting, setEditSubmitting] = React.useState(false);

  const [openAddActionDialog, setOpenAddActionDialog] = React.useState(false);
  const [actionType, setActionType] = React.useState("");
  const [actionStatus, setActionStatus] = React.useState("pending");
  const [actionDescription, setActionDescription] = React.useState("");
  const [actionSubmitting, setActionSubmitting] = React.useState(false);

  const [deleteNoteDialog, setDeleteNoteDialog] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const formatNoteTime = (iso: string): string =>
    new Date(iso)
      .toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      .toUpperCase();

  const getCurrentUserId = (): number | null => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1])) as JwtPayload;
      const uid = payload.user_id ?? payload.id ?? null;
      return typeof uid === "number" ? uid : null;
    } catch {
      return null;
    }
  };

  React.useEffect(() => {
    if (!leads || leads.length === 0) {
      void dispatch(fetchLeads());
    }
  }, [dispatch, leads]);

  const lead = React.useMemo((): ApiLead | null => {
    if (!leads || leads.length === 0) return null;
    const cleanId = decodeURIComponent(id ?? "")
      .replace("#", "")
      .replace("LN-", "")
      .replace("LD-", "");
    return (
      leads.find((l) => {
        const leadCleanId = l.id.replace("#", "").replace("LN-", "").replace("LD-", "");
        return leadCleanId === cleanId;
      }) ?? null
    );
  }, [leads, id]);

  const fetchNotes = React.useCallback(async (leadUuid: string): Promise<void> => {
    try {
      setNotesLoading(true);
      setNotesError(null);
      const { data } = await api.get<NoteApiResponse[] | { results: NoteApiResponse[] }>(
        `/leads/${leadUuid}/notes/`
      );
      const results: NoteApiResponse[] = Array.isArray(data)
        ? data
        : (data as { results: NoteApiResponse[] }).results ?? [];
      setNotes(
        results
          .filter((n) => !n.is_deleted)
          .map((n) => ({
            id: n.id,
            uuid: n.id,
            title: n.title ?? "",
            content: n.note ?? "",
            time: n.created_at ? formatNoteTime(n.created_at) : "",
          }))
      );
    } catch (err: unknown) {
      setNotesError(extractApiError(err, "Failed to load notes"));
    } finally {
      setNotesLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (lead) {
      void fetchNotes(decodeURIComponent(id ?? ""));
    }
  }, [lead, fetchNotes, id]);

  const handleAddNote = async (): Promise<void> => {
    if (!newNoteTitle.trim() && !newNoteContent.trim()) return;
    if (!lead) return;
    try {
      setNoteSubmitting(true);
      setNotesError(null);
      const userId = getCurrentUserId();
      const { data: created } = await api.post<NoteApiResponse>("/leads/notes/", {
        title: newNoteTitle.trim() || "Note",
        note: newNoteContent.trim(),
        lead: decodeURIComponent(id ?? ""),
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
    } catch (err: unknown) {
      setNotesError(extractApiError(err, "Failed to save note"));
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleStartEdit = (note: NoteData): void => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleCancelEdit = (): void => {
    setEditingNoteId(null);
    setEditTitle("");
    setEditContent("");
  };

  const handleSaveEdit = async (noteId: string): Promise<void> => {
    const note = notes.find((n) => n.id === noteId);
    if (!note || !lead) return;
    try {
      setEditSubmitting(true);
      setNotesError(null);
      const userId = getCurrentUserId();
      const { data: updated } = await api.put<NoteApiResponse>(
        `/leads/notes/${noteId}/update/`,
        {
          title: editTitle.trim(),
          note: editContent.trim(),
          lead: decodeURIComponent(id ?? ""),
          ...(userId !== null && { created_by: userId }),
        }
      );
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
    } catch (err: unknown) {
      setNotesError(extractApiError(err, "Failed to update note"));
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string): Promise<void> => {
    try {
      await api.delete(`/leads/notes/${noteId}/delete/`);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setDeleteNoteDialog(null);
    } catch (err: unknown) {
      setNotesError(extractApiError(err, "Failed to delete note"));
    }
  };

  const handleAddNextAction = async (): Promise<void> => {
    if (!actionType.trim() || !actionDescription.trim() || !lead) return;
    try {
      setActionSubmitting(true);
      const leadUuid = decodeURIComponent(id ?? "");
      await api.put(`/leads/${leadUuid}/update/`, {
        clinic_id: lead.clinic_id,
        department_id: lead.department_id,
        full_name: lead.full_name || lead.name,
        contact_no: lead.contact_no || lead.phone || lead.phone_number || "",
        source: lead.source || "Unknown",
        treatment_interest: lead.treatment_interest || "N/A",
        book_appointment: lead.book_appointment || false,
        appointment_date: lead.appointment_date || "",
        slot: lead.slot || "",
        is_active: lead.is_active !== false,
        partner_inquiry: lead.partner_inquiry || false,
        next_action_type: actionType,
        next_action_status: actionStatus,
        next_action_description: actionDescription.trim(),
      });
      setOpenAddActionDialog(false);
      setActionType("");
      setActionStatus("pending");
      setActionDescription("");
      setActionError(null);
      void dispatch(fetchLeads());
    } catch (err: unknown) {
      setActionError(extractApiError(err, "Failed to save action. Please try again."));
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleOpenPopup = (): void => setOpenConvertPopup(true);
  const handleClosePopup = (): void => setOpenConvertPopup(false);

  const handleEdit = (): void => {
    if (!lead) return;
    const cleanId = lead.id.replace("#", "").replace("LN-", "").replace("LD-", "");
    navigate(`/leads/edit/${cleanId}`, { state: { lead } });
  };

  // ── Loading / Error / Not Found ──
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
          <Typography
            variant="body2"
            sx={{ mt: 1, color: "primary.main", cursor: "pointer", textDecoration: "underline" }}
            onClick={() => void dispatch(fetchLeads())}
          >
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
          <Typography variant="body2">
            The lead you're looking for doesn't exist or may have been deleted.
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 1, color: "primary.main", cursor: "pointer", textDecoration: "underline" }}
            onClick={() => navigate("/leads")}
          >
            Go back to Leads Hub
          </Typography>
        </Alert>
      </Box>
    );
  }

  // ── Extract Data ──
  const leadName = lead.full_name || lead.name || "Unknown";
  const leadInitials = leadName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const leadPhone = lead.phone || lead.contact_number || lead.contact_no || "N/A";
  const leadEmail = lead.email || "N/A";
  const leadLocation = lead.location || "N/A";
  const leadGender = lead.gender || "N/A";
  const leadAge = String(lead.age ?? "N/A");
  const leadMaritalStatus = lead.marital_status || "N/A";
  const leadAddress = lead.address || "N/A";
  const leadLanguage = lead.language_preference || "N/A";
  const leadAssigned = lead.assigned_to_name || lead.assigned || "Unassigned";
  const leadStatus = lead.status || lead.lead_status || "New";
  const leadQuality = lead.quality || "N/A";
  const leadScore = String(lead.score ?? 0).includes("%")
    ? String(lead.score)
    : `${lead.score ?? 0}%`;
  const leadSource = lead.source || "Unknown";
  const leadSubSource = lead.sub_source || "N/A";
  const leadCampaignName = lead.campaign_name || "N/A";
  const leadCampaignDuration = lead.campaign_duration || "N/A";
  const leadDisplayId = formatLeadId(lead.id);
  const partnerName = lead.partner_name || lead.partner_full_name || "N/A";
  const partnerAge = String(lead.partner_age ?? "N/A");
  const partnerGender = lead.partner_gender || "N/A";
  const appointmentDepartment = lead.department || lead.department_name || "N/A";
  const appointmentPersonnel = lead.personnel || lead.assigned_to_name || "N/A";
  const appointmentDate = lead.appointment_date
    ? new Date(lead.appointment_date).toLocaleDateString("en-GB")
    : "N/A";
  const appointmentSlot = lead.slot || lead.appointment_slot || "N/A";
  const appointmentRemark = lead.remark || lead.appointment_remark || "N/A";
  const treatmentInterest = lead.treatment_interest
    ? lead.treatment_interest.split(",").map((t: string) => t.trim())
    : [];
  const leadCreatedAt = lead.created_at
    ? new Date(lead.created_at).toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";
  const nextActionType = lead.next_action_type || lead.task || "N/A";
  const nextActionStatus = lead.next_action_status || lead.taskStatus || "Pending";
  const nextActionDescription = lead.next_action_description || "N/A";

  // ── Chip colors ──
  const getStatusStyle = (s: string): { bg: string; color: string; border: string } => {
    const sl = s.toLowerCase();
    if (sl === "new") return { bg: "#EFF6FF", color: "#3B82F6", border: "#BFDBFE" };
    if (sl === "appointment") return { bg: "#EFF6FF", color: "#3B82F6", border: "#BFDBFE" };
    if (sl === "converted") return { bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" };
    if (sl === "lost") return { bg: "#FEF2F2", color: "#EF4444", border: "#FECACA" };
    return { bg: "#F1F5F9", color: "#64748B", border: "#E2E8F0" };
  };
  const getQualityStyle = (q: string): { bg: string; color: string } => {
    if (q === "Hot") return { bg: "#FEF2F2", color: "#EF4444" };
    if (q === "Warm") return { bg: "#FEF3C7", color: "#F59E0B" };
    return { bg: "#F1F5F9", color: "#64748B" };
  };
  const statusStyle = getStatusStyle(leadStatus);
  const qualityStyle = getQualityStyle(leadQuality);

  const tabConfig = [
    { label: "Patient Info", icon: <PersonOutlineIcon sx={{ fontSize: 15 }} /> },
    { label: "History", icon: <HistoryIcon sx={{ fontSize: 15 }} /> },
    { label: "Next Action", icon: <PlayArrowIcon sx={{ fontSize: 15 }} /> },
  ];

  const sectionCard = {
    bgcolor: "#FFFFFF",
    borderRadius: "16px",
    border: "1px solid #E8EDF2",
    boxShadow: "0px 1px 4px rgba(0,0,0,0.04)",
  };

  return (
    <Box sx={{ p: 3, minHeight: "100vh", bgcolor: "#F4F6F9" }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }} />

      {/* ══ TOP SUMMARY ══ */}
      <Box sx={{ ...sectionCard, position: "relative", mb: 2, pt: "44px", pb: 2, px: 3, pl: "108px" }}>
        <Box sx={{ position: "absolute", top: -28, left: 20, zIndex: 2 }}>
          <Avatar sx={{ bgcolor: "#EDE9FE", color: "#7C3AED", width: 68, height: 68, fontSize: "22px", fontWeight: 800, border: "4px solid #F4F6F9", boxShadow: "0 4px 14px rgba(124,58,237,0.18)", letterSpacing: "0.5px" }}>
            {leadInitials}
          </Avatar>
        </Box>
        <Stack direction="row" spacing={3} alignItems="center">
          <Box sx={{ borderRight: "1px solid #F1F5F9", pr: 3 }}>
            <Typography variant="caption" color="#94A3B8" display="block" mb={0.25} fontSize="11px">Lead Name</Typography>
            <Typography fontWeight={700} fontSize="13px" color="#0F172A">{leadName}</Typography>
          </Box>
          <Box sx={{ borderRight: "1px solid #F1F5F9", pr: 3 }}>
            <Typography variant="caption" color="#94A3B8" display="block" mb={0.25} fontSize="11px">Lead ID</Typography>
            <Typography fontWeight={600} fontSize="13px" color="#0F172A">{leadDisplayId}</Typography>
          </Box>
          <Box sx={{ borderRight: "1px solid #F1F5F9", pr: 3 }}>
            <Typography variant="caption" color="#94A3B8" display="block" mb={0.25} fontSize="11px">Source</Typography>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Box sx={{ width: 12, height: 12, bgcolor: "#F59E0B", borderRadius: "50%", flexShrink: 0 }} />
              <Typography fontWeight={600} fontSize="13px" color="#0F172A">{leadSource}</Typography>
            </Stack>
          </Box>
          <Box sx={{ borderRight: "1px solid #F1F5F9", pr: 3 }}>
            <Typography variant="caption" color="#94A3B8" display="block" mb={0.5} fontSize="11px">Lead Status</Typography>
            <Chip label={leadStatus} size="small" sx={{ bgcolor: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, fontWeight: 600, borderRadius: "6px", height: 22, fontSize: "11px" }} />
          </Box>
          <Box sx={{ borderRight: "1px solid #F1F5F9", pr: 3 }}>
            <Typography variant="caption" color="#94A3B8" display="block" mb={0.5} fontSize="11px">Lead Quality</Typography>
            <Chip label={leadQuality} size="small" sx={{ bgcolor: qualityStyle.bg, color: qualityStyle.color, fontWeight: 600, borderRadius: "6px", height: 22, fontSize: "11px" }} />
          </Box>
          <Box>
            <Typography variant="caption" color="#94A3B8" display="block" mb={0.25} fontSize="11px">AI Lead Score</Typography>
            <Typography fontWeight={700} fontSize="13px" color="#EC4899">{leadScore}</Typography>
          </Box>
        </Stack>
      </Box>

      {/* ══ TABS + ACTION BUTTONS ══ */}
      <Box sx={{ ...sectionCard, px: 2.5, py: 1.5, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1}>
            {tabConfig.map((t) => {
              const isActive = activeTab === t.label;
              return (
                <Box key={t.label} onClick={() => setActiveTab(t.label)}
                  sx={{ display: "flex", alignItems: "center", gap: "6px", px: "14px", py: "7px", borderRadius: "10px", cursor: "pointer", bgcolor: isActive ? "#FFF7ED" : "transparent", border: isActive ? "1px solid #EA580C" : "1px solid transparent", transition: "all 0.15s", userSelect: "none", "&:hover": { bgcolor: "#FFF7ED", borderColor: "#EA580C" } }}>
                  <Box sx={{ color: isActive ? "#EA580C" : "#64748B", display: "flex", alignItems: "center" }}>{t.icon}</Box>
                  <Typography fontSize="13px" fontWeight={isActive ? 700 : 600} color={isActive ? "#EA580C" : "#64748B"}>{t.label}</Typography>
                </Box>
              );
            })}
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" startIcon={<EditOutlinedIcon sx={{ fontSize: 15 }} />} onClick={handleEdit}
              sx={{ borderRadius: "10px", textTransform: "none", color: "#374151", borderColor: "#E2E8F0", fontWeight: 600, fontSize: "13px", height: 36, px: 2, bgcolor: "#FFFFFF", "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" } }}>
              Edit
            </Button>
            <Button variant="contained" onClick={handleOpenPopup} startIcon={<SwapHorizIcon sx={{ fontSize: 15 }} />}
              sx={{ borderRadius: "10px", textTransform: "none", bgcolor: "#1E293B", fontWeight: 600, fontSize: "13px", height: 36, px: 2, boxShadow: "none", "&:hover": { bgcolor: "#0F172A", boxShadow: "none" } }}>
              Convert Lead
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* ══ PATIENT INFO TAB ══ */}
      {activeTab === "Patient Info" && (
        <Stack direction="row" spacing={2.5} alignItems="flex-start">
          <Box sx={{ flex: 2, ...sectionCard, p: 3 }}>
            <Typography fontWeight={700} fontSize="15px" color="#0F172A" mb={2.5}>Basic Information</Typography>
            <Stack spacing={2}>
              <Box sx={{ bgcolor: "#F8FAFC", borderRadius: "12px", p: 2.5, border: "1px solid #EEF2F7" }}>
                <SectionLabel>Lead Information</SectionLabel>
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={6}>
                    <Info label="CONTACT NO" value={leadPhone} />
                    <Info label="EMAIL" value={leadEmail} />
                    <Info label="LOCATION" value={leadLocation} />
                  </Stack>
                  <Stack direction="row" spacing={6}>
                    <Info label="GENDER" value={leadGender} />
                    <Info label="AGE" value={leadAge} />
                    <Info label="MARITAL STATUS" value={leadMaritalStatus} />
                  </Stack>
                  <Stack direction="row" spacing={6}>
                    <Info label="ADDRESS" value={leadAddress} />
                    <Info label="LANGUAGE PREFERENCE" value={leadLanguage} />
                    <Info label="ASSIGNED TO" value={leadAssigned} isAvatar />
                  </Stack>
                  <Info label="CREATED DATE & TIME" value={leadCreatedAt} />
                </Stack>
              </Box>
              <Box sx={{ bgcolor: "#F8FAFC", borderRadius: "12px", p: 2.5, border: "1px solid #EEF2F7" }}>
                <SectionLabel>Partner Information</SectionLabel>
                <Stack direction="row" spacing={6}>
                  <Info label="FULL NAME" value={partnerName} />
                  <Info label="AGE" value={partnerAge} />
                  <Info label="GENDER" value={partnerGender} />
                </Stack>
              </Box>
              <Box sx={{ bgcolor: "#F8FAFC", borderRadius: "12px", p: 2.5, border: "1px solid #EEF2F7" }}>
                <SectionLabel>Source & Campaign Details</SectionLabel>
                <Stack direction="row" spacing={6}>
                  <Info label="SUB-SOURCE" value={leadSubSource} />
                  <Info label="CAMPAIGN NAME" value={leadCampaignName} />
                  <Info label="CAMPAIGN DURATION" value={leadCampaignDuration} />
                </Stack>
              </Box>
            </Stack>
          </Box>

          <Stack spacing={2} sx={{ flex: 1 }}>
            <Box sx={{ ...sectionCard, overflow: "hidden" }}>
              <Box sx={{ px: 3, py: 1.75, bgcolor: "#F0FDF4", borderBottom: "1px solid #DCFCE7" }}>
                <Typography color="#16A34A" fontWeight={700} fontSize="14px">Appointment</Typography>
              </Box>
              <Box sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" mb={2}>
                  <Box><FieldLabel>DEPARTMENT</FieldLabel><Typography fontWeight={600} fontSize="13px" color="#0F172A">{appointmentDepartment}</Typography></Box>
                  <Box><FieldLabel>PERSONNEL</FieldLabel><Typography fontWeight={600} fontSize="13px" color="#0F172A">{appointmentPersonnel}</Typography></Box>
                </Stack>
                <Stack direction="row" justifyContent="space-between" mb={2}>
                  <Box><FieldLabel>DATE</FieldLabel><Typography fontWeight={600} fontSize="13px" color="#0F172A">{appointmentDate}</Typography></Box>
                  <Box><FieldLabel>SLOT</FieldLabel><Typography fontWeight={600} fontSize="13px" color="#0F172A">{appointmentSlot}</Typography></Box>
                </Stack>
                <FieldLabel>REMARK</FieldLabel>
                <Typography fontSize="13px" color="#374151">{appointmentRemark}</Typography>
              </Box>
            </Box>

            <Box sx={{ ...sectionCard, p: 2.5 }}>
              <Typography fontWeight={700} fontSize="14px" color="#0F172A" mb={2}>Treatment Interest</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {treatmentInterest.length > 0
                  ? treatmentInterest.map((t: string, i: number) => (
                      <Chip key={i} label={t} size="small" sx={{ bgcolor: "#F5F3FF", color: "#7C3AED", fontWeight: 600, fontSize: "12px", borderRadius: "6px", mb: 1, height: 26 }} />
                    ))
                  : <Typography variant="body2" color="text.secondary">No treatments selected</Typography>}
              </Stack>
            </Box>

            <Box sx={{ ...sectionCard, p: 2.5 }}>
              <Typography fontWeight={700} fontSize="14px" color="#0F172A" mb={2}>Documents</Typography>
              <Stack spacing={2}>
                <DocumentRow name="ivf_report_2024.pdf" size="1.24 MB" />
                <DocumentRow name="body_checkup_2024.doc" size="2.03 MB" />
              </Stack>
            </Box>
          </Stack>
        </Stack>
      )}

      {/* ══ HISTORY TAB ══ */}
      {activeTab === "History" && (
        <Stack direction="row" spacing={2.5}>
          <Box sx={{ width: 340, flexShrink: 0, ...sectionCard, p: 3 }}>
            <Typography fontWeight={700} fontSize="15px" color="#0F172A" mb={3}>Activity Timeline</Typography>
            <Stack spacing={0}>
              <TimelineItem icon={<ChatBubbleOutlineIcon sx={{ fontSize: 14, color: "#6366F1" }} />} title="Appointment Booked - Confirmation sent (SMS)" time={leadCreatedAt} />
              <TimelineItem icon={<CallOutlinedIcon sx={{ fontSize: 14, color: "#10B981" }} />} title="Outgoing call attempted - Connected" time={leadCreatedAt} onClick={() => setHistoryView("call")} isClickable />
              <TimelineItem icon={<EmailOutlinedIcon sx={{ fontSize: 14, color: "#F59E0B" }} />} title="Patient shared contact number and email" time={leadCreatedAt} onClick={() => setHistoryView("email")} isClickable />
              <TimelineItem icon={<EmailOutlinedIcon sx={{ fontSize: 14, color: "#3B82F6" }} />} title="Sent an Welcome Email" time={leadCreatedAt} onClick={() => setHistoryView("email")} isClickable />
              <TimelineItem isAvatar avatarInitial={leadAssigned.charAt(0)} title={`Assigned to ${leadAssigned}`} time={leadCreatedAt} />
              <TimelineItem icon={<ChatBubbleOutlineIcon sx={{ fontSize: 14, color: "#8B5CF6" }} />} title="Lead arrived from Website Chatbot" time={leadCreatedAt} onClick={() => setHistoryView("chatbot")} isClickable isLast />
            </Stack>
          </Box>

          <Box sx={{ flex: 1, ...sectionCard, display: "flex", flexDirection: "column", overflow: "hidden", maxHeight: "600px" }}>
            {historyView === "chatbot" && (
              <>
                <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #F1F5F9" }}>
                  <Typography fontWeight={700} fontSize="15px" color="#0F172A">Chatbot</Typography>
                </Box>
                <Box sx={{ flexGrow: 1, p: 3, overflowY: "auto", bgcolor: "#F8FAFC" }}>
                  <Stack spacing={2.5}>
                    <Typography variant="caption" align="center" color="#94A3B8" display="block" fontWeight={600}>
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase() : "TODAY"}
                    </Typography>
                    <ChatBubble side="left" text="Hello! How can I help you today?" time="9:41 AM" />
                    <ChatBubble side="right" text="I'm looking for a general health check-up" time="9:42 AM" />
                    <ChatBubble side="left" text="Great! I can help you schedule that." time="9:43 AM" />
                    <ChatBubble side="right" text="Sometime this week, preferably in the morning" time="9:44 AM" />
                    <ChatBubble side="right" text={`My name is ${leadName}, and my number is ${leadPhone}`} time="9:46 AM" />
                  </Stack>
                </Box>
                <Box sx={{ p: 2, borderTop: "1px solid #F1F5F9", bgcolor: "#FFFFFF" }}>
                  <TextField fullWidth placeholder="Type your message..." size="small"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: "#F8FAFC" } }}
                    InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton size="small" sx={{ color: "#6366F1" }}><SendIcon sx={{ fontSize: 17 }} /></IconButton></InputAdornment>) }} />
                </Box>
              </>
            )}
            {historyView === "call" && (
              <>
                <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #F1F5F9" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography fontWeight={700} fontSize="15px" color="#0F172A">Call Transcript</Typography>
                    <CallButton lead={lead} />
                  </Stack>
                </Box>
                <Box sx={{ flexGrow: 1, p: 3, overflowY: "auto", bgcolor: "#F8FAFC" }}>
                  <Stack spacing={3}>
                    <Typography variant="caption" align="center" color="#94A3B8" display="block" fontWeight={600}>
                      CALL - {lead.created_at ? new Date(lead.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase() : "TODAY"}
                    </Typography>
                    <CallMessage speaker="Mike" time="0:03" text="Good morning! You've reached Bloom Fertility Center. This is Mike. How can I help you today?" />
                    <CallMessage speaker={leadName.split(" ")[0]} time="0:15" text="Hi Mike, I'm calling to get some information about IVF. My wife and I are considering starting treatment." />
                    <CallMessage speaker="Mike" time="0:25" text="Of course. I'd be happy to guide you. May I know your wife's age and how long you both have been trying to conceive?" />
                    <CallMessage speaker={leadName.split(" ")[0]} time="0:32" text="She's 32, and we've been trying for about four years now." />
                  </Stack>
                </Box>
              </>
            )}
            {historyView === "email" && (
              <>
                <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #F1F5F9" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography fontWeight={700} fontSize="15px" color="#0F172A">Email History</Typography>
                    <IconButton onClick={() => (window.location.href = `mailto:${leadEmail}`)} sx={{ bgcolor: "#EFF6FF", width: 32, height: 32, "&:hover": { bgcolor: "#DBEAFE" } }}>
                      <EmailOutlinedIcon sx={{ color: "#3B82F6", fontSize: 17 }} />
                    </IconButton>
                  </Stack>
                </Box>
                <Box sx={{ flexGrow: 1, p: 3, overflowY: "auto", bgcolor: "#F8FAFC" }}>
                  <Stack spacing={2}>
                    <Box sx={{ bgcolor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", p: 2.5 }}>
                      <Stack direction="row" justifyContent="space-between" mb={2}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ width: 34, height: 34, bgcolor: "#EEF2FF", color: "#6366F1", fontSize: "12px", fontWeight: 700 }}>{leadInitials}</Avatar>
                          <Box>
                            <Typography fontSize="13px" fontWeight={700}>{leadName}</Typography>
                            <Typography variant="caption" color="text.secondary">{leadEmail}</Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            {lead.created_at ? new Date(lead.created_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit" }) : "Today"}
                          </Typography>
                          <IconButton size="small"><ShortcutIcon sx={{ fontSize: 13 }} /></IconButton>
                        </Stack>
                      </Stack>
                      <Typography fontSize="13px" mb={1}>Hello,</Typography>
                      <Typography fontSize="13px" color="text.secondary" mb={1}>I came across Crysta IVF while searching online and would like to know more about fertility check-up consultations.</Typography>
                      <Typography fontSize="13px" color="text.secondary" mb={2}>Could you please let me know the consultation process and available appointment slots this week?</Typography>
                      <Typography fontSize="13px" color="text.secondary">Regards,</Typography>
                      <Typography fontSize="13px" color="text.secondary">{leadName}</Typography>
                      <Typography fontSize="13px" color="text.secondary">{leadPhone}</Typography>
                    </Box>
                    {selectedTemplate && (
                      <Box sx={{ bgcolor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", p: 2.5 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                          <Avatar sx={{ width: 34, height: 34, bgcolor: "#FEF2F2", color: "#EF4444", fontSize: "12px" }}>CC</Avatar>
                          <Box>
                            <Typography fontSize="13px" fontWeight={700}>Crysta Clinic</Typography>
                            <Typography variant="caption" color="text.secondary">team@crystaivf.com</Typography>
                          </Box>
                        </Stack>
                        <Typography fontSize="13px" fontWeight={700} mb={1}>{selectedTemplate.subject}</Typography>
                        <Typography fontSize="13px" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>{selectedTemplate.content}</Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>
              </>
            )}
          </Box>
        </Stack>
      )}

      {/* ══ NEXT ACTION TAB ══ */}
      {activeTab === "Next Action" && (
        <Stack direction="row" spacing={2.5} alignItems="flex-start">
          <Box sx={{ width: 310, flexShrink: 0, ...sectionCard, overflow: "hidden" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 2, borderBottom: "1px solid #EEF2F7" }}>
              <Typography fontWeight={700} fontSize="14px" color="#0F172A">Next Action</Typography>
              <IconButton size="small" onClick={() => setOpenAddActionDialog(true)} sx={{ color: "#6366F1", "&:hover": { bgcolor: "#EEF2FF" } }}>
                <AddCircleOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
            <Box sx={{ p: 2 }}>
              <Box sx={{ p: 2, borderRadius: "12px", mb: 2.5, background: "linear-gradient(135deg, #FDF4FF 0%, #EEF2FF 100%)", border: "1px solid #E9D5FF", position: "relative", overflow: "hidden" }}>
                <Box sx={{ position: "absolute", top: -10, right: -10, width: 60, height: 60, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.3) 0%, transparent 70%)", pointerEvents: "none" }} />
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Box sx={{ width: 22, height: 22, borderRadius: "6px", background: "linear-gradient(135deg, #A78BFA, #EC4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <AutoFixHighIcon sx={{ color: "#FFFFFF", fontSize: 13 }} />
                  </Box>
                  <Typography fontSize="11px" fontWeight={700} color="#7C3AED">AI Suggestion</Typography>
                </Stack>
                <Typography fontSize="13px" fontWeight={600} color="#1E1B4B" mb={0.5}>
                  Book Appointment{" "}
                  <Typography component="span" fontSize="11px" color="#6B7280" fontWeight={400}>| Lead confirmed interest via WhatsApp</Typography>
                </Typography>
                <Typography fontSize="12px" fontWeight={700} sx={{ color: "#7C3AED", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "2px" }}>Apply suggestion</Typography>
              </Box>

              <Typography variant="caption" fontWeight={700} color="#94A3B8" sx={{ textTransform: "uppercase", letterSpacing: "0.8px", display: "block", mb: 1.5, fontSize: "10px" }}>Next Action</Typography>

              <Box sx={{ border: "1px solid #E2E8F0", borderRadius: "12px", p: 2, mb: 2.5, bgcolor: "#FFFFFF" }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Box sx={{ p: 0.75, bgcolor: "#EFF6FF", borderRadius: "8px", mt: 0.25, flexShrink: 0 }}><CallOutlinedIcon sx={{ color: "#3B82F6", fontSize: 17 }} /></Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography fontSize="13px" fontWeight={700} mb={1.5}>{nextActionType}</Typography>
                    <Stack direction="row" spacing={3} mb={1.5}>
                      <Box>
                        <Typography variant="caption" color="#94A3B8" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "9px", letterSpacing: "0.5px", display: "block", mb: 0.25 }}>DUE</Typography>
                        <Typography fontSize="13px" fontWeight={600}>Today</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="#94A3B8" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "9px", letterSpacing: "0.5px", display: "block", mb: 0.25 }}>STATUS</Typography>
                        <Chip label={nextActionStatus} size="small" sx={{ bgcolor: "#EFF6FF", color: "#3B82F6", fontWeight: 600, borderRadius: "6px", height: 20, fontSize: "11px" }} />
                      </Box>
                    </Stack>
                    <Box mb={2}>
                      <Typography variant="caption" color="#94A3B8" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "9px", letterSpacing: "0.5px", display: "block", mb: 0.25 }}>DESCRIPTION</Typography>
                      <Typography fontSize="13px" color="#374151">{nextActionDescription}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button variant="outlined" size="small" startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 13 }} />} sx={{ textTransform: "none", borderRadius: "8px", borderColor: "#E2E8F0", color: "#475569", fontSize: "12px", py: 0.4, "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" } }}>Mark Done</Button>
                      <Button variant="contained" size="small" startIcon={<CallOutlinedIcon sx={{ fontSize: 13 }} />} sx={{ textTransform: "none", borderRadius: "8px", bgcolor: "#1E293B", color: "#FFFFFF", fontSize: "12px", py: 0.4, boxShadow: "none", "&:hover": { bgcolor: "#0F172A", boxShadow: "none" } }}>Call Now</Button>
                    </Stack>
                  </Box>
                </Stack>
              </Box>

              <Typography variant="caption" fontWeight={700} color="#94A3B8" sx={{ textTransform: "uppercase", letterSpacing: "0.8px", display: "block", mb: 1.5, fontSize: "10px" }}>Previous Actions</Typography>
              <Box sx={{ border: "1px solid #E2E8F0", borderRadius: "12px", p: 2, bgcolor: "#FFFFFF" }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Box sx={{ p: 0.75, bgcolor: "#F0FDF4", borderRadius: "8px", mt: 0.25, flexShrink: 0 }}><CallOutlinedIcon sx={{ color: "#10B981", fontSize: 17 }} /></Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography fontSize="13px" fontWeight={700} mb={1.5}>Follow-Up Call</Typography>
                    <Stack direction="row" spacing={3}>
                      <Box>
                        <Typography variant="caption" color="#94A3B8" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "9px", letterSpacing: "0.5px", display: "block", mb: 0.25 }}>DUE</Typography>
                        <Typography fontSize="13px" fontWeight={600}>16/01/2026</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="#94A3B8" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "9px", letterSpacing: "0.5px", display: "block", mb: 0.25 }}>STATUS</Typography>
                        <Chip label="Completed" size="small" sx={{ bgcolor: "#F0FDF4", color: "#16A34A", fontWeight: 600, borderRadius: "6px", height: 20, fontSize: "11px" }} />
                      </Box>
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1, ...sectionCard, overflow: "hidden" }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid #EEF2F7" }}>
              <Typography fontWeight={700} fontSize="15px" color="#0F172A">Notes</Typography>
            </Box>
            <Box sx={{ p: 2.5 }}>
              {notesError && <Alert severity="error" onClose={() => setNotesError(null)} sx={{ mb: 2, borderRadius: "10px" }}>{notesError}</Alert>}
              {notesLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <Stack alignItems="center" spacing={1}>
                    <CircularProgress size={24} />
                    <Typography variant="caption" color="text.secondary">Loading notes...</Typography>
                  </Stack>
                </Box>
              ) : (
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.5, mb: 2.5 }}>
                  {notes.map((note) =>
                    editingNoteId === note.id ? (
                      <Box key={note.id} sx={{ p: 3, borderRadius: "12px", border: "2px solid #6366F1", bgcolor: "#FFFFFF" }}>
                        <TextField fullWidth value={editTitle} onChange={(e) => setEditTitle(e.target.value)} variant="standard" placeholder="Title"
                          inputProps={{ style: { fontWeight: 700, fontSize: "15px" } }}
                          sx={{ mb: 1.5, "& .MuiInput-underline:before": { borderBottomColor: "#E2E8F0" }, "& .MuiInput-underline:after": { borderBottomColor: "#6366F1" } }} />
                        <TextField fullWidth multiline minRows={3} value={editContent} onChange={(e) => setEditContent(e.target.value)} variant="standard" placeholder="Note content..."
                          inputProps={{ style: { fontSize: "14px", color: "#475569", lineHeight: 1.7 } }}
                          sx={{ mb: 2.5, "& .MuiInput-underline:before": { borderBottom: "none" }, "& .MuiInput-underline:after": { borderBottom: "none" }, "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottom: "none" } }} />
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" onClick={handleCancelEdit} disabled={editSubmitting} sx={{ textTransform: "none", fontSize: "13px", color: "#64748B", borderRadius: "8px" }}>Cancel</Button>
                          <Button size="small" variant="contained" onClick={() => handleSaveEdit(note.id)} disabled={editSubmitting}
                            sx={{ textTransform: "none", fontSize: "13px", bgcolor: "#334155", borderRadius: "8px", boxShadow: "none", minWidth: 64, "&:hover": { bgcolor: "#1E293B", boxShadow: "none" } }}>
                            {editSubmitting ? <CircularProgress size={14} sx={{ color: "white" }} /> : "Save"}
                          </Button>
                        </Stack>
                      </Box>
                    ) : (
                      <Box key={note.id} sx={{ p: 3, borderRadius: "12px", border: "1px solid #E2E8F0", bgcolor: "#FFFFFF" }}>
                        <Typography fontSize="15px" fontWeight={700} mb={1} color="#0F172A">{note.title}</Typography>
                        <Typography fontSize="14px" color="#64748B" sx={{ whiteSpace: "pre-line", mb: 2.5, lineHeight: 1.7 }}>{note.content}</Typography>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography fontSize="12px" color="#94A3B8" fontWeight={500}>{note.time}</Typography>
                          <Stack direction="row" spacing={1}>
                            <Box onClick={() => handleStartEdit(note)} sx={{ width: 30, height: 30, borderRadius: "8px", bgcolor: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", "&:hover": { bgcolor: "#DBEAFE" }, transition: "background 0.15s" }}>
                              <EditIcon sx={{ fontSize: 15, color: "#3B82F6" }} />
                            </Box>
                            <Box onClick={() => setDeleteNoteDialog(note.id)} sx={{ width: 30, height: 30, borderRadius: "8px", bgcolor: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", "&:hover": { bgcolor: "#FECACA" }, transition: "background 0.15s" }}>
                              <DeleteOutlineIcon sx={{ fontSize: 15, color: "#EF4444" }} />
                            </Box>
                          </Stack>
                        </Stack>
                      </Box>
                    )
                  )}
                </Box>
              )}
              <Box sx={{ borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden", bgcolor: "#FFFFFF" }}>
                <TextField fullWidth placeholder="Title" value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)} variant="standard"
                  sx={{ px: 2.5, pt: 2, "& .MuiInputBase-root": { fontSize: "15px", fontWeight: 600 }, "& .MuiInput-underline:before": { borderBottom: "none" }, "& .MuiInput-underline:after": { borderBottom: "none" }, "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottom: "none" } }} />
                <Divider sx={{ mx: 2.5, borderColor: "#F1F5F9" }} />
                <Stack direction="row" alignItems="flex-end">
                  <TextField fullWidth multiline minRows={2} placeholder="Write note here..." value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} variant="standard"
                    sx={{ px: 2.5, py: 1.5, "& .MuiInputBase-root": { fontSize: "14px", color: "#64748B" }, "& .MuiInput-underline:before": { borderBottom: "none" }, "& .MuiInput-underline:after": { borderBottom: "none" }, "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottom: "none" } }} />
                  <Box sx={{ p: 1.5, flexShrink: 0 }}>
                    <IconButton onClick={handleAddNote} disabled={noteSubmitting}
                      sx={{ bgcolor: (newNoteTitle.trim() || newNoteContent.trim()) && !noteSubmitting ? "#334155" : "#F1F5F9", color: (newNoteTitle.trim() || newNoteContent.trim()) && !noteSubmitting ? "white" : "#94A3B8", width: 36, height: 36, transition: "all 0.2s", "&:hover": { bgcolor: (newNoteTitle.trim() || newNoteContent.trim()) && !noteSubmitting ? "#1E293B" : "#E2E8F0" } }}>
                      {noteSubmitting ? <CircularProgress size={16} sx={{ color: "#94A3B8" }} /> : <SendIcon sx={{ fontSize: 16 }} />}
                    </IconButton>
                  </Box>
                </Stack>
              </Box>
            </Box>
          </Box>
        </Stack>
      )}

      {/* ══ CONVERT LEAD DIALOG ══ */}
      <Dialog open={openConvertPopup} onClose={handleClosePopup}
        PaperProps={{ sx: { borderRadius: "24px", p: 4, textAlign: "center", maxWidth: "420px", boxShadow: "0px 20px 25px -5px rgba(0,0,0,0.1)" } }}>
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
              <Button fullWidth onClick={handleClosePopup} variant="outlined" sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 600, color: "#475569", borderColor: "#E2E8F0", py: 1.2 }}>Cancel</Button>
              <Button fullWidth variant="contained" onClick={handleClosePopup} sx={{ bgcolor: "#475569", borderRadius: "12px", textTransform: "none", fontWeight: 600, py: 1.2, boxShadow: "none", "&:hover": { bgcolor: "#334155" } }}>Convert</Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* ══ ADD NEXT ACTION DIALOG ══ */}
      {(() => {
        const currentStatus = (lead?.status || lead?.lead_status || "new").toLowerCase();
        const isAppointment = currentStatus === "appointment";
        const isFollowUp =
          currentStatus === "follow up" ||
          currentStatus === "follow-up" ||
          currentStatus === "follow-ups";
        const availableActions: { value: string; label: string }[] = isFollowUp
          ? [{ value: "Appointment", label: "Appointment" }]
          : [
              { value: "Follow Up", label: "Follow Up" },
              { value: "Appointment", label: "Appointment" },
            ];
        const closeDialog = (): void => {
          setOpenAddActionDialog(false);
          setActionType("");
          setActionStatus("pending");
          setActionDescription("");
          setActionError(null);
        };
        return (
          <Dialog open={openAddActionDialog} onClose={closeDialog}
            PaperProps={{ sx: { borderRadius: "16px", p: 3, maxWidth: "500px", width: "100%" } }}>
            <DialogContent sx={{ p: 0 }}>
              <Stack spacing={3}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6" fontWeight={700}>Add Next Action</Typography>
                    <Typography fontSize="12px" color="#64748B" mt={0.5}>
                      Lead status:{" "}
                      <Chip label={lead?.status || lead?.lead_status || "New"} size="small"
                        sx={{ height: 18, fontSize: "11px", fontWeight: 600, bgcolor: isAppointment ? "#EFF6FF" : isFollowUp ? "#FEF3C7" : "#F0FDF4", color: isAppointment ? "#3B82F6" : isFollowUp ? "#F59E0B" : "#16A34A" }} />
                    </Typography>
                  </Box>
                </Stack>
                {isAppointment && <Alert severity="info" sx={{ borderRadius: "10px", fontSize: "13px" }}>This lead already has an <strong>Appointment</strong> status. Fields are disabled.</Alert>}
                {actionError && <Alert severity="error" onClose={() => setActionError(null)} sx={{ borderRadius: "10px", fontSize: "13px" }}>{actionError}</Alert>}
                <Box>
                  <Typography fontSize="13px" fontWeight={600} mb={1}>
                    Action Type *
                    {!isAppointment && (
                      <Typography component="span" fontSize="11px" color="#94A3B8" fontWeight={400} ml={1}>
                        {isFollowUp ? "(Follow Up leads can only move to Appointment)" : "(New leads can move to Follow Up or Appointment)"}
                      </Typography>
                    )}
                  </Typography>
                  <TextField select fullWidth size="small" value={actionType} onChange={(e) => setActionType(e.target.value)} disabled={isAppointment} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}>
                    <MenuItem value="">-- Select --</MenuItem>
                    {availableActions.map((a) => <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>)}
                  </TextField>
                </Box>
                <Box>
                  <Typography fontSize="13px" fontWeight={600} mb={1}>Status *</Typography>
                  <TextField select fullWidth size="small" value={actionStatus} onChange={(e) => setActionStatus(e.target.value)} disabled={isAppointment} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography fontSize="13px" fontWeight={600} mb={1}>Description *</Typography>
                  <TextField fullWidth multiline rows={3} size="small" value={actionDescription} onChange={(e) => setActionDescription(e.target.value)} placeholder="Enter action description..." disabled={isAppointment} sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }} />
                </Box>
                {!isAppointment && actionType && (
                  <Box sx={{ bgcolor: "#F8FAFC", borderRadius: "8px", px: 2, py: 1.25, border: "1px solid #E2E8F0" }}>
                    <Typography fontSize="11px" color="#64748B">
                      Next action type will be set to{" "}
                      <Typography component="span" fontWeight={700} color="#0F172A" fontSize="11px">{actionType}</Typography>
                      {" "}with status{" "}
                      <Typography component="span" fontWeight={700} color="#0F172A" fontSize="11px">{actionStatus}</Typography>
                    </Typography>
                  </Box>
                )}
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button onClick={closeDialog} variant="outlined" disabled={actionSubmitting} sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, color: "#475569", borderColor: "#E2E8F0" }}>Cancel</Button>
                  <Button onClick={handleAddNextAction} variant="contained" disabled={isAppointment || !actionType || !actionDescription || actionSubmitting}
                    sx={{ bgcolor: "#334155", borderRadius: "8px", textTransform: "none", fontWeight: 600, boxShadow: "none", "&:hover": { bgcolor: "#1E293B" }, "&:disabled": { bgcolor: "#E2E8F0", color: "#94A3B8" } }}>
                    {actionSubmitting ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Save"}
                  </Button>
                </Stack>
              </Stack>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* ══ DELETE NOTE DIALOG ══ */}
      <Dialog open={deleteNoteDialog !== null} onClose={() => setDeleteNoteDialog(null)}
        PaperProps={{ sx: { borderRadius: "24px", p: 4, textAlign: "center", maxWidth: "420px", boxShadow: "0px 20px 25px -5px rgba(0,0,0,0.1)" } }}>
        <DialogContent sx={{ p: 0 }}>
          <Stack alignItems="center" spacing={2.5}>
            <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DeleteOutlineIcon sx={{ fontSize: 32, color: "#EF4444" }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>Delete Note</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ px: 2, lineHeight: 1.6 }}>
                This action cannot be undone. Are you sure you want to delete this note permanently?
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} sx={{ width: "100%", mt: 2 }}>
              <Button fullWidth onClick={() => setDeleteNoteDialog(null)} variant="outlined" sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 600, color: "#475569", borderColor: "#E2E8F0", py: 1.2 }}>Cancel</Button>
              <Button fullWidth variant="contained" onClick={() => deleteNoteDialog && handleDeleteNote(deleteNoteDialog)}
                sx={{ bgcolor: "#EF4444", borderRadius: "12px", textTransform: "none", fontWeight: 600, py: 1.2, boxShadow: "none", "&:hover": { bgcolor: "#DC2626" } }}>Delete</Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialogs />
    </Box>
  );
}

// ══════════════════════════════════════
// Helper components — fully typed, zero any
// ══════════════════════════════════════

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <Typography variant="caption" fontWeight={700} color="#94A3B8" display="block" mb={2}
    sx={{ textTransform: "uppercase", letterSpacing: "0.8px", fontSize: "10px" }}>
    {children}
  </Typography>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <Typography variant="caption" color="#64748B" fontWeight={600} display="block" mb={0.5}
    sx={{ textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.6px" }}>
    {children}
  </Typography>
);

interface CallMessageProps { speaker: string; time: string; text: string }
const CallMessage = ({ speaker, time, text }: CallMessageProps) => (
  <Box>
    <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
      <Typography fontSize="13px" fontWeight={700} color="#0F172A">{speaker}</Typography>
      <Typography variant="caption" color="text.secondary">{time}</Typography>
    </Stack>
    <Typography fontSize="13px" color="#64748B">{text}</Typography>
  </Box>
);

interface TimelineItemProps {
  icon?: React.ReactNode;
  title: string;
  time: string;
  isAvatar?: boolean;
  avatarInitial?: string;
  isLast?: boolean;
  onClick?: () => void;
  isClickable?: boolean;
}
const TimelineItem = ({ icon, title, time, isAvatar, avatarInitial, isLast, onClick, isClickable }: TimelineItemProps) => (
  <Stack direction="row" spacing={2}>
    <Stack alignItems="center">
      <Box sx={{ width: 28, height: 28, borderRadius: "50%", bgcolor: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {isAvatar ? <Avatar sx={{ width: 16, height: 16, fontSize: "8px", bgcolor: "#6366F1" }}>{avatarInitial}</Avatar> : icon}
      </Box>
      {!isLast && <Box sx={{ width: "1px", flexGrow: 1, bgcolor: "#E2E8F0", my: 0.5, minHeight: 20 }} />}
    </Stack>
    <Box pb={2.5} onClick={onClick} sx={{ cursor: isClickable ? "pointer" : "default", "&:hover": isClickable ? { opacity: 0.75 } : {} }}>
      <Typography fontSize="13px" fontWeight={600} color="#0F172A">{title}</Typography>
      <Typography variant="caption" color="#94A3B8">{time}</Typography>
    </Box>
  </Stack>
);

interface ChatBubbleProps { side: "left" | "right"; text: string; time: string }
const ChatBubble = ({ side, text, time }: ChatBubbleProps) => (
  <Box sx={{ alignSelf: side === "left" ? "flex-start" : "flex-end", maxWidth: "68%", width: "fit-content" }}>
    <Box sx={{ px: 2, py: 1.25, borderRadius: side === "left" ? "4px 12px 12px 12px" : "12px 4px 12px 12px", bgcolor: side === "left" ? "#FFFFFF" : "#1E293B", color: side === "left" ? "#0F172A" : "#FFFFFF", boxShadow: "0px 1px 2px rgba(0,0,0,0.06)" }}>
      <Typography fontSize="13px">{text}</Typography>
    </Box>
    <Typography variant="caption" color="#94A3B8" sx={{ mt: 0.5, display: "block", textAlign: side === "right" ? "right" : "left" }}>{time}</Typography>
  </Box>
);

interface InfoProps { label: string; value: string; isAvatar?: boolean }
const Info = ({ label, value, isAvatar }: InfoProps) => (
  <Box sx={{ minWidth: "150px" }}>
    <Typography variant="caption" color="#94A3B8" fontWeight={600} display="block" mb={0.5} sx={{ textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.6px" }}>
      {label}
    </Typography>
    {isAvatar ? (
      <Stack direction="row" spacing={1} alignItems="center">
        <Avatar sx={{ width: 16, height: 16, fontSize: "8px", bgcolor: "#6366F1", color: "white" }}>{value?.charAt(0) || "U"}</Avatar>
        <Typography fontWeight={600} fontSize="13px" color="#0F172A">{value}</Typography>
      </Stack>
    ) : (
      <Typography fontWeight={600} fontSize="13px" color="#0F172A">{value}</Typography>
    )}
  </Box>
);

interface DocumentRowProps { name: string; size: string }
const DocumentRow = ({ name, size }: DocumentRowProps) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center">
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{ width: 30, height: 30, borderRadius: "8px", bgcolor: name.endsWith(".pdf") ? "#FEF2F2" : "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <DescriptionOutlinedIcon sx={{ color: name.endsWith(".pdf") ? "#EF4444" : "#3B82F6", fontSize: 15 }} />
      </Box>
      <Box>
        <Typography fontSize="13px" fontWeight={600} color="#0F172A">{name}</Typography>
        <Typography variant="caption" color="#94A3B8">{size}</Typography>
      </Box>
    </Stack>
    <Stack direction="row" spacing={0.25}>
      <IconButton size="small" sx={{ color: "#94A3B8", width: 26, height: 26, "&:hover": { color: "#374151" } }}>
        <FileDownloadOutlinedIcon sx={{ fontSize: 15 }} />
      </IconButton>
      <IconButton size="small" sx={{ color: "#94A3B8", width: 26, height: 26, "&:hover": { color: "#374151" } }}>
        <ShortcutIcon sx={{ transform: "rotate(90deg)", fontSize: "13px" }} />
      </IconButton>
    </Stack>
  </Stack>
);