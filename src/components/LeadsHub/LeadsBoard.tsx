import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Radio,
  RadioGroup,
  Fade,
  CircularProgress,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PhoneEnabledIcon from "@mui/icons-material/PhoneEnabled";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import TextFormatIcon from '@mui/icons-material/TextFormat';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import HistoryIcon from '@mui/icons-material/History';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

// Mail Icons
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";

import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

/**
 * ✅ INTEGRATION: Importing MenuButton, CallButton, and Dialogs from LeadsMenuDialogs
 * - MenuButton: Edit, Reassign, Archive, Delete (syncs with LeadsTable via localStorage)
 * - CallButton: Opens call dialog
 * - Dialogs: Renders the CallDialog component
 */
import { MenuButton, CallButton, Dialogs } from "./LeadsMenuDialogs";

// ✅ INTEGRATION: Import Redux actions and selectors
import {
  fetchLeads,
  selectLeads,
  selectLeadsLoading,
  selectLeadsError,
} from "../../store/leadSlice";

import type { Lead } from "../../types/leads.types";

interface Props {
  search: string;
}

const LeadsBoard: React.FC<Props> = ({ search }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  // ✅ INTEGRATION: Using Redux state instead of mock data
  const reduxLeads = useSelector(selectLeads);
  const loading = useSelector(selectLeadsLoading);
  const error = useSelector(selectLeadsError);

  // ✅ INTEGRATION: Local state for managing leads
  const [leads, setLeads] = React.useState<Lead[]>([]);

  // ✅ INTEGRATION: Fetch leads on mount
  React.useEffect(() => {
    dispatch(fetchLeads() as any);
  }, [dispatch]);

  // ✅ INTEGRATION: Sync Redux leads to local state
  React.useEffect(() => {
    if (reduxLeads && reduxLeads.length > 0) {
      const leadsWithArchived = reduxLeads.map((lead) => ({
        ...lead,
        archived: lead.archived ?? false,
      }));
      setLeads(leadsWithArchived);
      
      // 🔍 Debug: Log lead statuses
      console.log("📊 Total leads:", leadsWithArchived.length);
      console.log("📊 Lead statuses:", leadsWithArchived.map(l => ({ id: l.id, status: l.status, archived: l.archived })));
      
      const statusCounts = leadsWithArchived.reduce((acc, lead) => {
        const status = (lead.status || "No Status").toLowerCase();
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log("📊 Status distribution:", statusCounts);
    }
  }, [reduxLeads]);

  // --- Modal States ---
  const [openBookModal, setOpenBookModal] = React.useState(false);
  const [openMailModal, setOpenMailModal] = React.useState(false);
  const [openSmsModal, setOpenSmsModal] = React.useState(false);
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);

  // --- MAIL FLOW STATES ---
  const [mailStep, setMailStep] = React.useState<1 | 2>(1);
  const [selectedTemplate, setSelectedTemplate] = React.useState("");
  const [showSaveSuccess, setShowSaveSuccess] = React.useState(false);

  // --- SMS STATES ---
  const [smsMessage, setSmsMessage] = React.useState("");

  const templates = [
    { id: '1', title: 'IVF Next Steps Form Request', desc: 'Requests the patient to fill out a form to share medical and contact details.' },
    { id: '2', title: 'IVF Treatment Information', desc: 'Provides an overview of IVF process, timelines, and general treatment details.' },
    { id: '3', title: 'IVF Follow-Up Reminder', desc: 'Gentle reminder for patients who have not responded or taken action.' },
    { id: '4', title: 'New Consultation Confirmation', desc: 'Confirms appointment date, time, and doctor details.' },
    { id: '5', title: 'Welcome Email – Patient Inquiry', desc: 'Introduces the clinic and builds trust after the first inquiry.' },
  ];

  const columns = [
    { label: "NEW LEADS", statusKey: ["New", "no status", ""], color: "#6366F1" }, // ✅ Handle "no status" as New
    { label: "FOLLOW-UPS", statusKey: ["Follow-Ups", "Follow-up"], color: "#F59E0B" },
    { label: "APPOINTMENT", statusKey: ["Appointment"], color: "#10B981" },
    { label: "CONVERTED LEADS", statusKey: ["Converted"], color: "#8B5CF6" },
    { label: "CYCLE CONVERSION", statusKey: ["Cycle Conversion"], color: "#EC4899" },
    { label: "LOST LEADS", statusKey: ["Lost"], color: "#64748B" },
  ];

  // ✅ INTEGRATION: Filter from Redux state (not mock) and exclude archived
  const filteredLeads = leads.filter((l) => {
    const matchSearch = `${l.full_name || l.name} ${l.id}`.toLowerCase().includes(search.toLowerCase());
    const isActive = !l.archived; // Don't show archived leads on board
    return matchSearch && isActive;
  });

  // Handlers
  const handleOpenBookModal = (lead: Lead) => {
    setSelectedLead(lead);
    setOpenBookModal(true);
  };

  const handleOpenMail = (lead: Lead) => {
    setSelectedLead(lead);
    setMailStep(1); 
    setOpenMailModal(true);
  };

  const handleOpenSms = (lead: Lead) => {
    setSelectedLead(lead);
    setSmsMessage("");
    setOpenSmsModal(true);
  };

  const handleNextToCompose = () => {
    setMailStep(2);
  };

  const handleSaveAsTemplate = () => {
    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
      handleCloseAll();
    }, 2500);
  };

  const handleSendSms = () => {
    // SMS send logic here
    console.log("Sending SMS to:", selectedLead?.full_name || selectedLead?.name, "Message:", smsMessage);
    handleCloseAll();
  };

  const handleCloseAll = () => {
    setOpenBookModal(false);
    setOpenMailModal(false);
    setOpenSmsModal(false);
    setSelectedLead(null);
    setMailStep(1);
    setSelectedTemplate("");
    setSmsMessage("");
  };

  const modalFieldStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
      "& fieldset": { borderColor: "#E2E8F0", borderWidth: "1px" },
      "&:hover fieldset": { borderColor: "#CBD5E1" },
      "&.Mui-focused fieldset": { borderColor: "#6366F1", borderWidth: "1px" },
    },
    "& .MuiInputBase-input": { fontSize: "0.85rem", py: 1 },
  };

  const labelStyle = {
    fontWeight: 600,
    sx: { mb: 0.5, display: "block", color: "#475569", fontSize: '0.75rem' },
  };

  const renderCardContent = (lead: Lead, columnLabel: string, isHovered: boolean) => {
    const iconBtnStyle = { 
      border: "1px solid #E2E8F0", 
      p: 0.5, 
      borderRadius: "8px", 
      color: "#64748B",
      "&:hover": { bgcolor: "#F8FAFC", color: "#6366F1" }
    };

    const showButton = (columnLabel === "NEW LEADS" || columnLabel === "FOLLOW-UPS") && isHovered;

    if (!isHovered) {
      return (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Typography variant="caption" fontWeight={600} sx={{ color: '#64748B', fontSize: '0.7rem' }}>
            Score: <Box component="span" sx={{ color: '#1E293B' }}>{lead.score || 0}%</Box>
          </Typography>
        </Box>
      );
    }

    // Format date and time from created_at
    const formattedDate = lead.created_at 
      ? new Date(lead.created_at).toLocaleDateString("en-GB")
      : "Not specified";
    const formattedTime = lead.created_at
      ? new Date(lead.created_at).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    return (
      <Box sx={{ width: '100%', mt: 1.5 }}>
        <Stack spacing={1} sx={{ mb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <LocationOnIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {lead.location || "Not specified"}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarMonthIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {`${formattedDate}${formattedTime ? `, ${formattedTime}` : ''}`}
            </Typography>
          </Stack>
        </Stack>
        
        <Divider sx={{ my: 1.5, borderStyle: "dashed" }} />
        
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem", display: "block", fontWeight: 700 }}>
              ASSIGNED TO
            </Typography>
            <Typography variant="caption" fontWeight={600} color="#1E293B" sx={{ fontSize: '0.75rem' }}>
              {lead.assigned || "Unassigned"}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem", display: "block", fontWeight: 700 }}>
              LEAD SOURCE
            </Typography>
            <Typography variant="caption" fontWeight={600} color="#1E293B" sx={{ fontSize: '0.75rem' }}>
              {lead.source || "Unknown"}
            </Typography>
          </Box>
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem", display: "block", fontWeight: 700, mb: 1 }}>
          CONTACT OPTION
        </Typography>
        <Stack direction="row" spacing={1.5} sx={{ mb: showButton ? 2 : 0 }}>
          {/* ✅ INTEGRATION: Using CallButton from LeadsMenuDialogs */}
          <Box sx={iconBtnStyle} onClick={(e) => e.stopPropagation()}>
            <CallButton lead={lead} />
          </Box>
          <IconButton size="small" sx={iconBtnStyle} onClick={(e) => { e.stopPropagation(); handleOpenSms(lead); }}>
            <ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton size="small" sx={iconBtnStyle} onClick={(e) => { e.stopPropagation(); handleOpenMail(lead); }}>
            <MailOutlineIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>

        {showButton && (
          <Button 
            fullWidth 
            variant="contained" 
            size="small" 
            onClick={(e) => { e.stopPropagation(); handleOpenBookModal(lead); }}
            sx={{ 
              bgcolor: "#334155", 
              textTransform: "none", 
              borderRadius: "8px", 
              fontWeight: 600, 
              py: 1.2,
              mt: 1,
              "&:hover": { bgcolor: "#1e293b" } 
            }}
          >
            Book an Appointment
          </Button>
        )}
      </Box>
    );
  };

  // ====================== Loading State ======================
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">Loading leads...</Typography>
        </Stack>
      </Box>
    );
  }

  // ====================== Error State ======================
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <Typography fontWeight={600}>Failed to load leads</Typography>
        <Typography variant="body2">{error}</Typography>
        <Typography
          variant="body2"
          sx={{
            mt: 1,
            color: "primary.main",
            cursor: "pointer",
            textDecoration: "underline",
          }}
          onClick={() => dispatch(fetchLeads() as any)}
        >
          Try again
        </Typography>
      </Alert>
    );
  }

  // ====================== Empty State ======================
  if (leads.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <Typography variant="h6" color="text.secondary">
            No leads found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your first lead to get started
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: "flex", 
      overflowX: "auto", 
      gap: 3, 
      p: 4, 
      bgcolor: "#F8FAFC", 
      height: "calc(100vh - 64px)",
      alignItems: "flex-start",
      "&::-webkit-scrollbar": { height: '10px' },
      "&::-webkit-scrollbar-thumb": { backgroundColor: '#CBD5E1', borderRadius: '10px' }
    }}>
      {columns.map((col) => {
        // ✅ Case-insensitive status matching with null/undefined handling
        const leadsInCol = filteredLeads.filter((l) => {
          const leadStatus = (l.status || "no status").toLowerCase().trim();
          return col.statusKey.some((key) => 
            leadStatus === (key || "no status").toLowerCase().trim()
          );
        });
        return (
          <Box 
            key={col.label} 
            sx={{ 
              minWidth: 350, 
              maxWidth: 350, 
              bgcolor: "#F1F5F9", 
              borderRadius: "20px",
              display: "flex",
              flexDirection: "column",
              maxHeight: "100%",
              p: 2,
              border: "1px solid #E2E8F0",
              flexShrink: 0
            }}
          >
            <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#64748B", mb: 2.5, px: 1, display: "flex", alignItems: 'center', gap: 1, letterSpacing: 0.5 }}>
              {col.label} <Box component="span" sx={{ color: '#94A3B8', fontWeight: 500 }}>({leadsInCol.length.toString().padStart(2, "0")})</Box>
            </Typography>
            
            <Stack 
              spacing={2} 
              sx={{ 
                overflowY: "auto", 
                px: 0.5,
                pb: 1,
                "&::-webkit-scrollbar": { display: "none" },
                scrollbarWidth: "none",
                msOverflowStyle: "none"
              }}
            >
              {leadsInCol.map((lead) => (
                <Paper
                  key={lead.id}
                  onMouseEnter={() => setHoveredId(lead.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => navigate(`/leads/${lead.id.replace("#", "")}`)}
                  elevation={0}
                  sx={{ 
                    p: 2.5, 
                    borderRadius: "16px", 
                    border: "1px solid #EAECF0",
                    transition: "all 0.3s ease", 
                    width: '100%',
                    backgroundColor: "#FFFFFF",
                    cursor: "pointer",
                    ...(hoveredId === lead.id && {
                      boxShadow: "0px 12px 24px -4px rgba(145, 158, 171, 0.16)",
                      borderColor: col.color,
                      transform: "translateY(-2px)",
                      zIndex: 10
                    })
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ width: 36, height: 36, fontSize: "0.8rem", bgcolor: '#EEF2FF', color: '#6366F1', fontWeight: 700 }}>
                        {lead.initials || (lead.full_name || lead.name)?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.9rem', color: '#1E293B' }}>
                          {lead.full_name || lead.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          {lead.id}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Chip 
                        label={lead.quality || "N/A"} 
                        size="small" 
                        sx={{ 
                          height: 20, fontSize: "0.65rem", fontWeight: 700,
                          bgcolor: lead.quality === "Hot" ? "#FEE2E2" : lead.quality === "Warm" ? "#FEF3C7" : "#F1F5F9",
                          color: lead.quality === "Hot" ? "#B91C1C" : lead.quality === "Warm" ? "#B45309" : "#475569"
                        }} 
                      />
                      {/* ✅ INTEGRATION: MenuButton syncs with LeadsTable */}
                      <Box onClick={(e) => e.stopPropagation()}>
                        <MenuButton lead={lead} setLeads={setLeads} tab="active" />
                      </Box>
                    </Stack>
                  </Stack>
                  {renderCardContent(lead, col.label, hoveredId === lead.id)}
                </Paper>
              ))}
            </Stack>
          </Box>
        );
      })}

      {/* ✅ INTEGRATION: Dialogs component renders CallDialog */}
      <Dialogs />

      {/* --- SUCCESS TOAST --- */}
      <Fade in={showSaveSuccess}>
        <Box sx={{ 
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)', 
          bgcolor: '#10B981', color: 'white', px: 3, py: 1.5, borderRadius: '12px',
          display: 'flex', alignItems: 'center', gap: 1.5, zIndex: 10000,
          boxShadow: '0px 10px 20px rgba(16, 185, 129, 0.2)'
        }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 20 }} />
          <Typography variant="body2" fontWeight={600}>Saved as A Template successfully!</Typography>
        </Box>
      </Fade>

      {/* --- SMS MODAL --- */}
      <Dialog 
        open={openSmsModal} 
        onClose={handleCloseAll} 
        fullWidth 
        maxWidth="sm" 
        PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
          <Typography variant="h6" fontWeight={800} color="#1E293B">Send SMS</Typography>
          <IconButton onClick={handleCloseAll} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight={600} color="#475569" sx={{ mb: 1 }}>To:</Typography>
            <Chip 
              label={selectedLead?.full_name || selectedLead?.name} 
              size="small" 
              sx={{ 
                bgcolor: '#EEF2FF', 
                color: '#6366F1', 
                fontWeight: 600, 
                borderRadius: '8px',
                height: 32,
                fontSize: '0.875rem'
              }} 
            />
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={600} color="#475569" sx={{ mb: 1 }}>Message:</Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              placeholder="Type your message here..."
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              sx={{
                ...modalFieldStyle,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  "& fieldset": { borderColor: "#E2E8F0", borderWidth: "1px" },
                  "&:hover fieldset": { borderColor: "#CBD5E1" },
                  "&.Mui-focused fieldset": { borderColor: "#6366F1", borderWidth: "2px" },
                },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'right' }}>
              {smsMessage.length} / 160 characters
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #F1F5F9', gap: 2 }}>
          <Button 
            onClick={handleCloseAll} 
            sx={{ 
              flex: 1,
              color: '#64748B', 
              textTransform: 'none', 
              fontWeight: 700,
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              py: 1.2
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSendSms}
            disabled={!smsMessage.trim()}
            endIcon={<SendIcon sx={{ fontSize: 16 }} />}
            sx={{ 
              flex: 1,
              bgcolor: '#334155', 
              borderRadius: '12px', 
              textTransform: 'none', 
              fontWeight: 700,
              py: 1.2,
              "&:hover": { bgcolor: "#1e293b" },
              "&:disabled": { bgcolor: "#CBD5E1" }
            }}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- MAIL MODAL FLOW --- */}
      <Dialog 
        open={openMailModal} 
        onClose={handleCloseAll} 
        fullWidth 
        maxWidth={mailStep === 1 ? "sm" : "md"} 
        PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden' } }}
      >
        {mailStep === 1 ? (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
              <Typography variant="h6" fontWeight={800} color="#1E293B">New Email</Typography>
              <IconButton onClick={handleCloseAll} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              <Box 
                onClick={handleNextToCompose}
                sx={{ 
                  p: 3, textAlign: 'center', borderBottom: '1px solid #F1F5F9', cursor: 'pointer', 
                  transition: '0.2s', '&:hover': { bgcolor: '#F8FAFC' } 
                }}
              >
                 <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                    <BorderColorIcon sx={{ fontSize: 20, color: '#64748B' }} />
                    <Typography fontWeight={600} color="#64748B">Compose New Email</Typography>
                 </Stack>
              </Box>
              <Box sx={{ p: 3 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 2 }}>SELECT EMAIL TEMPLATE</Typography>
                <RadioGroup value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
                  {templates.map((tmp) => (
                    <Box 
                      key={tmp.id} 
                      onClick={() => setSelectedTemplate(tmp.title)}
                      sx={{ 
                        display: 'flex', alignItems: 'flex-start', p: 2, mb: 1.5, 
                        border: '1px solid', borderColor: selectedTemplate === tmp.title ? '#6366F1' : '#E2E8F0', 
                        borderRadius: '12px', cursor: 'pointer', bgcolor: selectedTemplate === tmp.title ? '#F5F7FF' : 'transparent'
                      }}
                    >
                      <Radio size="small" value={tmp.title} sx={{ mt: -0.5 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={700} color="#1E293B">{tmp.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{tmp.desc}</Typography>
                      </Box>
                      <IconButton size="small"><VisibilityOutlinedIcon sx={{ fontSize: 18, color: '#94A3B8' }} /></IconButton>
                    </Box>
                  ))}
                </RadioGroup>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: '1px solid #F1F5F9' }}>
              <Button onClick={handleCloseAll} sx={{ color: '#64748B', textTransform: 'none', fontWeight: 700 }}>Cancel</Button>
              <Button variant="contained" onClick={handleNextToCompose} sx={{ bgcolor: '#334155', borderRadius: '10px', px: 4, textTransform: 'none', fontWeight: 700, "&:hover": { bgcolor: "#1e293b" } }}>Next</Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2.5 }}>
              <Typography variant="h6" fontWeight={800} color="#1E293B">New Email</Typography>
              <IconButton onClick={handleCloseAll} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ px: 3, py: 0 }}>
              <Stack spacing={0.5}>
                <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #F1F5F9', py: 1.5 }}>
                  <Typography variant="body2" sx={{ width: 40, color: '#94A3B8', fontWeight: 500 }}>To :</Typography>
                  <Chip label={selectedLead?.full_name || selectedLead?.name} size="small" onDelete={() => {}} sx={{ bgcolor: '#EEF2FF', color: '#6366F1', fontWeight: 600, borderRadius: '6px' }} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #F1F5F9', py: 1.5 }}>
                  <Typography variant="body2" sx={{ width: 70, color: '#94A3B8', fontWeight: 500 }}>Subject :</Typography>
                  <TextField fullWidth variant="standard" defaultValue="Thank You for Your IVF Inquiry - Next Steps" InputProps={{ disableUnderline: true, sx: { fontSize: '0.85rem', fontWeight: 600 } }} />
                </Box>
                <Box sx={{ py: 3, minHeight: 320, overflowY: 'auto' }}>
                  <Typography variant="body2" sx={{ mb: 2 }}>Hi {selectedLead?.full_name || selectedLead?.name},</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>Thank you for reaching out to <strong>Crysta IVF, Bangalore</strong>. We are honored to be part of your journey toward parenthood.</Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>To ensure we provide the most accurate guidance tailored to your medical history, please complete our secure intake form:</Typography>
                  <Typography variant="body2" sx={{ color: '#6366F1', textDecoration: 'underline', mb: 2, display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}>
                     👉 Fill the IVF Inquiry Form <br/>
                     https://example.com/ivf-inquiry-form
                  </Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ mt: 2, color: '#1E293B' }}>What happens next? After you submit the form, our specialist team will:</Typography>
                  <ul style={{ paddingLeft: '20px', fontSize: '0.85rem', color: '#475569', lineHeight: 1.8 }}>
                    <li><strong>Review:</strong> A senior consultant will evaluate your requirements.</li>
                    <li><strong>Connect:</strong> We will schedule a 15-minute discovery call.</li>
                  </ul>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2, justifyContent: 'space-between', bgcolor: '#F8FAFC', borderTop: '1px solid #F1F5F9' }}>
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small"><TextFormatIcon sx={{ fontSize: 20 }} /></IconButton>
                <IconButton size="small"><AttachFileIcon sx={{ fontSize: 20 }} /></IconButton>
                <IconButton size="small"><InsertLinkIcon sx={{ fontSize: 20 }} /></IconButton>
                <IconButton size="small"><InsertEmoticonIcon sx={{ fontSize: 20 }} /></IconButton>
                <IconButton size="small"><InsertPhotoIcon sx={{ fontSize: 20 }} /></IconButton>
                <IconButton size="small"><HistoryIcon sx={{ fontSize: 20 }} /></IconButton>
                <IconButton size="small"><AddCircleOutlineIcon sx={{ fontSize: 20 }} /></IconButton>
              </Stack>
              <Stack direction="row" spacing={1.5}>
                <Button onClick={() => setMailStep(1)} sx={{ color: '#64748B', textTransform: 'none', fontWeight: 700 }}>Cancel</Button>
                <Button variant="outlined" onClick={handleSaveAsTemplate} sx={{ borderColor: '#E2E8F0', color: '#1E293B', textTransform: 'none', borderRadius: '10px', fontWeight: 700 }}>Save as Template</Button>
                <Button variant="contained" onClick={handleCloseAll} endIcon={<SendIcon sx={{ fontSize: 16 }} />} sx={{ bgcolor: '#334155', borderRadius: '10px', px: 3, textTransform: 'none', fontWeight: 700, "&:hover": { bgcolor: "#1e293b" } }}>Send</Button>
              </Stack>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* --- BOOK APPOINTMENT MODAL --- */}
      <Dialog 
        open={openBookModal} 
        onClose={handleCloseAll}
        fullWidth
        maxWidth="xs"
        PaperProps={{ 
          sx: { borderRadius: '20px', p: 1, boxShadow: '0px 24px 48px rgba(0,0,0,0.12)' } 
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.1rem', color: '#1E293B' }}>
            Book an Appointment
          </Typography>
          <IconButton onClick={handleCloseAll} size="small" sx={{ color: '#94A3B8' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pb: 1 }}>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, display: 'block', letterSpacing: 0.5 }}>
            APPOINTMENT DETAILS FOR {(selectedLead?.full_name || selectedLead?.name)?.toUpperCase()}
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography {...labelStyle}>Department *</Typography>
              <TextField select fullWidth size="small" defaultValue="Consultation" sx={modalFieldStyle}>
                <option value="Consultation">Consultation</option>
              </TextField>
            </Box>
            <Box>
              <Typography {...labelStyle}>Personnel *</Typography>
              <TextField select fullWidth size="small" defaultValue="Dr. Alex Carey" sx={modalFieldStyle}>
                <option value="Dr. Alex Carey">Dr. Alex Carey</option>
              </TextField>
            </Box>
            <Box>
              <Typography {...labelStyle}>Date *</Typography>
              <TextField type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} sx={modalFieldStyle} />
            </Box>
            <Box>
              <Typography {...labelStyle}>Select Slot *</Typography>
              <TextField select fullWidth size="small" defaultValue="12:30" sx={modalFieldStyle}>
                <option value="12:30">12:30 PM - 01:00 PM</option>
              </TextField>
            </Box>
          </Box>

          <Box sx={{ mt: 1.5 }}>
            <Typography {...labelStyle}>Remark</Typography>
            <TextField 
              fullWidth 
              multiline 
              rows={1.5} 
              placeholder="Type Here..." 
              size="small" 
              sx={modalFieldStyle} 
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1, justifyContent: 'center', gap: 2 }}>
          <Button 
            onClick={handleCloseAll} 
            variant="outlined" 
            sx={{ flex: 1, textTransform: 'none', borderRadius: '12px', color: '#64748B', borderColor: '#E2E8F0', fontWeight: 700, py: 1.2 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCloseAll}
            sx={{ flex: 1, textTransform: 'none', borderRadius: '12px', bgcolor: '#334155', fontWeight: 700, py: 1.2, "&:hover": { bgcolor: "#1e293b" } }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeadsBoard;