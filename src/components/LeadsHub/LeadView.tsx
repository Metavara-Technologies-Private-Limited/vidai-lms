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
  DialogActions,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
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
import CloseIcon from '@mui/icons-material/Close';

type Lead = {
  id: string;
  name: string;
  initials: string;
  phone?: string;
  email?: string;
  location: string;
  source: string;
  assigned: string;
  status: string;
  quality: string;
  score: string;
  date?: string;
  time?: string;
};

const STORAGE_KEY = "vidai_leads_data";

export default function LeadDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState("Patient Info");
  const [openConvertPopup, setOpenConvertPopup] = React.useState(false);
  const [openEditPopup, setOpenEditPopup] = React.useState(false);
  const [activeStep, setActiveStep] = React.useState(1); // New state for dialog steps

  const leads: Lead[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const lead = leads.find(
    (l) => l.id.replace("#", "") === decodeURIComponent(id || "")
  );

  // Form State
  const [formData, setFormData] = React.useState({
    name: lead?.name || "John Smith",
    phone: lead?.phone || "+91 54211 54121",
    email: lead?.email || "johns@gmail.com",
    location: lead?.location || "201, HM Streets, LA Jolla, California",
    gender: "Male",
    age: "32",
    maritalStatus: "Married",
    isCouple: "Yes",
    partnerName: "Jennifer Smith",
    partnerAge: "29",
    partnerGender: "Female",
  });

  if (!lead) return <Typography p={4}>Lead not found</Typography>;

  const handleOpenPopup = () => setOpenConvertPopup(true);
  const handleClosePopup = () => setOpenConvertPopup(false);

  const handleNext = () => {
    if (activeStep < 3) setActiveStep(activeStep + 1);
    else setOpenEditPopup(false);
  };

  const handleBack = () => {
    if (activeStep > 1) setActiveStep(activeStep - 1);
    else setOpenEditPopup(false);
  };

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
        <Typography color="text.primary" sx={{ fontSize: '12px', fontWeight: 600 }}>{lead.name}</Typography>
      </Breadcrumbs>

      {/* 2. TOP SUMMARY CARD */}
      <Card sx={{ p: 2.5, mb: 3, borderRadius: "16px", boxShadow: "0px 1px 3px rgba(0,0,0,0.05)" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={3} alignItems="center">
            <Avatar sx={{ bgcolor: "#EEF2FF", color: "#6366F1", width: 56, height: 56, fontSize: '20px', fontWeight: 700 }}>
              {lead.initials}
            </Avatar>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">Lead Name</Typography>
              <Typography fontWeight={700} variant="body1">{lead.name}</Typography>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">Lead ID</Typography>
              <Typography fontWeight={600} variant="body1">{lead.id}</Typography>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">Source</Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Box sx={{ width: 16, height: 16, bgcolor: '#FFB800', borderRadius: '50%' }} />
                <Typography fontWeight={600} variant="body1">{lead.source}</Typography>
              </Stack>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">Lead Status</Typography>
              <Chip label={lead.status} size="small" sx={{ bgcolor: '#EFF6FF', color: '#3B82F6', fontWeight: 600, borderRadius: '6px' }} />
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">Lead Quality</Typography>
              <Chip label={lead.quality} size="small" sx={{ bgcolor: '#FEF2F2', color: '#EF4444', fontWeight: 600, borderRadius: '6px' }} />
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">AI Lead Score</Typography>
              <Typography fontWeight={700} color="#EC4899">{lead.score}</Typography>
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
            onClick={() => { setOpenEditPopup(true); setActiveStep(1); }}
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
                  <Info label="CONTACT NO" value={lead.phone || "(555) 555-0128"} />
                  <Info label="EMAIL" value={lead.email || "johnson@gmail.com"} />
                  <Info label="LOCATION" value={lead.location} />
                </Stack>
                <Stack direction="row" spacing={6}>
                  <Info label="GENDER" value="Male" />
                  <Info label="AGE" value="32" />
                  <Info label="MARITAL STATUS" value="Married" />
                </Stack>
                <Stack direction="row" spacing={6}>
                  <Info label="ADDRESS" value="201, HV Streets, LA Jola, California" />
                  <Info label="LANGUAGE PREFERENCE" value="English" />
                  <Info label="ASSIGNED TO" value={lead.assigned} isAvatar />
                </Stack>
                <Info label="CREATED DATE & TIME" value="11/12/2024, 12:36 PM" />
              </Stack>
              <Divider sx={{ my: 4 }} />
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={2} sx={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                Partner Information
              </Typography>
              <Stack direction="row" spacing={6}>
                <Info label="FULL NAME" value="Jennifer Smith" />
                <Info label="AGE" value="29" />
                <Info label="GENDER" value="Female" />
              </Stack>
              <Divider sx={{ my: 4 }} />
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={2} sx={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                Source & Campaign Details
              </Typography>
              <Stack direction="row" spacing={6}>
                <Info label="SUB-SOURCE" value="Facebook" />
                <Info label="CAMPAIGN NAME" value="Facebook IVF Awareness - December" />
                <Info label="CAMPAIGN DURATION" value="01/12/2025 - 07/12/2025" />
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
              <TimelineItem icon={<ChatBubbleOutlineIcon sx={{ fontSize: 16, color: '#6366F1' }} />} title="Appointment Booked - Confirmation sent (SMS)" time="20/12/2024 | 12:49 PM" />
              <TimelineItem icon={<CallOutlinedIcon sx={{ fontSize: 16, color: '#10B981' }} />} title="Outgoing call attempted - Connected" time="11/12/2024 | 04:10 PM" />
              <TimelineItem icon={<EmailOutlinedIcon sx={{ fontSize: 16, color: '#F59E0B' }} />} title="Patient shared contact number and email" time="11/12/2024 | 12:59 PM" />
              <TimelineItem icon={<EmailOutlinedIcon sx={{ fontSize: 16, color: '#3B82F6' }} />} title="Sent an Welcome Email" time="11/12/2024 | 12:57 PM" />
              <TimelineItem isAvatar avatarInitial={lead.assigned.charAt(0)} title={`Assigned to ${lead.assigned}`} time="11/12/2024 | 12:56 PM" />
              <TimelineItem icon={<ChatBubbleOutlineIcon sx={{ fontSize: 16, color: '#8B5CF6' }} />} title="Lead arrived from Website Chatbot" time="11/12/2024 | 12:56 PM" isLast />
            </Stack>
          </Card>
          <Card sx={{ flex: 2, borderRadius: "16px", display: 'flex', flexDirection: 'column', maxHeight: '600px' }}>
            <Box p={2} borderBottom="1px solid #E2E8F0"><Typography variant="subtitle1" fontWeight={700}>Chatbot</Typography></Box>
            <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto', bgcolor: '#F8FAFC' }}>
              <Stack spacing={3}>
                <Typography variant="caption" align="center" color="text.secondary" display="block">SUN, 14 DEC</Typography>
                <ChatBubble side="left" text="Hello! How can I help you today?" time="9:41 AM" />
                <ChatBubble side="right" text="I'm looking for a general health check-up" time="9:42 AM" />
                <ChatBubble side="left" text="Great! I can help you schedule that." time="9:43 AM" />
                <ChatBubble side="right" text="Sometime this week, preferably in the morning" time="9:44 AM" />
                <ChatBubble side="right" text={`My name is ${lead.name}, and my number is ${lead.phone || '(555) 555-0128'}`} time="9:46 AM" />
              </Stack>
            </Box>
            <Box p={2} borderTop="1px solid #E2E8F0">
              <TextField fullWidth placeholder="Type your message..." size="small" InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton color="primary"><SendIcon sx={{ fontSize: 18 }} /></IconButton></InputAdornment>) }} />
            </Box>
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
                        <Button variant="contained" size="small" startIcon={<CallOutlinedIcon sx={{ fontSize: 14 }}/>} sx={{ textTransform: 'none', borderRadius: '6px', bgcolor: '#1E293B' }}>Call Now</Button>
                      </Stack>
                   </Box>
                </Stack>
              </Card>
            </Card>
          </Box>
          <Box sx={{ flex: 2 }}>
            <Card sx={{ p: 2.5, borderRadius: "16px", minHeight: '500px' }}>
              <Typography variant="subtitle1" fontWeight={700} mb={3}>Notes</Typography>
              <NoteItem title="Lead Inquired" content="Lead inquired via chatbot for general fertility check-up." time="FRI, NOV 12, 1:15 PM" />
            </Card>
          </Box>
        </Stack>
      )}

      {/* --- SCROLLABLE EDIT DIALOG --- */}
      <Dialog 
        open={openEditPopup} 
        onClose={() => setOpenEditPopup(false)}
        maxWidth="xl" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '24px' } }}
      >
        <Box p={3}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" fontWeight={700}>
              Edit Lead Details <Typography component="span" variant="h6" color="text.secondary" fontWeight={400}>(#LN 201)</Typography>
            </Typography>
            <IconButton onClick={() => setOpenEditPopup(false)} size="small" sx={{ bgcolor: '#F1F5F9' }}>
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Stack>

          {/* Stepper Header */}
          <Stack direction="row" spacing={3} mb={3} justifyContent="center" alignItems="center">
            {/* Step 1 */}
            <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 22, height: 22, borderRadius: '50%', border: activeStep >= 1 ? '2px solid #F97316' : '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ width: 8, height: 8, bgcolor: activeStep >= 1 ? '#F97316' : 'transparent', borderRadius: '50%' }} />
                </Box>
                <Typography variant="body2" fontWeight={activeStep === 1 ? 700 : 400} color={activeStep >= 1 ? "#F97316" : "text.secondary"}>Patient Details</Typography>
            </Stack>
            <Box sx={{ width: 60, height: 1, bgcolor: activeStep >= 2 ? '#F97316' : '#E2E8F0' }} />
            
            {/* Step 2 */}
            <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 22, height: 22, borderRadius: '50%', border: activeStep >= 2 ? '2px solid #F97316' : '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeStep >= 2 ? '#F97316' : '#94A3B8', fontSize: '12px' }}>
                  {activeStep > 2 ? <Box sx={{ width: 8, height: 8, bgcolor: '#F97316', borderRadius: '50%' }} /> : "2"}
                </Box>
                <Typography variant="body2" fontWeight={activeStep === 2 ? 700 : 400} color={activeStep >= 2 ? "#F97316" : "text.secondary"}>Medical Details</Typography>
            </Stack>
            <Box sx={{ width: 60, height: 1, bgcolor: activeStep >= 3 ? '#F97316' : '#E2E8F0' }} />
            
            {/* Step 3 */}
            <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 22, height: 22, borderRadius: '50%', border: activeStep === 3 ? '2px solid #F97316' : '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeStep === 3 ? '#F97316' : '#94A3B8', fontSize: '12px' }}>3</Box>
                <Typography variant="body2" fontWeight={activeStep === 3 ? 700 : 400} color={activeStep === 3 ? "#F97316" : "text.secondary"}>Book Appointment</Typography>
            </Stack>
          </Stack>
          
          <Divider sx={{ mb: 4 }} />

          {/* SCROLLABLE CONTENT AREA */}
          <DialogContent sx={{ 
            maxHeight: '65vh', 
            overflowY: 'auto', 
            py: 1,
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#E2E8F0', borderRadius: '10px' }
          }}>
            {activeStep === 1 && (
              <Stack spacing={4}>
                {/* Lead Information */}
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 2, display: 'block', letterSpacing: '0.5px' }}>
                      Lead Information
                  </Typography>
                  <Stack direction="row" spacing={2} mb={2.5}>
                      <TextField fullWidth size="small" label="Full Name" value={formData.name} />
                      <TextField fullWidth size="small" label="Contact No" value={formData.phone} />
                      <TextField fullWidth size="small" label="Email" value={formData.email} />
                      <TextField fullWidth size="small" label="Location/Address" value="201, HM Streets, LA Jolla, California" />
                  </Stack>
                  <Stack direction="row" spacing={2} mb={2.5}>
                      <TextField select fullWidth size="small" label="Gender" defaultValue="Male">
                          <MenuItem value="Male">Male</MenuItem>
                          <MenuItem value="Female">Female</MenuItem>
                      </TextField>
                      <TextField fullWidth size="small" label="Age" defaultValue="32" />
                      <TextField select fullWidth size="small" label="Marital Status" defaultValue="Married">
                          <MenuItem value="Married">Married</MenuItem>
                          <MenuItem value="Single">Single</MenuItem>
                      </TextField>
                      <TextField fullWidth size="small" label="Address" value="201, HM Streets, LA Jolla, California" />
                  </Stack>
                  <TextField select sx={{ width: '24.3%' }} size="small" label="Language Preference" defaultValue="English">
                      <MenuItem value="English">English</MenuItem>
                      <MenuItem value="Spanish">Spanish</MenuItem>
                  </TextField>
                </Box>

                <Divider />

                {/* Partner Information */}
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 2, display: 'block', letterSpacing: '0.5px' }}>
                      Partner Information
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: '#475569', mb: 1 }}>Is this inquiry for a couple?</Typography>
                  <RadioGroup row value={formData.isCouple} onChange={(e) => setFormData({...formData, isCouple: e.target.value})}>
                      <FormControlLabel value="Yes" control={<Radio size="small" sx={{ color: '#F87171', '&.Mui-checked': { color: '#EF4444' } }} />} label={<Typography variant="body2">Yes</Typography>} />
                      <FormControlLabel value="No" control={<Radio size="small" sx={{ color: '#F87171', '&.Mui-checked': { color: '#EF4444' } }} />} label={<Typography variant="body2">No</Typography>} />
                  </RadioGroup>
                  
                  {formData.isCouple === "Yes" && (
                      <Stack direction="row" spacing={2} mt={2}>
                          <TextField fullWidth size="small" label="Full Name" value={formData.partnerName} />
                          <TextField fullWidth size="small" label="Age" value={formData.partnerAge} />
                          <TextField select fullWidth size="small" label="Gender" value={formData.partnerGender}>
                              <MenuItem value="Female">Female</MenuItem>
                              <MenuItem value="Male">Male</MenuItem>
                          </TextField>
                          <Box sx={{ flex: 1 }} />
                      </Stack>
                  )}
                </Box>

                <Divider />

                {/* Source Details */}
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 2, display: 'block', letterSpacing: '0.5px' }}>
                      Source & Campaign Details
                  </Typography>
                  <Stack direction="row" spacing={2}>
                      <TextField select fullWidth size="small" label="Source" defaultValue="Social Media">
                          <MenuItem value="Social Media">Social Media</MenuItem>
                      </TextField>
                      <TextField select fullWidth size="small" label="Sub-Source" defaultValue="Facebook">
                          <MenuItem value="Facebook">Facebook</MenuItem>
                      </TextField>
                      <TextField fullWidth size="small" label="Campaign Name" defaultValue="Facebook IVF Awareness - December" />
                  </Stack>
                </Box>

                <Divider />

                {/* Assignee Section */}
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 2, display: 'block', letterSpacing: '0.5px' }}>
                      Assignee & Next Action Details
                  </Typography>
                  <Stack direction="row" spacing={2} mb={2.5}>
                      <TextField select fullWidth size="small" label="Assigned To" defaultValue="Henry Cavill">
                          <MenuItem value="Henry Cavill">Henry Cavill</MenuItem>
                      </TextField>
                      <TextField select fullWidth size="small" label="Next Action Type" defaultValue="Follow Up">
                          <MenuItem value="Follow Up">Follow Up</MenuItem>
                      </TextField>
                      <TextField select fullWidth size="small" label="Next Action Status" defaultValue="To Do">
                          <MenuItem value="To Do">To Do</MenuItem>
                      </TextField>
                      <TextField fullWidth size="small" label="Next Action Description" placeholder="Enter Description" />
                  </Stack>
                </Box>
              </Stack>
            )}

            {activeStep === 2 && (
              <Stack spacing={4}>
                 <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 2, display: 'block', letterSpacing: '0.5px' }}>
                      Medical Interests
                  </Typography>
                  <Stack direction="row" spacing={2}>
                      <TextField select fullWidth size="small" label="Primary Concern" defaultValue="Infertility">
                          <MenuItem value="Infertility">Infertility</MenuItem>
                          <MenuItem value="Checkup">General Checkup</MenuItem>
                      </TextField>
                      <TextField select fullWidth size="small" label="Treatment Interest" defaultValue="IVF">
                          <MenuItem value="IVF">IVF</MenuItem>
                          <MenuItem value="IUI">IUI</MenuItem>
                      </TextField>
                  </Stack>
                </Box>
                <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 2, display: 'block', letterSpacing: '0.5px' }}>
                      Past Medical History
                  </Typography>
                  <TextField fullWidth multiline rows={4} placeholder="Enter any relevant medical history..." />
                </Box>
              </Stack>
            )}

            {activeStep === 3 && (
              <Stack spacing={4}>
                 <Box>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', mb: 2, display: 'block', letterSpacing: '0.5px' }}>
                      Schedule Appointment
                  </Typography>
                  <Stack direction="row" spacing={2} mb={2.5}>
                      <TextField fullWidth size="small" type="date" label="Preferred Date" InputLabelProps={{ shrink: true }} />
                      <TextField fullWidth size="small" type="time" label="Preferred Time" InputLabelProps={{ shrink: true }} />
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <TextField select fullWidth size="small" label="Consultant/Doctor" defaultValue="Dr. Alex Carey">
                          <MenuItem value="Dr. Alex Carey">Dr. Alex Carey</MenuItem>
                    </TextField>
                    <TextField select fullWidth size="small" label="Department" defaultValue="Gynaecology">
                          <MenuItem value="Gynaecology">Gynaecology</MenuItem>
                    </TextField>
                  </Stack>
                </Box>
              </Stack>
            )}
          </DialogContent>

          <DialogActions sx={{ pt: 3, pb: 1, px: 2 }}>
            <Button onClick={handleBack} variant="outlined" sx={{ borderRadius: '10px', textTransform: 'none', px: 5, borderColor: '#E2E8F0', color: '#475569', fontWeight: 600 }}>
              {activeStep === 1 ? "Cancel" : "Back"}
            </Button>
            <Button onClick={handleNext} variant="contained" sx={{ borderRadius: '10px', textTransform: 'none', px: 6, bgcolor: '#475569', fontWeight: 600, '&:hover': { bgcolor: '#334155' } }}>
              {activeStep === 3 ? "Save Details" : "Next"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

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
                    Are you sure you want to Convert <b>"{lead.name}"</b> lead into a patient & register it?
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
    </Box>
  );
}

// Sub-components
const NoteItem = ({ title, content, time }: any) => (
  <Box sx={{ p: 2, border: '1px solid #F1F5F9', borderRadius: '12px', mb: 2 }}>
    <Typography variant="body2" fontWeight={700} mb={0.5}>{title}</Typography>
    <Typography variant="body2" color="text.secondary" mb={1}>{content}</Typography>
    <Typography variant="caption" color="text.secondary">{time}</Typography>
  </Box>
);

const TimelineItem = ({ icon, title, time, isAvatar, avatarInitial, isLast }: any) => (
  <Stack direction="row" spacing={2}>
    <Stack alignItems="center">
      <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isAvatar ? <Avatar sx={{ width: 20, height: 20, fontSize: '10px' }}>{avatarInitial}</Avatar> : icon}
      </Box>
      {!isLast && <Box sx={{ width: '2px', flexGrow: 1, bgcolor: '#E2E8F0', my: 0.5 }} />}
    </Stack>
    <Box pb={3}>
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
        <Avatar sx={{ width: 20, height: 20, fontSize: '10px' }}>HC</Avatar>
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