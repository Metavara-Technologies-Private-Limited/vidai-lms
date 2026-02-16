import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  propertyContainerSx,
  propertyFieldSx,
  floatingLabelSx,
  priorityChipSx,propertyMenuProps, statusChipSx,
} from "../../../styles/Settings/Tickets.styles";
import TemplateService from "../../../services/templates.api"; 
import { EmailTemplateTable } from "../Templates/EmailTemplateTable"; 

import {
  Box, Typography, Divider, Button, Avatar, Stack, Chip, Popover,
  Tabs, Tab, MenuItem, Select, TextField, CircularProgress, Alert,
  Dialog, DialogContent, IconButton, InputBase,
} from "@mui/material";
import ReplyMail from "../../../assets/icons/Reply_Ticket_Mail.svg";
import BackwardIcon from "../../../assets/icons/Backward_Icon.svg";
import DeleteMail from "../../../assets/icons/Delete_Icon.svg";
import { ticketsApi, clinicsApi } from "../../../services/tickets.api";
import type { TicketDetail, Employee, TicketStatus, TicketPriority } from "../../../types/tickets.types";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import CloseIcon from "@mui/icons-material/Close";
import { ticketDetailsTabsSx } from "../../../styles/Settings/Tickets.styles";
import { NewTemplateModal } from "../Templates/NewTemplateModal"; 

{/* ##########   in the reply mail tool bar icons  #########################  */}
import AttachFileIcon from "@mui/icons-material/AttachFile";
import LinkIcon from "@mui/icons-material/Link";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import FormatSizeIcon from "@mui/icons-material/FormatSize";
import Visibility from "@mui/icons-material/Visibility";

const FILE_BASE_URL = "http://127.0.0.1:8000";

const ticketTypes = [
  "Question",
  "Bugs",
  "Problems",
  "Incident",
  "Custom Integration",
  "Login creation",
];

const TicketView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  // Editable States
  const [status, setStatus] = useState<TicketStatus>("new");
  const [priority, setPriority] = useState<TicketPriority>("low");
  const [assignTo, setAssignTo] = useState<number | "">("");
  const [description, setDescription] = useState(""); // State for editable description
  const [openReply, setOpenReply] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyTo, setReplyTo] = useState(ticket?.requested_by || "");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openPicker = Boolean(anchorEl);
  const [replySubject, setReplySubject] = useState("");
const fileInputRef = useRef<HTMLInputElement>(null);
const imageInputRef = useRef<HTMLInputElement>(null);
const [showEmoji, setShowEmoji] = useState(false);
const [type, setType] = useState<string>("Question");
const [openTemplateDialog, setOpenTemplateDialog] = useState(false);
const [templates, setTemplates] = useState<any[]>([]);
const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);
const [viewTemplateOpen, setViewTemplateOpen] = useState(false);
const [viewTemplateData, setViewTemplateData] = useState<any>(null);


  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [ticketData, empData] = await Promise.all([
        ticketsApi.getTicketById(id),
        clinicsApi.getClinicEmployees("1") // Using hardcoded clinic ID
      ]);

      setTicket(ticketData);
      setEmployees(empData);

      // Sync local states with DB response
      setStatus(ticketData.status);
      setPriority(ticketData.priority);
      setAssignTo(ticketData.assigned_to || "");
      setDescription(ticketData.description);
    } catch (err) {
      setError("Failed to load ticket details from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
  if (!openTemplateDialog) return;

  const loadTemplates = async () => {
    try {
      const response = await TemplateService.getTemplates("mail");

      // Handles both paginated and non-paginated API responses
      const templateList = Array.isArray(response)
        ? response
        : response?.results || [];

setTemplates(
  templateList.map((t: any) => ({
    ...t,
    audience_name: t.name,
    email_body: t.body,   // normalize once
  }))
);
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  loadTemplates();
}, [openTemplateDialog]);


  useEffect(() => {
    if (ticket?.subject) {
      setReplySubject(ticket.subject);
    }
  }, [ticket]);

  useEffect(() => {
    if (ticket?.requested_by) {
      setReplyTo(ticket.requested_by);
    }
  }, [ticket]);

  // 🔍 File Preview Handlers
  const handlePreviewOpen = (file: string) => {
    const fullUrl = file.startsWith("http")
      ? file
      : `${FILE_BASE_URL}${file}`;

    setPreviewFile(fullUrl);
    setPreviewOpen(true);
  };


  const handlePreviewClose = () => {
    setPreviewOpen(false);
    setPreviewFile(null);
  };

  // Handle saving all changes to the Database
  const handleUpdate = async () => {
    if (!id) return;

    if (!ticket) {
      toast.warn("No ticket data found.");
      return;
    }
    setUpdating(true);
    setError(null);

    try {
      let hasChanges = false;

      // 1. Status
      if (status !== ticket.status) {
        await ticketsApi.updateTicketStatus(id, status);
        hasChanges = true;
      }

      // 2. Assignee
      if (assignTo !== (ticket.assigned_to || "")) {
        await ticketsApi.assignTicket(id, String(assignTo));
        hasChanges = true;
      }

      // 3. Priority / Description
      if (priority !== ticket.priority || description !== ticket.description) {
        await ticketsApi.updateTicket(id, {
          subject: ticket.subject,
          description: description.trim(),
          lab: ticket.lab,
          department: ticket.department,
          requested_by: ticket.requested_by,
          priority: priority,
          status: status
        });
        hasChanges = true;
      }

      if (!hasChanges) {
        toast.info("No changes made.");
        setUpdating(false);
        return;
      }

      await loadData();
      toast.success("Ticket updated successfully!");
    } catch (err) {
      const msg = "Failed to update ticket.";
      setError(msg);
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyTo) {
      toast.warn("Please select a recipient.");
      return;
    }

    if (!replyMessage.trim()) {
      toast.warn("Reply message cannot be empty.");
      return;
    }

    try {
      // 👉 When backend API is ready, call here
      // await ticketsApi.sendReply(id, { message: replyMessage });

      toast.success("Reply sent successfully!");

      // Reset UI
      setReplyMessage("");
      setOpenReply(false);
    } catch (error) {
      toast.error("Failed to send reply.");
    }
  };

const convertHtmlToText = (html: string) => {
  if (!html) return "";

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // Convert <br> and <p> to new lines
  const text = tempDiv.innerText || tempDiv.textContent || "";

  return text.trim();
};


const handleTemplateAction = (type: string, template: any) => {
  if (type === "view" || type === "copy") {

    // Insert template content into editor
    setReplyMessage(prev => prev + "\n\n" + (template.email_body || ""));

    // Auto-fill subject if empty
    if (!replySubject && template.subject) {
      setReplySubject(template.subject);
    }

    // Close dialog
    setOpenTemplateDialog(false);
  }
};

const handleCancelReply = () => {
  setOpenReply(false);      
  setReplyMessage("");      
};

const iconSx = {
  fontSize: 20,
  color: "#6F6F6F",
  cursor: "pointer",
  transition: "0.2s",
  "&:hover": {
    color: "#232323",
  },
};

const handleAttachClick = () => {
  fileInputRef.current?.click();
};

const handleImageClick = () => {
  imageInputRef.current?.click();
};

const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setReplyMessage(prev => prev + `\n📎 Attached: ${file.name}\n`);
};

const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const imageURL = URL.createObjectURL(file);
  setReplyMessage(prev => prev + `\n🖼 Image: ${file.name}\n`);
};

const handleEmojiInsert = (emoji: string) => {
  setReplyMessage(prev => prev + emoji);
  setShowEmoji(false);
};

const handleInsertLink = () => {
  let inputValue = "";

  toast(
    ({ closeToast }) => (
      <Box>
        <Typography fontSize={13} mb={1}>
          Insert Link
        </Typography>

        <input
          type="text"
          placeholder="https://example.com"
          onChange={(e) => (inputValue = e.target.value)}
          style={{
            width: "100%",
            padding: "6px 8px",
            border: "1px solid #E0E0E0",
            borderRadius: "4px",
            marginBottom: "8px",
          }}
        />

        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button size="small" onClick={() => closeToast?.()}>
            Cancel
          </Button>

          <Button
            size="small"
            variant="contained"
            onClick={() => {
              if (inputValue.trim()) {
                setReplyMessage((prev) => prev + `\n🔗 ${inputValue}\n`);
              }
              closeToast?.();
            }}
            sx={{ bgcolor: "#505050", "&:hover": { bgcolor: "#232323" } }}
          >
            Insert
          </Button>
        </Stack>
      </Box>
    ),
    {
      autoClose: false,
      closeOnClick: false,
      draggable: false,
    }
  );
};

const handleInsertDriveLink = () => {
  let inputValue = "";

  toast(
    ({ closeToast }) => (
      <Box>
        <Typography fontSize={13} mb={1}>
          Paste Google Drive Link
        </Typography>

        <input
          type="text"
          placeholder="https://drive.google.com/..."
          onChange={(e) => (inputValue = e.target.value)}
          style={{
            width: "100%",
            padding: "6px 8px",
            border: "1px solid #E0E0E0",
            borderRadius: "4px",
            marginBottom: "8px",
          }}
        />

        <Stack direction="row" justifyContent="flex-end" spacing={1}>
          <Button
            size="small"
            onClick={() => closeToast?.()}
          >
            Cancel
          </Button>

          <Button
            size="small"
            variant="contained"
            onClick={() => {
              if (inputValue.trim()) {
                setReplyMessage((prev) => prev + `\n☁️ ${inputValue}\n`);
              }
              closeToast?.();
            }}
            sx={{ bgcolor: "#505050", "&:hover": { bgcolor: "#232323" } }}
          >
            Insert
          </Button>
        </Stack>
      </Box>
    ),
    {
      autoClose: false,
      closeOnClick: false,
      draggable: false,
    }
  );
};



  if (loading) return <Box display="flex" justifyContent="center" mt={10}><CircularProgress /></Box>;
  if (error || !ticket) return <Alert severity="error" sx={{ m: 3 }}>{error || "Ticket not found."}</Alert>;

  return (
    <Box p={0.5} bgcolor="#fff">
      <Stack direction="row" alignItems="center" mb={1} mt={-2}  >
        <Button
          onClick={() => navigate(-1)}
          sx={{
            minWidth: "auto",
            p: 0.2,
            borderRadius: "2px",
          }}
        >
          <img src={BackwardIcon} alt="Back" />
        </Button>

        <Typography fontSize={14} fontWeight={700}>
          {ticket.ticket_no?.replace("TICKET-", "TN-")}
        </Typography>
      </Stack>

      <Box display="flex" gap={4}>
        {/* LEFT PANEL: EDITABLE CONTENT */}
        <Box
          flex={2}
          p={3}
          borderRadius={2}
          bgcolor="#FAFAFA"
          border="1px solid #E0E0E0"
        >
          {/* Subject */}
          <Typography fontSize={16} fontWeight={700} mb={1}>
            {ticket.subject}
          </Typography>

          <Divider sx={{ mb: 2 }} />

          {/* WHITE CONTENT SECTION */}
          <Box
            p={3}
            borderRadius={2}
            bgcolor="#FFFFFF"
            border="1px solid #ECECEC"
            mb={3}
          >

            <Box display="flex" justifyContent="space-between" mb={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Avatar src={`https://ui-avatars.com/api/?name=${ticket.requested_by}&background=random`} />
                <Box>
                  <Typography fontWeight={700}>{ticket.requested_by}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {ticket.requested_by.toLowerCase().replace(/\s/g, '.')}@fertility.com
                  </Typography>
                </Box>
              </Stack>

              <Typography variant="caption" color="text.secondary">
                {dayjs(ticket.created_at).format("ddd, MMM DD, h:mm A")}
              </Typography>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              variant="standard"   // 👈 removes outlined box
              placeholder="Describe the issue in detail..."
              InputProps={{
                disableUnderline: true,   // 👈 removes bottom line
              }}
              sx={{
                mb: 4,
                "& .MuiInputBase-root": {
                  fontSize: "0.95rem",
                  lineHeight: 1.7,
                  padding: 0,             // 👈 remove inner spacing
                  backgroundColor: "transparent",
                },
                "& textarea": {
                  padding: 0,
                }
              }}
            />


            {/* Attachments */}
            <Stack direction="row" spacing={2}>
              {ticket.documents?.map((doc) => (
                <Box
                  key={doc.id}
                  sx={{
                    p: 1.5,
                    border: "1px solid #E0E0E0",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 2
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {doc.file?.split("/").pop()}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => {
                      if (doc.file) handlePreviewOpen(doc.file);
                    }}
                    disabled={!doc.file}
                  >
                    View
                  </Button>

                </Box>
              ))}
            </Stack>

          </Box>
          {/*#########   **************    Reply Mail Button    ****************  #########*/}

          {!openReply && (
            <Button
              onClick={() => setOpenReply(true)}
              sx={{ textTransform: "none", mt: 2 }}
            >
              <img src={ReplyMail} alt="Reply" />
            </Button>
          )}

          {/*#########   **************    Reply mail dropdown   ****************  #########*/}

          {openReply && (
            <Box
              mt={3}
              p={3}
              borderRadius={2}
              bgcolor="#FFFFFF"
            >
              {/* TO ROW */}
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                pb={1.5}
                borderBottom="1px solid #E6E6E6"
                onClick={(e) => {
                  if (!replyTo) setAnchorEl(e.currentTarget);
                }}
                sx={{ cursor: !replyTo ? "pointer" : "default" }}
              >

                <Typography fontSize={14} color="#7A7A7A">
                  To :
                </Typography>
                {!replyTo && (
                  <Typography fontSize={13} color="#9E9E9E">
                    Click to select recipient
                  </Typography>
                )}


                {replyTo && (
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={1}
                    px={1.2}
                    py={0.5}
                    borderRadius="16px"
                    bgcolor="#F1F3F5"
                  >
                    <Avatar sx={{ width: 22, height: 22, fontSize: 11 }}>
                      {replyTo.charAt(0)}
                    </Avatar>

                    <Typography fontSize={13} fontWeight={500}>
                      {replyTo}
                    </Typography>

                    {/* REMOVE ICON */}
                    <Box
                      component="span"
                      onClick={() => setReplyTo("")}
                      sx={{
                        cursor: "pointer",
                        fontSize: 16,
                        lineHeight: 1,
                        color: "#7A7A7A",
                        "&:hover": { color: "#000" },
                      }}
                    >
                      ×
                    </Box>
                  </Box>
                )}
                <Popover
                  open={openPicker}
                  anchorEl={anchorEl}
                  onClose={() => setAnchorEl(null)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                >
                  <Box sx={{ width: 260, maxHeight: 250, overflowY: "auto", p: 1 }}>
                    {employees.map((emp) => (
                      <Box
                        key={emp.id}
                        onClick={() => {
                          setReplyTo(emp.emp_name);
                          setAnchorEl(null);
                        }}
                        sx={{
                          p: 1,
                          borderRadius: 1,
                          cursor: "pointer",
                          "&:hover": { backgroundColor: "#F5F5F5" },
                        }}
                      >
                        <Typography fontSize={13} fontWeight={500}>
                          {emp.emp_name}
                        </Typography>
                        <Typography fontSize={12} color="text.secondary">
                          {emp.department_name}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Popover>

              </Box>


              {/* SUBJECT ROW */}
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                pb={1.5}
                borderBottom="1px solid #E6E6E6"
              >
                <Typography fontSize={13} color="#9E9E9E" minWidth={60}>
                  Subject :
                </Typography>

                <InputBase
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  placeholder="Enter subject"
                  sx={{
                    flex: 1,
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                />
              </Box>



              {/* Message */}
           <TextField
  fullWidth
  multiline
  minRows={6}
  variant="standard"              
  placeholder="Write your reply..."
  value={replyMessage}
  onChange={(e) => setReplyMessage(e.target.value)}
  InputProps={{
    disableUnderline: true,       
  }}
  sx={{
    mt: 1,
    "& .MuiInputBase-root": {
      fontSize: 14,
      lineHeight: 1.6,
      padding: 0,
    },
    "& textarea": {
      padding: 0,
    }
  }}
/>

{/* ###########    tool bar icons   #################   */}
{/* Bottom Divider */}
<Divider sx={{ my: 1.5 }} />

<Stack direction="row" alignItems="center" spacing={1.5}>
  <FormatSizeIcon sx={iconSx} />

  <AttachFileIcon sx={iconSx} onClick={handleAttachClick} />
  <LinkIcon sx={iconSx} onClick={handleInsertLink} />
  <InsertEmoticonIcon sx={iconSx} onClick={() => setShowEmoji(!showEmoji)} />
  <CloudOutlinedIcon sx={iconSx} onClick={handleInsertDriveLink} />
  <ImageOutlinedIcon sx={iconSx} onClick={handleImageClick} />
  <PhotoCameraOutlinedIcon sx={iconSx} onClick={handleImageClick} />
  <EditOutlinedIcon sx={iconSx} />
<AddBoxOutlinedIcon
  sx={iconSx}
  onClick={() => setOpenTemplateDialog(true)}
/>
</Stack>

{showEmoji && (
  <Box sx={{
    mt: 1,
    p: 1,
    border: "1px solid #E0E0E0",
    borderRadius: 2,
    display: "flex",
    gap: 1,
    bgcolor: "#fff"
  }}>
    {["🙂","👍","🙏","😊","✔️","🎉","📩","⭐"].map(e => (
      <Typography
        key={e}
        sx={{ cursor: "pointer", fontSize: 20 }}
        onClick={() => handleEmojiInsert(e)}
      >
        {e}
      </Typography>
    ))}
  </Box>
)}


              {/* Send Button */} 
<Stack
  direction="row"
  justifyContent="flex-end"
  alignItems="center"
  spacing={1}
  mt={1}
>
  {/* Delete Icon */}
<Button
  onClick={handleCancelReply}
  sx={{
    minWidth: "auto",
    p: 0.6,
    borderRadius: "6px",
    "&:hover": { backgroundColor: "#F2F2F2" },
  }}
>
  <img src={DeleteMail} alt="Cancel" style={{ width: 45, height: 45 }} />
</Button>


  {/* Send Button */}
  <Button
    variant="contained"
    onClick={handleSendReply}
    sx={{
      height: 32,            
      px: 2.2,
      fontSize: "13px",
      textTransform: "none",
      bgcolor: "#505050",
      borderRadius: "6px",
      boxShadow: "none",
      "&:hover": {
        bgcolor: "#232323",
        boxShadow: "none",
      },
    }}
  >
    Send
  </Button>
</Stack>

            </Box>
          )}


        </Box>

        {/* RIGHT PANEL: PROPERTIES SIDEBAR */}
        <Box flex={1} bgcolor="#FAFAFA" p={3} borderRadius={2} border="1px solid #E0E0E0">
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{ ...ticketDetailsTabsSx, mb: 3 }}
          >
            <Tab label="Ticket Details" />
            <Tab label="Timeline" />
          </Tabs>

          {tab === 0 ? (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" fontWeight={500} mb={2}>Details</Typography>
                <DetailRow label="Ticket ID" value={ticket.ticket_no} color="#03070fff" />
                <DetailRow label="Lab Name" value={ticket.lab_name} />
                <DetailRow label="Subject" value={ticket.subject} />
                <DetailRow label="Created Date" value={dayjs(ticket.created_at).format("DD/MM/YYYY")} />
                <DetailRow label="Requested By" value={ticket.requested_by} />
                <DetailRow label="Department" value={ticket.department_name} />
              </Box>

              <Divider />

<Box>
  <Typography variant="subtitle2" fontWeight={700} mb={2}>
    Properties
  </Typography>

  <Box sx={propertyContainerSx}>

    {/* TYPE (NEW FIELD) */}
<TextField
  select
  label="Type"
  value={type}
  onChange={(e) => setType(e.target.value)}
  fullWidth
  size="small"
  sx={propertyFieldSx}
  InputLabelProps={{ sx: floatingLabelSx }}
  SelectProps={{
    MenuProps: propertyMenuProps,
  }}
>
  {ticketTypes.map((option) => (
    <MenuItem
      key={option}
      value={option}
      sx={{
        fontSize: "13px",
        borderRadius: "8px",
        mb: 0.5,
        px: 1.5,
        py: 1,

        // Selected look (like screenshot)
        ...(type === option && {
          backgroundColor: "#E0E0E0",
        }),

        "&:hover": {
          backgroundColor: "#EAEAEA",
        },
      }}
    >
      {option}
    </MenuItem>
  ))}
</TextField>


    {/* STATUS */}
<TextField
  select
  label="Status"
  value={status}
  onChange={(e) => setStatus(e.target.value as TicketStatus)}
  fullWidth
  size="small"
  sx={propertyFieldSx}
  InputLabelProps={{ sx: floatingLabelSx }}
>
  {["new", "pending", "resolved", "closed"].map((s) => (
    <MenuItem key={s} value={s}>
      <Chip
        label={s.charAt(0).toUpperCase() + s.slice(1)}
        sx={statusChipSx(s)}
      />
    </MenuItem>
  ))}
</TextField>


    {/* PRIORITY (Reusing your priorityChipSx logic) */}
    <TextField
      select
      label="Priority"
      value={priority}
      onChange={(e) => setPriority(e.target.value as TicketPriority)}
      fullWidth
      size="small"
      sx={propertyFieldSx}
      InputLabelProps={{ sx: floatingLabelSx }}
    >
      {["low", "medium", "high"].map((p) => (
        <MenuItem key={p} value={p}>
          <Chip
            label={p.charAt(0).toUpperCase() + p.slice(1)}
            sx={priorityChipSx(p)}
          />
        </MenuItem>
      ))}
    </TextField>

    {/* ASSIGN TO WITH AVATAR */}
    <TextField
      select
      label="Assign To"
      value={assignTo}
onChange={(e) => {
  const value = e.target.value;
  setAssignTo(value === "" ? "" : Number(value));
}}
      fullWidth
      size="small"
      sx={propertyFieldSx}
      InputLabelProps={{ sx: floatingLabelSx }}
    >
      {employees.map((emp) => (
        <MenuItem key={emp.id} value={emp.id}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar sx={{ width: 24, height: 24, fontSize: 11 }}>
              {emp.emp_name?.[0]}
            </Avatar>
            <Typography fontSize={13}>{emp.emp_name}</Typography>
          </Stack>
        </MenuItem>
      ))}
    </TextField>

  </Box>
</Box>


              <Button
                variant="contained"
                fullWidth
                onClick={handleUpdate}
                disabled={updating}
                sx={{ bgcolor: "#505050", py: 1.5, borderRadius: 2, '&:hover': { bgcolor: "#232323" } }}
              >
                {updating ? <CircularProgress size={24} color="inherit" /> : "Update"}
              </Button>
            </Stack>
          ) : (
            <Box>
              {ticket.timeline?.map((item) => (
                <Box key={item.id} sx={{ borderLeft: '2px solid #5a8aea', pl: 2, mb: 3 }}>
                  <Typography variant="body2" fontWeight={700}>{item.action}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    By {item.done_by_name} • {dayjs(item.created_at).format("DD MMM, hh:mm A")}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
      <Dialog
        open={previewOpen}
        onClose={handlePreviewClose}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ position: "relative", p: 2 }}>

          <IconButton
            onClick={handlePreviewClose}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>

          {previewFile && (
            <>
              {previewFile.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                <Box
                  component="img"
                  src={previewFile}
                  sx={{ width: "100%", borderRadius: 1 }}
                />
              ) : (
                <Box
                  component="iframe"
                  src={previewFile}
                  sx={{ width: "100%", height: "70vh", border: "none" }}
                />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

{/*   #################  dailog to select the templates from the popup ################ */}
<Dialog
  open={openTemplateDialog}
  onClose={() => setOpenTemplateDialog(false)}
  maxWidth="sm"
  fullWidth
>
  <DialogContent sx={{ p: 3 }}>

    {/* Header */}
    <Typography fontWeight={700} fontSize={16} mb={2}>
      Insert Email Template
    </Typography>

    <Typography fontSize={13} color="#8A8A8A" mb={2}>
      Select Email Template
    </Typography>

    {/* Template List */}
    <Stack spacing={1.5}>
      {templates.map((tpl: any) => {
        const isSelected = selectedTemplate?.id === tpl.id;

        return (
          <Box
            key={tpl.id}
            sx={{
              border: isSelected ? "1px solid #E97B5A" : "1px solid #E6E6E6",
              borderRadius: "10px",
              p: 2,
              cursor: "pointer",
              backgroundColor: isSelected ? "#FFF7F4" : "#FAFAFA",
            }}
            onClick={() => setSelectedTemplate(tpl)}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              {/* Radio */}
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: "2px solid #E97B5A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isSelected && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "#E97B5A",
                    }}
                  />
                )}
              </Box>

              {/* Text */}
              <Box flex={1}>
                <Typography fontWeight={600} fontSize={14}>
                  {tpl.audience_name}
                </Typography>

                <Typography fontSize={12} color="#8A8A8A">
                  {tpl.subject}
                </Typography>
              </Box>

              {/* Eye Icon */}
<IconButton
  onClick={async (e) => {
    e.stopPropagation();

    try {
      const fullTemplate = await TemplateService.getTemplateById(
        "mail",
        String(tpl.id)
      );

      // pass backend data directly
      setViewTemplateData({
        ...fullTemplate,
        type: "mail", // IMPORTANT → tells modal it's an email template
      });

      setViewTemplateOpen(true);
    } catch (err) {
      console.error("Failed to load template", err);
    }
  }}
>
  <Visibility fontSize="small" sx={{ color: "#5A8AEA" }} />
</IconButton>


            </Stack>
          </Box>
        );
      })}
    </Stack>

    {/* Footer */}
    <Stack direction="row" justifyContent="flex-end" spacing={1.5} mt={3}>
      <Button
        variant="outlined"
        onClick={() => setOpenTemplateDialog(false)}
        sx={{ color: "#505050", borderColor:"#505050", "&:hover": { color: "#232323", borderColor:"#232323" } }}
      >
        Cancel
      </Button>

      <Button
        variant="contained"
        disabled={!selectedTemplate}
        sx={{ bgcolor: "#505050", "&:hover": { bgcolor: "#232323" } }}
        onClick={() => {
          if (!selectedTemplate) return;

const plainText = convertHtmlToText(selectedTemplate.body || "");

setReplyMessage(prev => prev + "\n\n" + plainText);


          if (!replySubject) {
            setReplySubject(selectedTemplate.subject || "");
          }

          setOpenTemplateDialog(false);
          setSelectedTemplate(null);
        }}
      >
        Insert
      </Button>
    </Stack>

  </DialogContent>
</Dialog>

{/*   #################  dailog to preview the templates from the popup ################ */}

<NewTemplateModal
  open={viewTemplateOpen}
  onClose={() => setViewTemplateOpen(false)}
  onSave={() => {}}         
  initialData={viewTemplateData}
  mode="view"                
/>


   {/* Hidden Inputs for Attachments */}
    <input
      type="file"
      ref={fileInputRef}
      hidden
      onChange={handleFileSelected}
    />

    <input
      type="file"
      accept="image/*"
      ref={imageInputRef}
      hidden
      onChange={handleImageSelected}
    />
    </Box>
  );
};

const DetailRow = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <Box display="flex" justifyContent="space-between" mb={1.5}>
    <Typography variant="body2" color="text.secondary">{label} :</Typography>
    <Typography variant="body2" fontWeight={600} sx={{ color: color || 'inherit' }}>{value}</Typography>
  </Box>

);

const PropertyField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Box mb={2}>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{label}</Typography>
    {children}
  </Box>
);

export default TicketView; 