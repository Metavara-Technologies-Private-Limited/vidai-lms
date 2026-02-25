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
  TextField,
  InputAdornment,
  Dialog,
  DialogContent,
  CircularProgress,
  Alert,
  MenuItem,
} from "@mui/material";
import Facebook from "../../assets/icons/Facebook.svg";
import Instagram from "../../assets/icons/Instagram.svg";
import Linkedin from "../../assets/icons/Linkedin.svg";
import GoogleAds from "../../assets/icons/Google_Ads.svg";
import GoogleCalender from "../../assets/icons/Google_Calender.svg";

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
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import Lead_Subtract from "../../assets/icons/Lead_Subtract.svg";
import type { RootState } from "../../store";

import { CallButton, Dialogs } from "./LeadsMenuDialogs";

import {
  fetchLeads,
  convertLead,
  selectLeads,
  selectLeadsLoading,
  selectLeadsError,
} from "../../store/leadSlice";
import { api, LeadAPI } from "../../services/leads.api";

// ====================== Types ======================
interface NoteData {
  id: string;
  uuid?: string;
  title: string;
  content: string;
  time: string;
}

interface RawNote {
  id: string;
  title?: string;
  note?: string;
  created_at?: string;
  is_deleted?: boolean;
}

interface LeadRecord {
  id: string;
  full_name?: string;
  name?: string;
  assigned_to_name?: string;
  assigned?: string;
  status?: string;
  lead_status?: string;
  quality?: string;
  score?: number | string;
  source?: string;
  sub_source?: string;
  campaign_name?: string;
  campaign_duration?: string;
  phone?: string;
  contact_number?: string;
  contact_no?: string;
  email?: string;
  location?: string;
  gender?: string;
  age?: number | string;
  marital_status?: string;
  address?: string;
  language_preference?: string;
  created_at?: string;
  initials?: string;
  department?: string;
  department_name?: string;
  department_id?: number;
  clinic_id?: number;
  personnel?: string;
  appointment_date?: string;
  slot?: string;
  appointment_slot?: string;
  remark?: string;
  appointment_remark?: string;
  treatment_interest?: string;
  partner_name?: string;
  partner_full_name?: string;
  partner_age?: number | string;
  partner_gender?: string;
  next_action_type?: string;
  next_action_status?: string;
  next_action_description?: string;
  task?: string;
  taskStatus?: string;
  is_active?: boolean;
  book_appointment?: boolean;
  partner_inquiry?: boolean;
  phone_number?: string;
  documents?: string[];
}

interface CallMessageProps {
  speaker: string;
  time: string;
  text: string;
}

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

interface ChatBubbleProps {
  side: "left" | "right";
  text: string;
  time: string;
}

interface InfoProps {
  label: string;
  value: string;
  isAvatar?: boolean;
}

interface DocumentRowProps {
  name: string;
  size?: string;
  url?: string;
  sx?: object;
}

// ====================== Format Lead ID ======================
const formatLeadId = (id: string): string => {
  if (id.match(/^#?LN-\d+$/i)) {
    return id.startsWith("#") ? id : `#${id}`;
  }
  const lnMatch = id.match(/#?LN-(\d+)/i);
  if (lnMatch) return `#LN-${lnMatch[1]}`;
  const numMatch = id.match(/\d+/);
  if (numMatch) return `#LN-${numMatch[0]}`;
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `#LN-${(hash % 900) + 100}`;
};

// ====================== Document helpers ======================
const getDocColor = (name: string): string => {
  const ext = (name.split(".").pop() ?? "").toLowerCase();
  const map: Record<string, string> = {
    pdf: "#EF4444",
    doc: "#3B82F6",
    docx: "#3B82F6",
    jpg: "#10B981",
    jpeg: "#10B981",
    png: "#10B981",
    webp: "#10B981",
  };
  return map[ext] ?? "#6366F1";
};

const getFileNameFromUrl = (url: string): string => {
  try {
    const decoded = decodeURIComponent(url);
    const parts = decoded.split("/");
    return parts[parts.length - 1].split("?")[0];
  } catch {
    return url;
  }
};

export default function LeadDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const selectedTemplate = useSelector(
    (state: RootState) => state.emailTemplate.selectedTemplate,
  );

  const leads = useSelector(selectLeads) as LeadRecord[] | null;
  const loading = useSelector(selectLeadsLoading) as boolean;
  const error = useSelector(selectLeadsError) as string | null;

  const [activeTab, setActiveTab] = React.useState("Patient Info");
  const [openConvertPopup, setOpenConvertPopup] = React.useState(false);
  const [convertLoading, setConvertLoading] = React.useState(false);
  const [convertError, setConvertError] = React.useState<string | null>(null);
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
  const [actionError, setActionError] = React.useState<string | null>(null);

  const [deleteNoteDialog, setDeleteNoteDialog] = React.useState<string | null>(null);

  // ====================== Document state ======================
  const [documents, setDocuments] = React.useState<string[]>([]);
  const [docsLoading, setDocsLoading] = React.useState(false);
  const [docsError, setDocsError] = React.useState<string | null>(null);

  const pillChipSx = (color: string, bg: string) => ({
    borderRadius: "999px",
    fontWeight: 500,
    fontSize: "12px",
    height: 22,
    px: 1,
    width: "fit-content",
    flex: "0 0 auto",
    alignSelf: "flex-start",
    border: "1.5px solid",
    borderColor: color,
    backgroundColor: bg,
    color: color,
    "& .MuiChip-label": { px: 1 },
  });

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

  const getCurrentUserId = (): number | null => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1])) as Record<string, unknown>;
      const uid = payload.user_id ?? payload.id ?? payload.sub ?? null;
      return typeof uid === "number" ? uid : null;
    } catch {
      return null;
    }
  };

  React.useEffect(() => {
    if (!leads || leads.length === 0) {
      dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0]);
    }
  }, [dispatch, leads]);

  const lead = React.useMemo((): LeadRecord | undefined => {
    if (!leads || leads.length === 0) return undefined;
    const cleanId = decodeURIComponent(id || "")
      .replace("#", "")
      .replace("LN-", "")
      .replace("LD-", "");
    return leads.find((l) => {
      const leadCleanId = l.id
        .replace("#", "")
        .replace("LN-", "")
        .replace("LD-", "");
      return leadCleanId === cleanId;
    });
  }, [leads, id]);

  const fetchNotes = React.useCallback(async (leadUuid: string) => {
    try {
      setNotesLoading(true);
      setNotesError(null);
      const { data } = await api.get(`/leads/${leadUuid}/notes/`);
      const results: RawNote[] = Array.isArray(data) ? data : (data.results ?? []);
      setNotes(
        results
          .filter((n) => !n.is_deleted)
          .map((n) => ({
            id: n.id,
            uuid: n.id,
            title: n.title ?? "",
            content: n.note ?? "",
            time: n.created_at ? formatNoteTime(n.created_at) : "",
          })),
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to load notes";
      setNotesError(message);
    } finally {
      setNotesLoading(false);
    }
  }, []);

  // ====================== Fetch Documents ======================
  const fetchDocuments = React.useCallback(async (leadUuid: string) => {
    try {
      setDocsLoading(true);
      setDocsError(null);
      // First try documents from lead object itself, fallback to API call
      if (lead?.documents && lead.documents.length > 0) {
        setDocuments(lead.documents);
      } else {
        const docs = await LeadAPI.getDocuments(leadUuid);
        setDocuments(docs);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to load documents";
      setDocsError(message);
    } finally {
      setDocsLoading(false);
    }
  }, [lead]);

  React.useEffect(() => {
    if (lead) {
      const rawId = decodeURIComponent(id || "");
      fetchNotes(rawId);
      fetchDocuments(rawId);
    }
  }, [lead, fetchNotes, fetchDocuments, id]);

  // ====================== Note Operations ======================
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
      const createdNote = created as RawNote;
      setNotes((prev) => [
        ...prev,
        {
          id: createdNote.id,
          uuid: createdNote.id,
          title: createdNote.title ?? newNoteTitle,
          content: createdNote.note ?? newNoteContent,
          time: createdNote.created_at ? formatNoteTime(createdNote.created_at) : "",
        },
      ]);
      setNewNoteTitle("");
      setNewNoteContent("");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to save note";
      setNotesError(message);
    } finally {
      setNoteSubmitting(false);
    }
  };

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
      const updatedNote = updated as RawNote;
      setNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? { ...n, title: updatedNote.title ?? editTitle, content: updatedNote.note ?? editContent }
            : n,
        ),
      );
      setEditingNoteId(null);
      setEditTitle("");
      setEditContent("");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to update note";
      setNotesError(message);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await api.delete(`/leads/notes/${noteId}/delete/`);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setDeleteNoteDialog(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Failed to delete note";
      setNotesError(message);
    }
  };

  // ====================== Next Action Handler ======================
  const handleAddNextAction = async () => {
    if (!actionType.trim() || !actionDescription.trim()) return;
    if (!lead) return;
    try {
      setActionSubmitting(true);
      const leadUuid = decodeURIComponent(id || "");
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
      dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0]);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string; non_field_errors?: string[] } }; message?: string };
      const detail =
        axiosErr?.response?.data?.detail ||
        axiosErr?.response?.data?.non_field_errors?.[0] ||
        axiosErr?.message ||
        "Failed to save action. Please try again.";
      setActionError(String(detail));
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleOpenPopup = () => {
    setConvertError(null);
    setOpenConvertPopup(true);
  };

  const handleClosePopup = () => {
    setOpenConvertPopup(false);
    setConvertError(null);
  };

  // ====================== Convert Lead Handler ======================
  const handleConvertLead = async () => {
    if (!lead) return;
    try {
      setConvertLoading(true);
      setConvertError(null);
      const leadUuid = decodeURIComponent(id || "");
      const result = await dispatch(
        convertLead(leadUuid) as unknown as Parameters<typeof dispatch>[0],
      ) as { error?: unknown; payload?: unknown };

      if (convertLead.rejected.match(result as Parameters<typeof convertLead.rejected.match>[0])) {
        const msg =
          (result as { payload?: string; error?: { message?: string } })?.payload ||
          (result as { error?: { message?: string } })?.error?.message ||
          "Failed to convert lead.";
        setConvertError(String(msg));
        return;
      }
      setOpenConvertPopup(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to convert lead. Please try again.";
      setConvertError(message);
    } finally {
      setConvertLoading(false);
    }
  };

  const getCleanLeadId = (leadId: string) =>
    leadId.replace("#", "").replace("LN-", "").replace("LD-", "");

  const handleEdit = () => {
    if (!lead) return;
    navigate(`/leads/edit/${getCleanLeadId(lead.id)}`, { state: { lead } });
  };

  const closeActionDialog = () => {
    setOpenAddActionDialog(false);
    setActionType("");
    setActionStatus("pending");
    setActionDescription("");
    setActionError(null);
  };

  // ====================== Loading / Error / Not Found ======================
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
            onClick={() => dispatch(fetchLeads() as unknown as Parameters<typeof dispatch>[0])}
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
          <Typography variant="body2">The lead you're looking for doesn't exist or may have been deleted.</Typography>
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

  // ====================== Extract Data ======================
  const leadName = lead.full_name || lead.name || "Unknown";
  const leadInitials = lead.initials || leadName.charAt(0).toUpperCase();
  const leadPhone = lead.phone || lead.contact_number || lead.contact_no || "N/A";
  const leadEmail = lead.email || "N/A";
  const leadLocation = lead.location || "N/A";
  const leadGender = lead.gender || "N/A";
  const leadAge = lead.age || "N/A";
  const leadMaritalStatus = lead.marital_status || "N/A";
  const leadAddress = lead.address || "N/A";
  const leadLanguage = lead.language_preference || "N/A";
  const leadAssigned = lead.assigned_to_name || lead.assigned || "Unassigned";
  const leadStatus = lead.status || lead.lead_status || "New";
  const leadQuality = lead.quality || "N/A";
  const leadScore = String(lead.score || 0).includes("%") ? lead.score : `${lead.score || 0}%`;
  const leadSource = lead.source || "Unknown";
  const leadSubSource = lead.sub_source || "N/A";
  const leadCampaignName = lead.campaign_name || "N/A";
  const leadCampaignDuration = lead.campaign_duration || "N/A";
  const leadDisplayId = formatLeadId(lead.id);
  const partnerName = lead.partner_name || lead.partner_full_name || "N/A";
  const partnerAge = lead.partner_age || "N/A";
  const partnerGender = lead.partner_gender || "N/A";
  const appointmentDepartment = lead.department || lead.department_name || "N/A";
  const appointmentPersonnel = lead.personnel || lead.assigned_to_name || "N/A";
  const appointmentDate = lead.appointment_date
    ? new Date(lead.appointment_date).toLocaleDateString("en-GB")
    : "N/A";
  const appointmentSlot = lead.slot || lead.appointment_slot || "N/A";
  const appointmentRemark = lead.remark || lead.appointment_remark || "N/A";
  const treatmentInterest = lead.treatment_interest
    ? lead.treatment_interest.split(",").map((t) => t.trim())
    : [];
  const leadCreatedAt = lead.created_at
    ? new Date(lead.created_at).toLocaleString("en-IN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "N/A";
  const nextActionType = lead.next_action_type || lead.task || "N/A";
  const nextActionStatus = lead.next_action_status || lead.taskStatus || "Pending";
  const nextActionDescription = lead.next_action_description || "N/A";

  const currentStatus = (lead?.status || lead?.lead_status || "new").toLowerCase();
  const isAppointment = currentStatus === "appointment";
  const isFollowUp =
    currentStatus === "follow up" ||
    currentStatus === "follow-up" ||
    currentStatus === "follow-ups";

  const convertedLeadIds: string[] = JSON.parse(localStorage.getItem("converted_lead_ids") || "[]");
  const leadUuidRaw = decodeURIComponent(id || "");
  const isConverted =
    convertedLeadIds.includes(leadUuidRaw) ||
    currentStatus === "converted" ||
    (lead?.lead_status || "").toLowerCase() === "converted";

  const availableActions: { value: string; label: string }[] = isFollowUp
    ? [{ value: "Appointment", label: "Appointment" }]
    : [
        { value: "Follow Up", label: "Follow Up" },
        { value: "Appointment", label: "Appointment" },
      ];

  return (
    <Box p={1} minHeight="100vh">
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }} />

      {/* TOP SUMMARY CARD */}
      <Card elevation={0} sx={{ position: "relative", p: 5, mb: 3, borderRadius: "16px", backgroundColor: "#FAFAFA", overflow: "hidden", boxShadow: "none" }}>
        <Box
          component="img"
          src={Lead_Subtract}
          alt=""
          sx={{ position: "absolute", top: "6px", left: 0, width: "100%", height: "100%", objectFit: "fill", zIndex: 0, pointerEvents: "none" }}
        />
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ position: "relative", width: "100%", zIndex: 1 }}>
          <Stack direction="row" alignItems="flex-end" justifyContent="space-between" sx={{ width: "100%", pl: 2, pr: 1 }}>
            <Avatar sx={{ bgcolor: "#EEF2FF", color: "#6366F1", width: 45, height: 45, fontSize: "30px", fontWeight: 700, transform: "translateY(-35px)", ml: -2, flexShrink: 0 }}>
              {leadInitials}
            </Avatar>
            <Stack spacing={0.5} sx={{ flex: 1.3, transform: "translateY(14px)" }}>
              <Typography variant="caption" color="text.secondary" fontSize="10px">Lead Name</Typography>
              <Typography fontWeight={700} variant="body1" fontSize="12px">{leadName}</Typography>
            </Stack>
            <Stack spacing={0.5} sx={{ flex: 1.3, transform: "translateY(14px)" }}>
              <Typography variant="caption" color="text.secondary" fontSize="10px">Lead ID</Typography>
              <Typography fontWeight={600} variant="body1" fontSize="12px">{leadDisplayId}</Typography>
            </Stack>
            <Stack spacing={0.5} sx={{ flex: 1.3, transform: "translateY(14px)" }}>
              <Typography variant="caption" color="text.secondary" fontSize="10px">Source</Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Box sx={{ width: 16, height: 16, bgcolor: "#FFB800", borderRadius: "50%" }} />
                <Typography fontWeight={600} variant="body1" fontSize="12px">{leadSource}</Typography>
              </Stack>
            </Stack>
            <Stack spacing={0.5} sx={{ flex: 1.3, transform: "translateY(14px)" }}>
              <Typography variant="caption" color="text.secondary" fontSize="10px">Lead Status</Typography>
              <Chip
                label={isConverted ? "Converted" : leadStatus}
                size="small"
                sx={isConverted ? pillChipSx("#16A34A", "rgba(22,163,74,0.10)") : pillChipSx("#5B8FF9", "rgba(91,143,249,0.10)")}
              />
            </Stack>
            <Stack spacing={0.5} sx={{ flex: 1.3, transform: "translateY(14px)" }}>
              <Typography variant="caption" color="text.secondary" fontSize="10px">Lead Quality</Typography>
              <Chip
                label={leadQuality}
                size="small"
                sx={
                  leadQuality === "Hot"
                    ? pillChipSx("#FF4D4F", "rgba(255,77,79,0.10)")
                    : leadQuality === "Warm"
                    ? pillChipSx("#FFC53D", "rgba(255,197,61,0.10)")
                    : pillChipSx("#52C41A", "rgba(82,196,26,0.10)")
                }
              />
            </Stack>
            <Stack spacing={0.5} sx={{ flex: 1.3, transform: "translateY(14px)" }}>
              <Typography variant="caption" color="text.secondary" fontSize="10px">AI Lead Score</Typography>
              <Typography fontWeight={700} color="#EC4899" fontSize="12px">{leadScore}</Typography>
            </Stack>
          </Stack>
        </Stack>
      </Card>

      {/* TABS & ACTION BUTTONS */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box sx={{ bgcolor: "#FAFAFA", borderRadius: "10px", p: 0.8, width: "fit-content", display: "inline-flex", alignItems: "center" }}>
          <Stack direction="row" spacing={1}>
            {["Patient Info", "History", "Next Action"].map((tab) => {
              const selected = activeTab === tab;
              return (
                <Box
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  sx={{
                    cursor: "pointer", px: 2.5, py: 1, borderRadius: "8px",
                    bgcolor: selected ? "#FFFFFF" : "transparent",
                    color: selected ? "#E17E61" : "#232323",
                    boxShadow: selected ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.2s ease", display: "flex", alignItems: "center",
                  }}
                >
                  <Typography fontWeight={600} fontSize="14px" color="inherit">{tab}</Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<EditOutlinedIcon />}
            onClick={handleEdit}
            sx={{ borderRadius: "8px", textTransform: "none", bgcolor: "#f3f3f3", color: "#505050", border: "none", boxShadow: "none", "&:hover": { bgcolor: "#f3f3f3", color: "#232323", border: "none", boxShadow: "none" } }}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            onClick={handleOpenPopup}
            startIcon={<SwapHorizIcon />}
            disabled={isConverted}
            sx={{
              borderRadius: "8px", textTransform: "none",
              bgcolor: isConverted ? "#E2E8F0" : "#505050",
              color: isConverted ? "#94A3B8" : "#FFFFFF",
              px: 2, boxShadow: "none",
              "&:hover": { bgcolor: isConverted ? "#E2E8F0" : "#232323", color: isConverted ? "#94A3B8" : "#FFFFFF", boxShadow: "none" },
              "&:disabled": { bgcolor: "#E2E8F0", color: "#94A3B8" },
            }}
          >
            {isConverted ? "Converted" : "Convert Lead"}
          </Button>
        </Stack>
      </Stack>

      {/* ── PATIENT INFO TAB ── */}
      {activeTab === "Patient Info" && (
        <Stack direction="row" spacing={3}>
          <Box sx={{ flex: 2 }}>
            <Card sx={{ p: 3, borderRadius: "16px", mb: 1, bgcolor: "#fcfcfc", boxShadow: "none", border: "none", mt: -1 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={3}>Basic Information</Typography>
              <Divider sx={{ mb: 1, mt: -2, mx: -3 }} />
              <Typography variant="caption" fontWeight={500} color="#232323" display="block" mb={2} sx={{ textTransform: "uppercase", letterSpacing: "1px" }}>
                Lead Information
              </Typography>
              <Stack spacing={3}>
                <Stack direction="row" spacing={6}>
                  <Info label="CONTACT NO" value={leadPhone} />
                  <Info label="EMAIL" value={leadEmail} />
                  <Info label="LOCATION" value={leadLocation} />
                </Stack>
                <Stack direction="row" spacing={6}>
                  <Info label="GENDER" value={leadGender} />
                  <Info label="AGE" value={String(leadAge)} />
                  <Info label="MARITAL STATUS" value={leadMaritalStatus} />
                </Stack>
                <Stack direction="row" spacing={6}>
                  <Info label="ADDRESS" value={leadAddress} />
                  <Info label="LANGUAGE PREFERENCE" value={leadLanguage} />
                  <Info label="ASSIGNED TO" value={leadAssigned} isAvatar />
                </Stack>
                <Info label="CREATED DATE & TIME" value={leadCreatedAt} />
              </Stack>
              <Divider sx={{ mb: 2, mt: 2, mx: -3 }} />
              <Typography variant="caption" fontWeight={500} color="#232323" display="block" mb={2} sx={{ textTransform: "uppercase", letterSpacing: "1px" }}>
                Partner Information
              </Typography>
              <Stack direction="row" spacing={6}>
                <Info label="FULL NAME" value={partnerName} />
                <Info label="AGE" value={String(partnerAge)} />
                <Info label="GENDER" value={partnerGender} />
              </Stack>
              <Divider sx={{ mb: 2, mt: 2, mx: -3 }} />
              <Typography variant="caption" fontWeight={500} color="#232323" display="block" mb={2} sx={{ textTransform: "uppercase", letterSpacing: "1px" }}>
                Source & Campaign Details
              </Typography>
              <Stack direction="row" spacing={6}>
                <Info label="SUB-SOURCE" value={leadSubSource} />
                <Info label="CAMPAIGN NAME" value={leadCampaignName} />
                <Info label="CAMPAIGN DURATION" value={leadCampaignDuration} />
              </Stack>
            </Card>
          </Box>
          <Stack spacing={3} sx={{ flex: 1 }}>
            <Card sx={{ p: 3, bgcolor: "#fcfffa", borderRadius: "10px", border: "none", mt: -1 }}>
              <Typography color="#16A34A" fontWeight={700} variant="subtitle2" mb={2}>Appointment</Typography>
              <Divider sx={{ mb: 1, mt: 1, mx: -3 }} />
              <Stack direction="row" mb={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">DEPARTMENT</Typography>
                  <Typography fontWeight={600} variant="body2">{appointmentDepartment}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">PERSONNEL</Typography>
                  <Typography fontWeight={600} variant="body2">{appointmentPersonnel}</Typography>
                </Box>
              </Stack>
              <Stack direction="row" mb={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">DATE</Typography>
                  <Typography fontWeight={600} variant="body2">{appointmentDate}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">SLOT</Typography>
                  <Typography fontWeight={600} variant="body2">{appointmentSlot}</Typography>
                </Box>
              </Stack>
              <Typography variant="caption" color="text.secondary">REMARK</Typography>
              <Typography fontWeight={600} variant="body2">{appointmentRemark}</Typography>
            </Card>

            <Card sx={{ p: 3, borderRadius: "10px", backgroundColor: "#fcfcfc", border: "none", boxShadow: "none" }}>
              <Typography fontWeight={700} variant="subtitle2" mb={2}>Treatment Interest</Typography>
              <Divider sx={{ mb: 2, mx: -3 }} />
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {treatmentInterest.length > 0 ? (
                  treatmentInterest.map((treatment, idx) => (
                    <Chip key={idx} label={treatment} size="small" sx={{ bgcolor: "#F5F3FF", color: "#7C3AED", fontWeight: 500, mb: 1 }} />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">No treatments selected</Typography>
                )}
              </Stack>
            </Card>

            {/* ── DOCUMENTS CARD (API-connected) ── */}
            <Card sx={{ p: 2, borderRadius: "10px", mb: 2, backgroundColor: "#fcfcfc", border: "none", boxShadow: "none" }}>
              <Typography fontWeight={700} variant="subtitle2" mb={2}>Documents</Typography>
              <Divider sx={{ mb: 2, mx: -3 }} />

              {docsLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <Stack alignItems="center" spacing={1}>
                    <CircularProgress size={20} />
                    <Typography variant="caption" color="text.secondary">Loading documents...</Typography>
                  </Stack>
                </Box>
              ) : docsError ? (
                <Alert
                  severity="error"
                  onClose={() => setDocsError(null)}
                  sx={{ borderRadius: "8px", fontSize: "12px" }}
                >
                  {docsError}
                </Alert>
              ) : documents.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 2 }}>
                  <InsertDriveFileOutlinedIcon sx={{ fontSize: 32, color: "#CBD5E1", mb: 0.5 }} />
                  <Typography variant="caption" color="text.secondary" display="block">
                    No documents uploaded
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {documents.map((docUrl, idx) => {
                    const fileName = getFileNameFromUrl(docUrl);
                    return (
                      <DocumentRow
                        key={idx}
                        sx={{ backgroundColor: "#FFFFFF", borderRadius: "10px", p: 2 }}
                        name={fileName}
                        url={docUrl}
                      />
                    );
                  })}
                </Stack>
              )}
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
              <TimelineItem isAvatar avatarInitial={leadAssigned.charAt(0)} title={`Assigned to ${leadAssigned}`} time={leadCreatedAt} />
              <TimelineItem icon={<ChatBubbleOutlineIcon sx={{ fontSize: 16, color: "#8B5CF6" }} />} title="Lead arrived from Website Chatbot" time={leadCreatedAt} onClick={() => setHistoryView("chatbot")} isClickable isLast />
            </Stack>
          </Card>
          <Card sx={{ flex: 2, borderRadius: "16px", display: "flex", flexDirection: "column", maxHeight: "600px" }}>
            {historyView === "chatbot" && (
              <>
                <Box p={2} borderBottom="1px solid #E2E8F0">
                  <Typography variant="subtitle1" fontWeight={700}>Chatbot</Typography>
                </Box>
                <Box sx={{ flexGrow: 1, p: 3, overflowY: "auto", bgcolor: "#F8FAFC" }}>
                  <Stack spacing={3}>
                    <Typography variant="caption" align="center" color="text.secondary" display="block">
                      {lead.created_at
                        ? new Date(lead.created_at).toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase()
                        : "TODAY"}
                    </Typography>
                    <ChatBubble side="left" text="Hello! How can I help you today?" time="9:41 AM" />
                    <ChatBubble side="right" text="I'm looking for a general health check-up" time="9:42 AM" />
                    <ChatBubble side="left" text="Great! I can help you schedule that." time="9:43 AM" />
                    <ChatBubble side="right" text="Sometime this week, preferably in the morning" time="9:44 AM" />
                    <ChatBubble side="right" text={`My name is ${leadName}, and my number is ${leadPhone}`} time="9:46 AM" />
                  </Stack>
                </Box>
                <Box p={2} borderTop="1px solid #E2E8F0">
                  <TextField
                    fullWidth
                    placeholder="Type your message..."
                    size="small"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton color="primary"><SendIcon sx={{ fontSize: 18 }} /></IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
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
                      CALL -{" "}
                      {lead.created_at
                        ? new Date(lead.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase()
                        : "TODAY"}
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
                            {lead.created_at
                              ? new Date(lead.created_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })
                              : "Today"}
                          </Typography>
                          <IconButton size="small"><ShortcutIcon sx={{ fontSize: 16 }} /></IconButton>
                        </Stack>
                      </Stack>
                      <Typography variant="body2" color="text.primary" mb={1}>Hello,</Typography>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        I came across Crysta IVF while searching online and would like to know more about fertility check-up consultations.
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        Could you please let me know the consultation process and available appointment slots this week?
                      </Typography>
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
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
                          {selectedTemplate.content}
                        </Typography>
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
          <Box sx={{ width: 320, flexShrink: 0 }}>
            <Card sx={{ borderRadius: "16px", overflow: "hidden" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 2, borderBottom: "1px solid #F1F5F9" }}>
                <Typography variant="subtitle2" fontWeight={700}>Next Action</Typography>
                <IconButton size="small" onClick={() => setOpenAddActionDialog(true)}>
                  <AddCircleOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
              <Box sx={{ p: 2 }}>
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
                  <Typography variant="caption" color="#6366F1" sx={{ cursor: "pointer", fontWeight: 600 }}>Apply suggestion</Typography>
                </Box>

                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.8px", display: "block", mb: 1.5 }}>
                  Next Action
                </Typography>

                <Card variant="outlined" sx={{ p: 2, borderRadius: "12px", mb: 3, border: "1px solid #E2E8F0" }}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Box sx={{ p: 1, bgcolor: "#EFF6FF", borderRadius: "8px", mt: 0.25 }}>
                      <CallOutlinedIcon sx={{ color: "#3B82F6", fontSize: 20 }} />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight={700} mb={1.5}>{nextActionType}</Typography>
                      <Stack direction="row" spacing={4} mb={1}>
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}>DUE</Typography>
                          <Typography variant="body2" fontWeight={600}>Today</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}>STATUS</Typography>
                          <Box mt={0.25}>
                            <Chip label={nextActionStatus} size="small" sx={{ bgcolor: "#EFF6FF", color: "#3B82F6", fontWeight: 600, borderRadius: "6px", height: 22, fontSize: "0.7rem" }} />
                          </Box>
                        </Box>
                      </Stack>
                      <Box mb={2}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: "0.5px" }}>DESCRIPTION</Typography>
                        <Typography variant="body2">{nextActionDescription}</Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button variant="outlined" size="small" startIcon={<CheckCircleOutlineIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: "none", borderRadius: "8px", borderColor: "#E2E8F0", color: "#475569", fontSize: "0.75rem", py: 0.5 }}>
                          Mark Done
                        </Button>
                        <CallButton lead={lead} />
                      </Stack>
                    </Box>
                  </Stack>
                </Card>

                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.8px", display: "block", mb: 1.5 }}>
                  Previous Actions
                </Typography>

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

          {/* RIGHT: Notes Panel */}
          <Box sx={{ flexGrow: 1 }}>
            <Card sx={{ borderRadius: "16px", overflow: "hidden" }}>
              <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid #F1F5F9" }}>
                <Typography variant="subtitle2" fontWeight={700}>Notes</Typography>
              </Box>
              <Box sx={{ p: 2.5 }}>
                {notesError && (
                  <Alert severity="error" onClose={() => setNotesError(null)} sx={{ mb: 2, borderRadius: "10px" }}>{notesError}</Alert>
                )}
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
                        <Card key={note.id} variant="outlined" sx={{ p: 2, borderRadius: "12px", border: "2px solid #6366F1", bgcolor: "#FAFAFE" }}>
                          <TextField
                            fullWidth value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                            variant="standard" placeholder="Title"
                            inputProps={{ style: { fontWeight: 700, fontSize: "0.875rem" } }}
                            sx={{ mb: 1, "& .MuiInput-underline:before": { borderBottomColor: "#E2E8F0" }, "& .MuiInput-underline:after": { borderBottomColor: "#6366F1" } }}
                          />
                          <TextField
                            fullWidth multiline minRows={3} value={editContent} onChange={(e) => setEditContent(e.target.value)}
                            variant="standard" placeholder="Note content..."
                            inputProps={{ style: { fontSize: "0.875rem", color: "#475569", lineHeight: 1.6 } }}
                            sx={{ mb: 2, "& .MuiInput-underline:before": { borderBottom: "none" }, "& .MuiInput-underline:after": { borderBottom: "none" }, "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottom: "none" } }}
                          />
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button size="small" onClick={handleCancelEdit} disabled={editSubmitting} sx={{ textTransform: "none", fontSize: "0.75rem", color: "#64748B", borderRadius: "8px", "&:hover": { bgcolor: "#F1F5F9" } }}>Cancel</Button>
                            <Button size="small" variant="contained" onClick={() => handleSaveEdit(note.id)} disabled={editSubmitting} sx={{ textTransform: "none", fontSize: "0.75rem", bgcolor: "#334155", borderRadius: "8px", boxShadow: "none", minWidth: 64, "&:hover": { bgcolor: "#1E293B", boxShadow: "none" } }}>
                              {editSubmitting ? <CircularProgress size={14} sx={{ color: "white" }} /> : "Save"}
                            </Button>
                          </Stack>
                        </Card>
                      ) : (
                        <Card key={note.id} variant="outlined" sx={{ p: 2, borderRadius: "12px", border: "1px solid #E2E8F0", position: "relative" }}>
                          <Typography variant="body2" fontWeight={700} mb={0.5}>{note.title}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line", mb: 1.5, lineHeight: 1.6 }}>{note.content}</Typography>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="caption" color="text.secondary">{note.time}</Typography>
                            <Stack direction="row" spacing={0.5}>
                              <IconButton size="small" onClick={() => handleStartEdit(note)} sx={{ color: "#3B82F6", "&:hover": { bgcolor: "#EFF6FF" } }}>
                                <EditIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                              <IconButton size="small" onClick={() => setDeleteNoteDialog(note.id)} sx={{ color: "#EF4444", "&:hover": { bgcolor: "#FEF2F2" } }}>
                                <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Stack>
                          </Stack>
                        </Card>
                      ),
                    )}
                  </Box>
                )}

                <Card variant="outlined" sx={{ borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                  <TextField
                    fullWidth placeholder="Title" value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)}
                    variant="standard"
                    sx={{ px: 2, pt: 1.5, "& .MuiInputBase-root": { fontSize: "0.875rem", fontWeight: 600 }, "& .MuiInput-underline:before": { borderBottom: "none" }, "& .MuiInput-underline:after": { borderBottom: "none" }, "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottom: "none" } }}
                  />
                  <Divider sx={{ mx: 2, borderColor: "#F1F5F9" }} />
                  <Stack direction="row" alignItems="flex-end">
                    <TextField
                      fullWidth multiline minRows={2} placeholder="Write note here..." value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)} variant="standard"
                      sx={{ px: 2, py: 1, "& .MuiInputBase-root": { fontSize: "0.875rem", color: "#64748B" }, "& .MuiInput-underline:before": { borderBottom: "none" }, "& .MuiInput-underline:after": { borderBottom: "none" }, "& .MuiInput-underline:hover:not(.Mui-disabled):before": { borderBottom: "none" } }}
                    />
                    <Box sx={{ p: 1.5, flexShrink: 0 }}>
                      <IconButton
                        onClick={handleAddNote}
                        disabled={noteSubmitting}
                        sx={{
                          bgcolor: (newNoteTitle.trim() || newNoteContent.trim()) && !noteSubmitting ? "#334155" : "#F1F5F9",
                          color: (newNoteTitle.trim() || newNoteContent.trim()) && !noteSubmitting ? "white" : "#94A3B8",
                          width: 36, height: 36, transition: "all 0.2s",
                          "&:hover": { bgcolor: (newNoteTitle.trim() || newNoteContent.trim()) && !noteSubmitting ? "#1E293B" : "#E2E8F0" },
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

      {/* ══ CONVERT POPUP ══ */}
      <Dialog
        open={openConvertPopup}
        onClose={convertLoading ? undefined : handleClosePopup}
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
            {convertError && (
              <Alert severity="error" sx={{ width: "100%", borderRadius: "10px", textAlign: "left" }}>{convertError}</Alert>
            )}
            <Stack direction="row" spacing={2} sx={{ width: "100%", mt: 2 }}>
              <Button fullWidth onClick={handleClosePopup} variant="outlined" disabled={convertLoading} sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 600, color: "#232323", borderColor: "#232323", py: 1.2 }}>Cancel</Button>
              <Button fullWidth variant="contained" onClick={handleConvertLead} disabled={convertLoading} sx={{ bgcolor: "#505050", borderRadius: "12px", textTransform: "none", fontWeight: 600, py: 1.2, boxShadow: "none", "&:hover": { bgcolor: "#232323" }, "&:disabled": { bgcolor: "#E2E8F0", color: "#94A3B8" } }}>
                {convertLoading ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Convert"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* ══ ADD NEXT ACTION DIALOG ══ */}
      <Dialog open={openAddActionDialog} onClose={closeActionDialog} PaperProps={{ sx: { borderRadius: "16px", p: 3, maxWidth: "500px", width: "100%" } }}>
        <DialogContent sx={{ p: 0 }}>
          <Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="h6" fontWeight={700}>Add Next Action</Typography>
                <Typography fontSize="12px" color="#64748B" mt={0.5}>
                  Lead status:{" "}
                  <Chip
                    label={lead?.status || lead?.lead_status || "New"}
                    size="small"
                    sx={{ height: 18, fontSize: "11px", fontWeight: 600, bgcolor: isAppointment ? "#EFF6FF" : isFollowUp ? "#FEF3C7" : "#F0FDF4", color: isAppointment ? "#3B82F6" : isFollowUp ? "#F59E0B" : "#16A34A" }}
                  />
                </Typography>
              </Box>
            </Stack>
            {isAppointment && (
              <Alert severity="info" sx={{ borderRadius: "10px", fontSize: "13px" }}>
                This lead already has an <strong>Appointment</strong> status. Fields are disabled.
              </Alert>
            )}
            {actionError && (
              <Alert severity="error" onClose={() => setActionError(null)} sx={{ borderRadius: "10px", fontSize: "13px" }}>{actionError}</Alert>
            )}
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
                {availableActions.map((a) => (
                  <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>
                ))}
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
              <Button onClick={closeActionDialog} variant="outlined" disabled={actionSubmitting} sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600, color: "#475569", borderColor: "#E2E8F0" }}>Cancel</Button>
              <Button onClick={handleAddNextAction} variant="contained" disabled={isAppointment || !actionType || !actionDescription || actionSubmitting} sx={{ bgcolor: "#334155", borderRadius: "8px", textTransform: "none", fontWeight: 600, boxShadow: "none", "&:hover": { bgcolor: "#1E293B" }, "&:disabled": { bgcolor: "#E2E8F0", color: "#94A3B8" } }}>
                {actionSubmitting ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Save"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* ══ DELETE NOTE DIALOG ══ */}
      <Dialog open={deleteNoteDialog !== null} onClose={() => setDeleteNoteDialog(null)} PaperProps={{ sx: { borderRadius: "24px", p: 4, textAlign: "center", maxWidth: "420px", boxShadow: "0px 20px 25px -5px rgba(0,0,0,0.1)" } }}>
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
              <Button fullWidth variant="contained" onClick={() => deleteNoteDialog && handleDeleteNote(deleteNoteDialog)} sx={{ bgcolor: "#EF4444", borderRadius: "12px", textTransform: "none", fontWeight: 600, py: 1.2, boxShadow: "none", "&:hover": { bgcolor: "#DC2626" } }}>
                Delete
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

const CallMessage: React.FC<CallMessageProps> = ({ speaker, time, text }) => (
  <Box>
    <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
      <Typography variant="caption" fontWeight={700} color="text.primary">{speaker}</Typography>
      <Typography variant="caption" color="text.secondary">{time}</Typography>
    </Stack>
    <Typography variant="body2" color="text.secondary">{text}</Typography>
  </Box>
);

const TimelineItem: React.FC<TimelineItemProps> = ({ icon, title, time, isAvatar, avatarInitial, isLast, onClick, isClickable }) => (
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

const ChatBubble: React.FC<ChatBubbleProps> = ({ side, text, time }) => (
  <Box sx={{ alignSelf: side === "left" ? "flex-start" : "flex-end", maxWidth: "70%" }}>
    <Box sx={{ p: 1.5, borderRadius: side === "left" ? "0 12px 12px 12px" : "12px 0 12px 12px", bgcolor: side === "left" ? "#FFF" : "#1E293B", color: side === "left" ? "text.primary" : "#FFF", boxShadow: "0px 1px 2px rgba(0,0,0,0.05)" }}>
      <Typography variant="body2">{text}</Typography>
    </Box>
    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block", textAlign: side === "right" ? "right" : "left" }}>{time}</Typography>
  </Box>
);

const getSubSourceIcon = (source?: string): string | null => {
  const key = (source || "").toLowerCase();
  if (key.includes("facebook")) return Facebook as string;
  if (key.includes("instagram")) return Instagram as string;
  if (key.includes("linkedin")) return Linkedin as string;
  if (key.includes("google ads")) return GoogleAds as string;
  if (key.includes("google")) return GoogleCalender as string;
  return null;
};

const Info: React.FC<InfoProps> = ({ label, value, isAvatar }) => (
  <Box sx={{ flex: 1, minWidth: 0 }}>
    <Typography variant="caption" sx={{ color: "#9E9E9E", fontSize: "12px", fontWeight: 500, display: "block", mb: 0.5 }}>
      {label}
    </Typography>
    {label === "SUB-SOURCE" ? (
      <Stack direction="row" spacing={1} alignItems="center">
        {getSubSourceIcon(value) && (
          <Box component="img" src={getSubSourceIcon(value)!} alt="" sx={{ width: 16, height: 16 }} />
        )}
        <Typography sx={{ color: "#232323", fontSize: "14px", fontWeight: 500 }}>{value}</Typography>
      </Stack>
    ) : isAvatar ? (
      <Stack direction="row" spacing={1} alignItems="center">
        <Avatar sx={{ width: 20, height: 20, fontSize: "10px" }}>{value?.charAt(0) || "U"}</Avatar>
        <Typography sx={{ color: "#232323", fontSize: "14px", fontWeight: 500 }}>{value}</Typography>
      </Stack>
    ) : (
      <Typography sx={{ color: "#232323", fontSize: "14px", fontWeight: 500 }}>{value}</Typography>
    )}
  </Box>
);

// ── Updated DocumentRow — supports real URLs with download & open ──
const DocumentRow: React.FC<DocumentRowProps> = ({ name, size, url, sx = {} }) => {
  const color = getDocColor(name);
  const ext = (name.split(".").pop() ?? "").toUpperCase();

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={sx}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "8px",
            bgcolor: `${color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <DescriptionOutlinedIcon sx={{ color, fontSize: 18 }} />
        </Box>
        <Box>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              maxWidth: 160,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={name}
          >
            {name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {ext}{size ? ` · ${size}` : ""}
          </Typography>
        </Box>
      </Stack>
      <Stack direction="row" spacing={0.5}>
        <IconButton size="small" onClick={handleDownload} disabled={!url} title="Download">
          <FileDownloadOutlinedIcon fontSize="inherit" />
        </IconButton>
        <IconButton size="small" onClick={handleOpen} disabled={!url} title="Open in new tab">
          <ShortcutIcon sx={{ transform: "rotate(90deg)", fontSize: "14px" }} />
        </IconButton>
      </Stack>
    </Stack>
  );
};