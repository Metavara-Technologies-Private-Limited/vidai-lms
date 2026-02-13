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
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import SendIcon from "@mui/icons-material/Send";
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import type { RootState } from "../../store";

// Import BOTH CallButton AND Dialogs from LeadsMenuDialogs
import { CallButton, Dialogs } from "./LeadsMenuDialogs";

// ✅ INTEGRATION: Import Redux actions and selectors
import {
  fetchLeads,
  selectLeads,
  selectLeadsLoading,
  selectLeadsError,
} from "../../store/leadSlice";
import type { Lead } from "../../types/leads.types";

export default function LeadDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
const selectedTemplate = useSelector(
  (state: RootState) => state.emailTemplate.selectedTemplate
);

  // ✅ INTEGRATION: Using Redux state
  const leads = useSelector(selectLeads);
  const loading = useSelector(selectLeadsLoading);
  const error = useSelector(selectLeadsError);

  const [activeTab, setActiveTab] = React.useState("Patient Info");
  const [openConvertPopup, setOpenConvertPopup] = React.useState(false);
  const [historyView, setHistoryView] = React.useState<"chatbot" | "call" | "email">("chatbot");

  // ✅ INTEGRATION: Fetch leads on mount
  React.useEffect(() => {
    if (!leads || leads.length === 0) {
      dispatch(fetchLeads() as any);
    }
  }, [dispatch, leads]);

  // ✅ INTEGRATION: Find lead from Redux state
  const lead = React.useMemo(() => {
    if (!leads || leads.length === 0) return null;
    
    const cleanId = decodeURIComponent(id || "")
      .replace("#", "")
      .replace("LN-", "")
      .replace("LD-", "");
    
    return leads.find((l) => {
      const leadCleanId = l.id.replace("#", "").replace("LN-", "").replace("LD-", "");
      return leadCleanId === cleanId;
    });
  }, [leads, id]);

  const handleOpenPopup = () => setOpenConvertPopup(true);
  const handleClosePopup = () => setOpenConvertPopup(false);

  // Helper function to clean lead ID for URL
  const getCleanLeadId = (leadId: string) => {
    return leadId.replace("#", "").replace("LN-", "").replace("LD-", "");
  };

  const handleEdit = () => {
    if (!lead) return;
    navigate(`/leads/edit/${getCleanLeadId(lead.id)}`, {
      state: { lead },
    });
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
          <Typography color="text.secondary">Loading lead details...</Typography>
        </Stack>
      </Box>
    );
  }

  // ====================== Error State ======================
  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          <Typography fontWeight={600}>Failed to load lead</Typography>
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
      </Box>
    );
  }

  // ====================== Lead Not Found ======================
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
            sx={{
              mt: 1,
              color: "primary.main",
              cursor: "pointer",
              textDecoration: "underline",
            }}
            onClick={() => navigate("/leads")}
          >
            Go back to Leads Hub
          </Typography>
        </Alert>
      </Box>
    );
  }

  // ✅ Extract lead data with fallbacks
  const leadName = lead.full_name || lead.name || "Unknown";
  const leadInitials = lead.initials || leadName.charAt(0).toUpperCase();
  const leadPhone = lead.phone || lead.contact_number || "(555) 555-0128";
  const leadEmail = lead.email || "johnson@gmail.com";
  const leadStatus = lead.status || "New";
  const leadQuality = lead.quality || "N/A";
  const leadScore = String(lead.score || 0).includes("%") ? lead.score : `${lead.score || 0}%`;
  const leadCreatedAt = lead.created_at 
    ? new Date(lead.created_at).toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  return (
    <Box p={3} bgcolor="#F8FAFC" minHeight="100vh">
      {/* 1. BREADCRUMBS */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" onClick={() => navigate("/leads")} sx={{ cursor: 'pointer', fontSize: '12px' }}>
          VIDAI Leads
        </Link>
        <Link underline="hover" color="inherit" onClick={() => navigate("/leads")} sx={{ cursor: 'pointer', fontSize: '12px' }}>
          Leads Hub
        </Link>
        <Typography color="text.primary" sx={{ fontSize: '12px', fontWeight: 600 }}>{leadName}</Typography>
      </Breadcrumbs>

      {/* 2. TOP SUMMARY CARD */}
      <Card sx={{ p: 2.5, mb: 3, borderRadius: "16px", boxShadow: "0px 1px 3px rgba(0,0,0,0.05)" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={3} alignItems="center">
            <Avatar sx={{ bgcolor: "#EEF2FF", color: "#6366F1", width: 56, height: 56, fontSize: '20px', fontWeight: 700 }}>
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
                <Box sx={{ width: 16, height: 16, bgcolor: '#FFB800', borderRadius: '50%' }} />
                <Typography fontWeight={600} variant="body1">{lead.source || "Unknown"}</Typography>
              </Stack>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">Lead Status</Typography>
              <Chip label={leadStatus} size="small" sx={{ bgcolor: '#EFF6FF', color: '#3B82F6', fontWeight: 600, borderRadius: '6px' }} />
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">Lead Quality</Typography>
              <Chip 
                label={leadQuality} 
                size="small" 
                sx={{ 
                  bgcolor: leadQuality === "Hot" ? '#FEF2F2' : leadQuality === "Warm" ? '#FEF3C7' : '#F1F5F9',
                  color: leadQuality === "Hot" ? '#EF4444' : leadQuality === "Warm" ? '#F59E0B' : '#64748B',
                  fontWeight: 600, 
                  borderRadius: '6px' 
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

      {/* 3. TABS & ACTION BUTTONS */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" spacing={4}>
          {["Patient Info", "History", "Next Action"].map((tab) => (
            <Box 
              key={tab}
              onClick={() => setActiveTab(tab)}
              sx={{ 
                borderBottom: activeTab === tab ? '2px solid #6366F1' : 'none', 
                pb: 1, 
                cursor: 'pointer' 
              }}
            >
              <Typography 
                fontWeight={600} 
                color={activeTab === tab ? "#6366F1" : "text.secondary"}
              >
                {tab}
              </Typography>
            </Box>
          ))}
        </Stack>

        <Stack direction="row" spacing={2}>
          <Button 
            variant="outlined" 
            startIcon={<EditOutlinedIcon />} 
            onClick={handleEdit}
            sx={{ borderRadius: '8px', textTransform: 'none', color: 'text.primary', borderColor: '#E2E8F0' }}
          >
            Edit
          </Button>
          <Button 
            variant="contained" 
            onClick={handleOpenPopup}
            startIcon={<SwapHorizIcon />} 
            sx={{ borderRadius: '8px', textTransform: 'none', bgcolor: '#1E293B', px: 2 }}
          >
            Convert Lead
          </Button>
        </Stack>
      </Stack>

      {/* CONTENT SECTIONS */}
      {activeTab === "Patient Info" && (
        <Stack direction="row" spacing={3}>
          <Box sx={{ flex: 2 }}>
            <Card sx={{ p: 3, borderRadius: "16px", mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={3}>Basic Information</Typography>
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={2} sx={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
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
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={2} sx={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                Partner Information
              </Typography>
              <Stack direction="row" spacing={6}>
                <Info label="FULL NAME" value={lead.partner_name || "Jennifer Smith"} />
                <Info label="AGE" value={lead.partner_age?.toString() || "29"} />
                <Info label="GENDER" value={lead.partner_gender || "Female"} />
              </Stack>
              <Divider sx={{ my: 4 }} />
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={2} sx={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
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
            <Card sx={{ p: 3, bgcolor: "#F0FDF4", borderRadius: "16px", border: '1px solid #DCFCE7' }}>
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
                <Chip label="Medical Checkup" size="small" sx={{ bgcolor: '#F5F3FF', color: '#7C3AED', fontWeight: 500 }} />
                <Chip label="IVF" size="small" sx={{ bgcolor: '#F5F3FF', color: '#7C3AED', fontWeight: 500 }} />
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

      {/* 4. HISTORY TAB */}
      {activeTab === "History" && (
        <Stack direction="row" spacing={3}>
          <Card sx={{ flex: 1, p: 3, borderRadius: "16px" }}>
            <Typography variant="subtitle1" fontWeight={700} mb={3}>Activity Timeline</Typography>
            <Stack spacing={0}>
              <TimelineItem 
                icon={<ChatBubbleOutlineIcon sx={{ fontSize: 16, color: '#6366F1' }} />} 
                title="Appointment Booked - Confirmation sent (SMS)" 
                time={leadCreatedAt}
              />
              <TimelineItem 
                icon={<CallOutlinedIcon sx={{ fontSize: 16, color: '#10B981' }} />} 
                title="Outgoing call attempted - Connected" 
                time={leadCreatedAt}
                onClick={() => setHistoryView("call")}
                isClickable
              />
              <TimelineItem 
                icon={<EmailOutlinedIcon sx={{ fontSize: 16, color: '#F59E0B' }} />} 
                title="Patient shared contact number and email" 
                time={leadCreatedAt}
                onClick={() => setHistoryView("email")}
                isClickable
              />
              <TimelineItem 
                icon={<EmailOutlinedIcon sx={{ fontSize: 16, color: '#3B82F6' }} />} 
                title="Sent an Welcome Email" 
                time={leadCreatedAt}
                onClick={() => setHistoryView("email")}
                isClickable
              />
              <TimelineItem 
                isAvatar 
                avatarInitial={(lead.assigned || "U").charAt(0)} 
                title={`Assigned to ${lead.assigned || "Unassigned"}`} 
                time={leadCreatedAt}
              />
              <TimelineItem 
                icon={<ChatBubbleOutlineIcon sx={{ fontSize: 16, color: '#8B5CF6' }} />} 
                title="Lead arrived from Website Chatbot" 
                time={leadCreatedAt}
                onClick={() => setHistoryView("chatbot")}
                isClickable
                isLast 
              />
            </Stack>
          </Card>
          
          {/* Right Panel - Dynamic Content Based on historyView */}
          <Card sx={{ flex: 2, borderRadius: "16px", display: 'flex', flexDirection: 'column', maxHeight: '600px' }}>
            {historyView === "chatbot" && (
              <>
                <Box p={2} borderBottom="1px solid #E2E8F0"><Typography variant="subtitle1" fontWeight={700}>Chatbot</Typography></Box>
                <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto', bgcolor: '#F8FAFC' }}>
                  <Stack spacing={3}>
                    <Typography variant="caption" align="center" color="text.secondary" display="block">
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString("en-US", { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase() : "TODAY"}
                    </Typography>
                    <ChatBubble side="left" text="Hello! How can I help you today?" time="9:41 AM" />
                    <ChatBubble side="right" text="I'm looking for a general health check-up" time="9:42 AM" />
                    <ChatBubble side="left" text="Great! I can help you schedule that." time="9:43 AM" />
                    <ChatBubble side="right" text="Sometime this week, preferably in the morning" time="9:44 AM" />
                    <ChatBubble side="right" text={`My name is ${leadName}, and my number is ${leadPhone}`} time="9:46 AM" />
                  </Stack>
                </Box>
                <Box p={2} borderTop="1px solid #E2E8F0">
                  <TextField fullWidth placeholder="Type your message..." size="small" InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton color="primary"><SendIcon sx={{ fontSize: 18 }} /></IconButton></InputAdornment>) }} />
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
                <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto', bgcolor: '#F8FAFC' }}>
                  <Stack spacing={3}>
                    <Typography variant="caption" align="center" color="text.secondary" display="block">
                      CALL - {lead.created_at ? new Date(lead.created_at).toLocaleDateString("en-US", { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase() : "TODAY"}
                    </Typography>
                    <CallMessage speaker="Mike" time="0:03" text="Good morning! You've reached Bloom Fertility Center. This is Mike. How can I help you today?" />
                    <CallMessage speaker={leadName.split(' ')[0]} time="0:15" text="Hi Mike, I'm calling to get some information about IVF. My wife and I are considering starting treatment." />
                    <CallMessage speaker="Mike" time="0:25" text="Of course. I'd be happy to guide you. May I know your wife's age and how long you both have been trying to conceive?" />
                    <CallMessage speaker={leadName.split(' ')[0]} time="0:32" text="She's 32, and we've been trying for about four years now." />
                    <CallMessage speaker="Mike" time="0:35" text="Thank you. Have you undergone any treatments earlier, like IUI or IVF?" />
                    <CallMessage speaker={leadName.split(' ')[0]} time="0:39" text="We tried two IVIs this year, but they weren't successful. No IVF yet." />
                    <CallMessage speaker="Mike" time="0:46" text="Thank you. Have AMH or ultrasound tests been done for your wife?" />
                    <CallMessage speaker={leadName.split(' ')[0]} time="1:03" text="Yes, that would be great. Preferably sometime this week in the morning." />
                  </Stack>
                </Box>
              </>
            )}
            
            {historyView === "email" && (
              <>
                <Box p={2} borderBottom="1px solid #E2E8F0">
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" fontWeight={700}>Email History</Typography>
                    <IconButton 
                      onClick={() => window.location.href = `mailto:${leadEmail}`}
                      sx={{ 
                        bgcolor: '#EFF6FF',
                        '&:hover': { bgcolor: '#DBEAFE' }
                      }}
                    >
                      <EmailOutlinedIcon sx={{ color: '#3B82F6' }} />
                    </IconButton>
                  </Stack>
                </Box>


                <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto', bgcolor: '#F8FAFC' }}>
                  <Stack spacing={3}>
                    {/* Email from Lead */}
                    <Card sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                      <Stack direction="row" justifyContent="space-between" mb={2}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ width: 40, height: 40, bgcolor: '#EEF2FF', color: '#6366F1' }}>{leadInitials}</Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>{leadName}</Typography>
                            <Typography variant="caption" color="text.secondary">{leadEmail}</Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            {lead.created_at ? new Date(lead.created_at).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : "Today"}
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
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        Looking forward to your response.
                      </Typography>
                      <Typography variant="body2" color="text.secondary">Regards,</Typography>
                      <Typography variant="body2" color="text.secondary">{leadName}</Typography>
                      <Typography variant="body2" color="text.secondary">{leadPhone}</Typography>
                    </Card>
                    
                    {/* Email from Crysta Clinic */}
{selectedTemplate && (
  <Card sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #E2E8F0' }}>
    <Stack direction="row" justifyContent="space-between" mb={2}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Avatar sx={{ width: 40, height: 40, bgcolor: '#FEF2F2', color: '#EF4444' }}>
          CC
        </Avatar>
        <Box>
          <Typography variant="body2" fontWeight={700}>
            Crysta Clinic
          </Typography>
          <Typography variant="caption" color="text.secondary">
            team@crystaivf.com
          </Typography>
        </Box>
      </Stack>
    </Stack>

    <Typography variant="body2" fontWeight={700} mb={1}>
      {selectedTemplate.subject}
    </Typography>

    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ whiteSpace: "pre-line" }}
    >
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

      {/* 5. NEXT ACTION TAB */}
      {activeTab === "Next Action" && (
        <Stack direction="row" spacing={3}>
          <Box sx={{ flex: 1 }}>
            <Card sx={{ p: 2.5, borderRadius: "16px", mb: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight={700}>Next Action</Typography>
                <IconButton size="small"><AddCircleOutlineIcon fontSize="small" /></IconButton>
              </Stack>
              <Box sx={{ p: 2, bgcolor: '#EEF2FF', borderRadius: '12px', mb: 3, border: '1px solid #E0E7FF' }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <AutoFixHighIcon sx={{ color: '#6366F1', fontSize: 18 }} />
                  <Typography variant="caption" fontWeight={700} color="#6366F1">AI Suggestion</Typography>
                </Stack>
                <Typography variant="body2" fontWeight={600} mb={0.5}>Book Appointment | <Typography component="span" variant="caption" color="text.secondary" fontWeight={400}>Confirm interest via WhatsApp</Typography></Typography>
                <Typography variant="caption" color="#6366F1" sx={{ cursor: 'pointer', fontWeight: 600 }}>Apply suggestion</Typography>
              </Box>
              <Card variant="outlined" sx={{ p: 2, borderRadius: '12px', mb: 3 }}>
                <Stack direction="row" spacing={2}>
                   <Box sx={{ p: 1, bgcolor: '#EFF6FF', borderRadius: '8px', height: 'fit-content' }}><CallOutlinedIcon sx={{ color: '#3B82F6' }} /></Box>
                   <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight={700}>Call</Typography>
                      <Typography variant="body2" mb={2}>Call patient to confirm preferred consultation time.</Typography>
                      <Stack direction="row" spacing={1}>
                        <Button variant="outlined" size="small" sx={{ textTransform: 'none', borderRadius: '6px', borderColor: '#E2E8F0' }}>Mark Done</Button>
                        <CallButton lead={lead} />
                      </Stack>
                   </Box>
                </Stack>
              </Card>
            </Card>
          </Box>
          <Box sx={{ flex: 2 }}>
            <Card sx={{ p: 2.5, borderRadius: "16px", minHeight: '500px' }}>
              <Typography variant="subtitle1" fontWeight={700} mb={3}>Notes</Typography>
              <NoteItem title="Lead Inquired" content="Lead inquired via chatbot for general fertility check-up." time={leadCreatedAt} />
            </Card>
          </Box>
        </Stack>
      )}

      {/* CONVERT POPUP */}
      <Dialog 
        open={openConvertPopup} 
        onClose={handleClosePopup}
        PaperProps={{ 
          sx: { 
            borderRadius: '24px', 
            p: 4, 
            textAlign: 'center',
            maxWidth: '420px',
            boxShadow: '0px 20px 25px -5px rgba(0,0,0,0.1)'
          } 
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Stack alignItems="center" spacing={2.5}>
            <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SwapHorizIcon sx={{ fontSize: 32, color: '#F97316' }} />
            </Box>
            <Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>Convert Lead</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ px: 2, lineHeight: 1.6 }}>
                    Are you sure you want to Convert <b>"{leadName}"</b> lead into a patient & register it?
                </Typography>
            </Box>
            <Stack direction="row" spacing={2} sx={{ width: '100%', mt: 2 }}>
              <Button fullWidth onClick={handleClosePopup} variant="outlined" sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, color: '#475569', borderColor: '#E2E8F0', py: 1.2 }}>
                Cancel
              </Button>
              <Button fullWidth variant="contained" onClick={handleClosePopup} sx={{ bgcolor: '#475569', borderRadius: '12px', textTransform: 'none', fontWeight: 600, py: 1.2, boxShadow: 'none', '&:hover': { bgcolor: '#334155' } }}>
                Convert
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* CRITICAL: Add Dialogs component at the end for CallButton to work */}
      <Dialogs />
    </Box>
  );
}

// Sub-components
const CallMessage = ({ speaker, time, text }: any) => (
  <Box>
    <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
      <Typography variant="caption" fontWeight={700} color="text.primary">{speaker}</Typography>
      <Typography variant="caption" color="text.secondary">{time}</Typography>
    </Stack>
    <Typography variant="body2" color="text.secondary">{text}</Typography>
  </Box>
);

const NoteItem = ({ title, content, time }: any) => (
  <Box sx={{ p: 2, border: '1px solid #F1F5F9', borderRadius: '12px', mb: 2 }}>
    <Typography variant="body2" fontWeight={700} mb={0.5}>{title}</Typography>
    <Typography variant="body2" color="text.secondary" mb={1}>{content}</Typography>
    <Typography variant="caption" color="text.secondary">{time}</Typography>
  </Box>
);

const TimelineItem = ({ icon, title, time, isAvatar, avatarInitial, isLast, onClick, isClickable }: any) => (
  <Stack direction="row" spacing={2}>
    <Stack alignItems="center">
      <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isAvatar ? <Avatar sx={{ width: 20, height: 20, fontSize: '10px' }}>{avatarInitial}</Avatar> : icon}
      </Box>
      {!isLast && <Box sx={{ width: '2px', flexGrow: 1, bgcolor: '#E2E8F0', my: 0.5 }} />}
    </Stack>
    <Box 
      pb={3} 
      onClick={onClick}
      sx={{ 
        cursor: isClickable ? 'pointer' : 'default',
        '&:hover': isClickable ? { opacity: 0.7 } : {}
      }}
    >
      <Typography variant="body2" fontWeight={600}>{title}</Typography>
      <Typography variant="caption" color="text.secondary">{time}</Typography>
    </Box>
  </Stack>
);

const ChatBubble = ({ side, text, time }: any) => (
  <Box sx={{ alignSelf: side === 'left' ? 'flex-start' : 'flex-end', maxWidth: '70%' }}>
    <Box sx={{ p: 1.5, borderRadius: side === 'left' ? '0 12px 12px 12px' : '12px 0 12px 12px', bgcolor: side === 'left' ? '#FFF' : '#1E293B', color: side === 'left' ? 'text.primary' : '#FFF', boxShadow: '0px 1px 2px rgba(0,0,0,0.05)' }}>
      <Typography variant="body2">{text}</Typography>
    </Box>
    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: side === 'right' ? 'right' : 'left' }}>{time}</Typography>
  </Box>
);

const Info = ({ label, value, isAvatar }: any) => (
  <Box sx={{ minWidth: '150px' }}>
    <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" mb={0.5}>{label}</Typography>
    {isAvatar ? (
      <Stack direction="row" spacing={1} alignItems="center">
        <Avatar sx={{ width: 20, height: 20, fontSize: '10px' }}>{value?.charAt(0) || "U"}</Avatar>
        <Typography fontWeight={600} variant="body2">{value}</Typography>
      </Stack>
    ) : <Typography fontWeight={600} variant="body2">{value}</Typography>}
  </Box>
);

const DocumentRow = ({ name, size }: any) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center">
    <Stack direction="row" spacing={1.5} alignItems="center">
      <DescriptionOutlinedIcon sx={{ color: '#3B82F6' }} fontSize="small" />
      <Box>
        <Typography variant="body2" fontWeight={600}>{name}</Typography>
        <Typography variant="caption" color="text.secondary">{size}</Typography>
      </Box>
    </Stack>
    <Stack direction="row" spacing={0.5}>
        <IconButton size="small"><FileDownloadOutlinedIcon fontSize="inherit" /></IconButton>
        <IconButton size="small"><ShortcutIcon sx={{ transform: 'rotate(90deg)', fontSize: '14px' }} /></IconButton>
    </Stack>
  </Stack>
);