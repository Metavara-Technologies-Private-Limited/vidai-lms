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
  MenuItem,
  Grid,
  Modal,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PhoneEnabledIcon from "@mui/icons-material/PhoneEnabled";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
// Call Icons
import MicOffIcon from "@mui/icons-material/MicOff";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import CallEndIcon from "@mui/icons-material/CallEnd";
// Mail Icons
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";

import { useNavigate } from "react-router-dom";

// Importing your data and type
import { leadsMock } from "./leadsMock";
import type { Lead } from "../../types/leads.types";

interface Props {
  search: string;
}

const LeadsBoard: React.FC<Props> = ({ search }) => {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);

  // --- Modal & Overlay States ---
  const [openBookModal, setOpenBookModal] = React.useState(false);
  const [openCallOverlay, setOpenCallOverlay] = React.useState(false);
  const [openMailModal, setOpenMailModal] = React.useState(false);
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);

  // --- NEW: Mail Step State ---
  // 1 = Compose, 2 = Sending, 3 = Success
  const [mailStep, setMailStep] = React.useState<1 | 2 | 3>(1);

  const columns = [
    { label: "NEW LEADS", statusKey: ["New"], color: "#6366F1" },
    { label: "FOLLOW-UPS", statusKey: ["Follow-Ups", "Follow-up"], color: "#F59E0B" },
    { label: "APPOINTMENT", statusKey: ["Appointment"], color: "#10B981" },
    { label: "CONVERTED LEADS", statusKey: ["Converted"], color: "#8B5CF6" },
    { label: "CYCLE CONVERSION", statusKey: ["Cycle Conversion"], color: "#EC4899" },
    { label: "LOST LEADS", statusKey: ["Lost"], color: "#64748B" },
  ];

  const filteredLeads = leadsMock.filter((l) =>
    `${l.name} ${l.id}`.toLowerCase().includes(search.toLowerCase())
  );

  // Handlers
  const handleOpenBookModal = (lead: Lead) => {
    setSelectedLead(lead);
    setOpenBookModal(true);
  };

  const handleOpenCall = (lead: Lead) => {
    setSelectedLead(lead);
    setOpenCallOverlay(true);
  };

  const handleOpenMail = (lead: Lead) => {
    setSelectedLead(lead);
    setMailStep(1); // Start at Compose
    setOpenMailModal(true);
  };

  const handleSendMail = () => {
    setMailStep(2); // Move to Sending
    setTimeout(() => {
      setMailStep(3); // Move to Success after 1.5s
      setTimeout(() => {
        handleCloseAll(); // Auto close after 2s of showing success
      }, 2000);
    }, 1500);
  };

  const handleCloseAll = () => {
    setOpenBookModal(false);
    setOpenCallOverlay(false);
    setOpenMailModal(false);
    setSelectedLead(null);
    setMailStep(1); // Reset step for next time
  };

  // Reusable styles for the modal inputs
  const modalFieldStyle = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
      "& fieldset": { borderColor: "#000000", borderWidth: "1px" },
      "&:hover fieldset": { borderColor: "#000000" },
      "&.Mui-focused fieldset": { borderColor: "#000000", borderWidth: "1px" },
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
            Score: <Box component="span" sx={{ color: '#1E293B' }}>{lead.score}</Box>
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ width: '100%', mt: 1.5 }}>
        <Stack spacing={1} sx={{ mb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <LocationOnIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>{lead.location || "Not specified"}</Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarMonthIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>{`${lead.date}, ${lead.time}`}</Typography>
          </Stack>
        </Stack>
        
        <Divider sx={{ my: 1.5, borderStyle: "dashed" }} />
        
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem", display: "block", fontWeight: 700 }}>ASSIGNED TO</Typography>
            <Typography variant="caption" fontWeight={600} color="#1E293B" sx={{ fontSize: '0.75rem' }}>{lead.assigned || "Unassigned"}</Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem", display: "block", fontWeight: 700 }}>LEAD SOURCE</Typography>
            <Typography variant="caption" fontWeight={600} color="#1E293B" sx={{ fontSize: '0.75rem' }}>{lead.source || "Unknown"}</Typography>
          </Box>
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem", display: "block", fontWeight: 700, mb: 1 }}>CONTACT OPTION</Typography>
        <Stack direction="row" spacing={1.5} sx={{ mb: showButton ? 2 : 0 }}>
          <IconButton size="small" sx={iconBtnStyle} onClick={() => handleOpenCall(lead)}>
            <PhoneEnabledIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <IconButton size="small" sx={iconBtnStyle}><ChatBubbleOutlineIcon sx={{ fontSize: 16 }} /></IconButton>
          <IconButton size="small" sx={iconBtnStyle} onClick={() => handleOpenMail(lead)}>
            <MailOutlineIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>

        {showButton && (
          <Button 
            fullWidth 
            variant="contained" 
            size="small" 
            onClick={() => handleOpenBookModal(lead)}
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
        const leadsInCol = filteredLeads.filter((l) => col.statusKey.some((key) => l.status === key));
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
  onClick={() => navigate(`/leads/${lead.id}`)}
 sx={{ cursor: "pointer" }}


                  onMouseLeave={() => setHoveredId(null)}
                  elevation={0}
                  sx={{ 
                    p: 2.5, 
                    borderRadius: "16px", 
                    border: "1px solid #EAECF0",
                    transition: "all 0.3s ease", 
                    width: '100%',
                    backgroundColor: "#FFFFFF",
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
                        {lead.initials}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '0.9rem', color: '#1E293B' }}>{lead.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>{lead.id}</Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Chip 
                        label={lead.quality} 
                        size="small" 
                        sx={{ 
                          height: 20, fontSize: "0.65rem", fontWeight: 700,
                          bgcolor: lead.quality === "Hot" ? "#FEE2E2" : lead.quality === "Warm" ? "#FEF3C7" : "#F1F5F9",
                          color: lead.quality === "Hot" ? "#B91C1C" : lead.quality === "Warm" ? "#B45309" : "#475569"
                        }} 
                      />
                      <IconButton size="small"><MoreVertIcon sx={{ fontSize: 20, color: '#94A3B8' }} /></IconButton>
                    </Stack>
                  </Stack>
                  {renderCardContent(lead, col.label, hoveredId === lead.id)}
                </Paper>
              ))}
            </Stack>
          </Box>
        );
      })}

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
            APPOINTMENT DETAILS FOR {selectedLead?.name.toUpperCase()}
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography {...labelStyle}>Department *</Typography>
              <TextField select fullWidth size="small" defaultValue="Consultation" sx={modalFieldStyle}>
                <MenuItem value="Consultation">Consultation</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <Typography {...labelStyle}>Personnel *</Typography>
              <TextField select fullWidth size="small" defaultValue="Dr. Alex Carey" sx={modalFieldStyle}>
                <MenuItem value="Dr. Alex Carey">Dr. Alex Carey</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <Typography {...labelStyle}>Date *</Typography>
              <TextField type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} sx={modalFieldStyle} />
            </Grid>
            <Grid item xs={6}>
              <Typography {...labelStyle}>Select Slot *</Typography>
              <TextField select fullWidth size="small" defaultValue="12:30" sx={modalFieldStyle}>
                <MenuItem value="12:30">12:30 PM - 01:00 PM</MenuItem>
              </TextField>
            </Grid>
          </Grid>

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

      {/* --- DYNAMIC MAIL MODAL (THE 3 POPUP STAGES) --- */}
      <Dialog 
        open={openMailModal} 
        onClose={handleCloseAll} 
        fullWidth 
        maxWidth="sm" 
        PaperProps={{ 
            sx: { 
                borderRadius: '24px', 
                p: 1,
                minHeight: mailStep === 1 ? 'auto' : '400px', // Animates height change
                transition: 'min-height 0.3s ease'
            } 
        }}
      >
        {/* STAGE 1: COMPOSE */}
        {mailStep === 1 && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', pb: 2 }}>
              <Typography variant="h6" fontWeight={800} sx={{ color: '#1E293B' }}>Compose Mail</Typography>
              <IconButton onClick={handleCloseAll} size="small"><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ mt: 3 }}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography {...labelStyle}>To</Typography>
                  <TextField fullWidth size="small" value={selectedLead?.name || ""} disabled sx={modalFieldStyle} />
                </Box>
                <Box>
                  <Typography {...labelStyle}>Subject</Typography>
                  <TextField fullWidth size="small" placeholder="Enter subject" sx={modalFieldStyle} />
                </Box>
                <Box>
                  <Typography {...labelStyle}>Message</Typography>
                  <TextField 
                    fullWidth 
                    multiline 
                    rows={8} 
                    placeholder="Type your message here..." 
                    sx={{ 
                      ...modalFieldStyle,
                      "& .MuiOutlinedInput-root": { borderRadius: '16px' }
                    }} 
                  />
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'space-between' }}>
              <IconButton sx={{ color: '#64748B' }}><AttachFileIcon /></IconButton>
              <Stack direction="row" spacing={2}>
                <Button onClick={handleCloseAll} sx={{ color: '#64748B', textTransform: 'none', fontWeight: 700 }}>Discard</Button>
                <Button 
                  variant="contained" 
                  onClick={handleSendMail}
                  endIcon={<SendIcon />}
                  sx={{ 
                    bgcolor: '#6366F1', 
                    borderRadius: '12px', 
                    px: 4, 
                    textTransform: 'none', 
                    fontWeight: 700,
                    "&:hover": { bgcolor: '#4F46E5' }
                  }}
                >
                  Send
                </Button>
              </Stack>
            </DialogActions>
          </>
        )}

        {/* STAGE 2: SENDING (LOADING) */}
        {mailStep === 2 && (
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 8 }}>
            <CircularProgress size={64} thickness={4} sx={{ color: '#6366F1', mb: 3 }} />
            <Typography variant="h5" fontWeight={700} color="#1E293B">Sending Email...</Typography>
            <Typography variant="body2" color="#64748B" sx={{ mt: 1 }}>Please wait a moment.</Typography>
          </DialogContent>
        )}

        {/* STAGE 3: SUCCESS */}
        {mailStep === 3 && (
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 8 }}>
            <Box sx={{ bgcolor: '#ECFDF5', borderRadius: '50%', p: 2, mb: 3 }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 60, color: '#10B981' }} />
            </Box>
            <Typography variant="h4" fontWeight={800} color="#1E293B">Success!</Typography>
            <Typography variant="body1" color="#64748B" sx={{ textAlign: 'center', mt: 1, maxWidth: '280px' }}>
              Your email has been sent to <strong>{selectedLead?.name}</strong>.
            </Typography>
          </DialogContent>
        )}
      </Dialog>

      {/* --- CALLING OVERLAY --- */}
      <Modal
        open={openCallOverlay}
        onClose={handleCloseAll}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Box sx={{
          bgcolor: 'white',
          width: '100%',
          maxWidth: 480,
          borderRadius: '40px',
          p: 6,
          textAlign: 'center',
          position: 'relative',
          outline: 'none',
          boxShadow: '0px 24px 48px rgba(0,0,0,0.1)'
        }}>
          <IconButton 
            onClick={handleCloseAll} 
            sx={{ position: 'absolute', top: 24, right: 24, color: '#94A3B8' }}
          >
            <CloseIcon />
          </IconButton>

          <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 600, mb: 1, mt: 2 }}>Calling</Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1E293B', mb: 6 }}>{selectedLead?.name}</Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 8 }}>
            <Avatar sx={{ width: 140, height: 140, bgcolor: '#EEF2FF', color: '#6366F1', fontSize: '3rem', fontWeight: 700 }}>
              {selectedLead?.initials}
            </Avatar>
          </Box>

          <Stack direction="row" spacing={3} justifyContent="center" sx={{ mb: 6 }}>
            <IconButton sx={{ bgcolor: '#F8FAFC', p: 2 }}><MicOffIcon sx={{ color: '#64748B' }} /></IconButton>
            <IconButton sx={{ bgcolor: '#F8FAFC', p: 2 }}><PersonAddIcon sx={{ color: '#64748B' }} /></IconButton>
            <IconButton sx={{ bgcolor: '#F8FAFC', p: 2 }}><VolumeUpIcon sx={{ color: '#64748B' }} /></IconButton>
          </Stack>

          <IconButton 
            onClick={handleCloseAll}
            sx={{ bgcolor: '#EF4444', color: 'white', width: 72, height: 72, '&:hover': { bgcolor: '#DC2626' } }}
          >
            <CallEndIcon sx={{ fontSize: 32 }} />
          </IconButton>
        </Box>
      </Modal>
    </Box>
  );
};

export default LeadsBoard;