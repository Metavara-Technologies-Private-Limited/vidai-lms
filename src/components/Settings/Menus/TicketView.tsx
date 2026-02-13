import { useState } from "react";
import {
  Box,
  Typography,  Dialog, Divider,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  Chip,
  TextField,
  Tabs,
  Tab,
  MenuItem,
  Select, FormControl, InputLabel, OutlinedInput
} from "@mui/material";
import { TICKETS_MOCK } from "./mockData";
import type { Template } from "../templateMockData";
import { TEMPLATES_MOCK_DATA } from '../templateMockData';
import { useParams } from "react-router-dom";
import BackwardIcon from "../../../assets/icons/Backward_icon.svg";
import DeleteIcon from "../../../assets/icons/Delete_icon.svg";
import { useNavigate } from "react-router-dom";
import FormatSizeIcon from "@mui/icons-material/FormatSize";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import LinkIcon from "@mui/icons-material/Link";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import { useRef } from "react";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Menu from "@mui/material/Menu";
import Reply_Mail from "../../../assets/icons/Reply_Ticket_Mail.svg";
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import { useDispatch } from "react-redux";
import { setSelectedTemplate } from "../../../store/emailTemplateSlice";

const TicketView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
const dispatch = useDispatch();

const initialTicket = TICKETS_MOCK.find((t) => t.ticketNo === id);
const [ticket, setTicket] = useState(initialTicket);

  //  ALL HOOKS FIRST
  const [tab, setTab] = useState(0);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyTo, setReplyTo] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");

  const [status, setStatus] = useState(ticket?.status ?? "New");
  const [priority, setPriority] = useState(ticket?.priority ?? "Low");
  const [assignTo, setAssignTo] = useState(ticket?.assignedTo ?? "");
  const [type, setType] = useState("Question");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [sendAnchorEl, setSendAnchorEl] = useState<null | HTMLElement>(null);
  const openSendMenu = Boolean(sendAnchorEl);
const [templateOpen, setTemplateOpen] = useState(false);
const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
const [previewOpen, setPreviewOpen] = useState(false);
const [emojiOpen, setEmojiOpen] = useState(false);
const [scheduleTime, setScheduleTime] = useState<string | null>(null);

const assigneeList = Array.from(
  new Set(TICKETS_MOCK.map(t => t.assignedTo))
);

const handleInsertTemplate = (template: Template | null) => {
  if (!template) return;

  const content = template.content || template.body || "";

  dispatch(
    setSelectedTemplate({
      subject: template.subject,
      content,
    })
  );

  setPreviewOpen(false);
  setTemplateOpen(false);
};


  //  ONLY AFTER ALL HOOKS
  if (!ticket) {
    return (
      <Typography p={3} color="error">
        Ticket not found
      </Typography>
    );
  }

  return (
    <Box display="flex" gap={3}>
      {/* LEFT: MESSAGE THREAD */}
      <Box flex={1} bgcolor="#fafafa" p={3} borderRadius={2}>
        {/* BACK + TICKET ID */}
        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
          <Box
            component="img"
            src={BackwardIcon}
            alt="Back"
            sx={{ cursor: "pointer", width: 40, height: 40 }}
            onClick={() => navigate(-1)}
          />

          <Typography variant="h6" fontWeight={600}>
            {ticket.ticketNo}
          </Typography>
        </Box>
<Box
    sx={{
      backgroundColor: "#ffffff",
      p: 3, // Increased padding to match expected image
      borderRadius: 2,
      mt: 2,
      boxShadow: "0px 2px 8px rgba(0,0,0,0.05)"
    }}
  >
    {/* NEW HEADER: AVATAR + NAME (from requestedBy) */}
    <Box display="flex" alignItems="center" gap={2} mb={2}>
      <Box
        component="img"
        src={`https://ui-avatars.com/api/?name=${ticket.requestedBy}&background=random`} // Dynamic Avatar
        sx={{ width: 44, height: 44, borderRadius: "50%" }}
      />
      <Box>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#232323" }}>
          {ticket.requestedBy}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {ticket.createdDate} | Ticket Requestor
        </Typography>
      </Box>
    </Box>

    <Typography 
      variant="body1" 
      sx={{ color: "#454545", lineHeight: 1.6, mb: 2 }}
    >
      The laboratory report has not been received within the expected
      turnaround time. Kindly provide an update.
    </Typography>

            {/* Attachments */}

  <Box display="flex" gap={2}>
    <Chip label="ivf_report_2024.pdf" />
    <Chip label="body_checkup_2024.doc" />
  </Box>
</Box>
        {/* Reply */}
        {!showReplyBox && (
          <Box mt={4}>
<img src={Reply_Mail} onClick={() => setShowReplyBox(true)}/>
          </Box>
        )}

        {showReplyBox && (
          <Box
            mt={4}
            p={2}
            border="1px solid #E0E0E0"
            borderRadius={2}
            bgcolor="#fff"
          >
 {/* HIDDEN FILE INPUTS */}
 <input
  ref={fileInputRef}
  type="file"
  hidden
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) {
      setReplyBody(prev => prev + `\n📎 Attachment: ${file.name}`);
    }
  }}
/>


<input
  ref={imageInputRef}
  type="file"
  accept="image/*"
  hidden
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) {
      setReplyBody(prev => prev + `\n🖼 Image: ${file.name}`);
    }
  }}
/>


            {/* TO */}
            <TextField
              fullWidth
              label="To:"
              variant="standard" 
              value={replyTo}
              InputProps={{ disableUnderline: true }}
              onChange={(e) => setReplyTo(e.target.value)}
              size="small"
              sx={{ mb: 2 }}
            />
<Divider sx={{ mt: -2 }} />

            {/* SUBJECT */}
            <TextField
              fullWidth
              label="Subject:"
              variant="standard" 
              InputProps={{ disableUnderline: true }}
              value={replySubject}
              onChange={(e) => setReplySubject(e.target.value)}
              size="small"
              sx={{ mb: 2 }}
            />
<Divider sx={{ mt: -2, mb:2}} />

{/* TOOLBAR */}
<Box
  display="flex"
  alignItems="center"
  gap={1.5}
  mb={1}
  color="#616161"
>
  {/* Paragraph spacing */}
  <FormatSizeIcon
    fontSize="small"
    sx={{ cursor: "pointer" }}
    onClick={() => setReplyBody(prev => prev + "\n\n")}
  />

  {/* Attachment */}
  <AttachFileIcon
    fontSize="small"
    sx={{ cursor: "pointer" }}
    onClick={() => fileInputRef.current?.click()}
  />

  {/* Link */}
  <LinkIcon
    fontSize="small"
    sx={{ cursor: "pointer" }}
    onClick={() => {
      const url = prompt("Enter URL");
      const text = prompt("Enter display text");
      if (url) {
        setReplyBody(prev => prev + `\n${text || url} (${url})`);
      }
    }}
  />

  {/* Emoji */}
  <EmojiEmotionsOutlinedIcon
    fontSize="small"
    sx={{ cursor: "pointer" }}
    onClick={() => setEmojiOpen(prev => !prev)}
  />

  {/* Image */}
  <ImageOutlinedIcon
    fontSize="small"
    sx={{ cursor: "pointer" }}
    onClick={() => imageInputRef.current?.click()}
  />

  {/* Drive */}
<CloudOutlinedIcon
  fontSize="small"
  sx={{ cursor: "pointer" }}
  onClick={() =>
    window.open("https://drive.google.com", "_blank")
  }
/>


  {/* Schedule */}
  <ScheduleOutlinedIcon
    fontSize="small"
    sx={{ cursor: "pointer" }}
    onClick={() => {
      const time = prompt("Enter schedule time");
      if (time) setScheduleTime(time);
    }}
  />

  {/* Signature */}
  <EditOutlinedIcon
    fontSize="small"
    sx={{ cursor: "pointer" }}
    onClick={() =>
      setReplyBody(prev =>
        prev +
        "\n\n—\nBest regards,\nCrysta IVF Team"
      )
    }
  />

  {/* Templates */}
  <AddOutlinedIcon
    fontSize="small"
    sx={{ cursor: "pointer" }}
    onClick={() => setTemplateOpen(true)}
  />
</Box>


{emojiOpen && (
  <Box
    sx={{
      border: "1px solid #ddd",
      borderRadius: 2,
      p: 1,
      mb: 1,
      background: "#fff",
      display: "flex",
      flexWrap: "wrap",
      gap: 1,
      maxWidth: 250
    }}
  >
    {["😊","👍","🙏","✔️","🎉","🔥","💡","📅","⭐","❤️","😁","✉️"]
      .map(e => (
        <span
          key={e}
          style={{ cursor: "pointer", fontSize: 18 }}
          onClick={() => {
            setReplyBody(prev => prev + e);
            setEmojiOpen(false);
          }}
        >
          {e}
        </span>
      ))}
  </Box>
)}

            {/* BODY */}
            <TextField
              fullWidth
              multiline
              minRows={6}
              placeholder="Write your message…"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              sx={{ mb: 2 }}
            />
            {scheduleTime && (
  <Typography variant="caption" color="text.secondary">
    Scheduled for: {scheduleTime}
  </Typography>
)}
          </Box>
        )}

                    {/* ACTIONS */}
<Box display="flex" justifyContent="flex-end" gap={1} marginTop={2}>
<Box
  component="img"
  src={DeleteIcon}        
  alt="Delete"
  sx={{
    width: 40,
    height: 40,
    cursor: "pointer",
    opacity: 0.7,
    "&:hover": { opacity: 1 },
  }}
  onClick={() => setShowReplyBox(false)}
/>

<Box display="flex" alignItems="center">

  {/* MAIN SEND BUTTON */}
  <Button
  variant="contained"
  startIcon={<SendOutlinedIcon sx={{ transform: 'rotate(-45deg)', mb: 0.5 }} />} 
  sx={{
    bgcolor: "#505050",
    textTransform: "none", 
    fontWeight: 600,
    borderRadius: "8px", 
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    px: 3,
    "&:hover": { bgcolor: "#232323" },
  }}
  onClick={() => {
    console.log("Send only");
    setReplyBody("");
    setShowReplyBox(false);
  }}
>
  Send
</Button>

  {/* DROPDOWN ARROW */}
  <Button
    variant="contained"
    sx={{
      bgcolor: "#505050",
      "&:hover": { bgcolor: "#232323" },
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      minWidth: 40,
      px: 0,
    }}
    onClick={(e) => setSendAnchorEl(e.currentTarget)}
  >
    <ArrowDropDownIcon />
  </Button>

  {/* DROPDOWN MENU */}
  <Menu
    anchorEl={sendAnchorEl}
    open={openSendMenu}
    onClose={() => setSendAnchorEl(null)}
    anchorOrigin={{ vertical: "top", horizontal: "right" }}
    transformOrigin={{ vertical: "bottom", horizontal: "right" }}
  >
    <MenuItem
      onClick={() => {
        console.log("Send & set Pending");
        setStatus("Pending");
        setSendAnchorEl(null);
        setShowReplyBox(false);
      }}
    >
      Send & set as Pending
    </MenuItem>

    <MenuItem
      onClick={() => {
        console.log("Send & set Resolved");
        setStatus("Resolved");
        setSendAnchorEl(null);
        setShowReplyBox(false);
      }}
    >
      Send & set as Resolved
    </MenuItem>

    <MenuItem
      onClick={() => {
        console.log("Send & set Closed");
        setStatus("Closed");
        setSendAnchorEl(null);
        setShowReplyBox(false);
      }}
    >
      Send & set as Closed
    </MenuItem>
  </Menu>
</Box>

            </Box>
      </Box>

      {/* RIGHT: DETAILS + TIMELINE */}
<Box
  width={390}
  bgcolor="#fafafa"
  p={2}
  borderRadius={1}
>       
<Tabs
  value={tab}
  onChange={(_, v) => setTab(v)}
  TabIndicatorProps={{ style: { display: "none" } }} // ❌ remove underline
  sx={{
    bgcolor: "#f0f0f0",
    borderRadius: 1,
    p: 0.5,
  }}
>
  <Tab
    label="Ticket Details"
    sx={{
      textTransform: "none",
      fontWeight: 500,
      borderRadius: 1,
          minHeight: 32,          // ⬅ reduces height
    px: 2,                  // ⬅ horizontal padding
    py: 0.5, 
      "&.Mui-selected": {
        bgcolor: "#ffffff",
      },
    }}
  />
  <Tab
    label="Timeline"
    sx={{
      textTransform: "none",
      fontWeight: 500,
      borderRadius: 1,
    minHeight: 38,          // ⬅ reduces height
    px: 2,                  // ⬅ horizontal padding
    py: 0.5, 
      marginLeft:10,
      "&.Mui-selected": {
        bgcolor: "#ffffff",
      },
    }}
  />
</Tabs>

<Divider sx={{ my: 2 }} />

        {tab === 0 && (
          <Box mt={2}>
            <Typography fontWeight={600} mb={1}>
              Details
            </Typography>

<Box
  bgcolor="#ffffff"
  p={2}
  borderRadius={1.5}
>
  <Detail label="Ticket ID:" value={ticket.ticketNo} />
  <Detail label="Lab Name:" value={ticket.labName} />
  <Detail label="Created Date:" value={ticket.createdDate} />
  <Detail label="Due Date:" value={ticket.dueDate} />
  <Detail label="Requested By:" value={ticket.requestedBy} />
  <Detail label="Department:" value={ticket.department} />
</Box>
  <Typography mt={2} fontWeight={600}>
  Properties
</Typography>

{/* TYPE */}
<FormControl
  fullWidth
  variant="outlined"
  size="small"          
  sx={{ mt: 2 }}
>
  <InputLabel size="small">Type</InputLabel>

  <Select
    size="small"        
    value={type}
    onChange={(e) => setType(e.target.value)}
    input={<OutlinedInput label="Type" />}
    sx={{
      bgcolor: "#ffffff",
      height: 40,       
    }}
  >
    <MenuItem value="Question">Question</MenuItem>
    <MenuItem value="Issue">Issue</MenuItem>
    <MenuItem value="Request">Request</MenuItem>
  </Select>
</FormControl>

{/* STATUS */}
<FormControl fullWidth variant="outlined" size="small" sx={{ mt: 2 }}>
  <InputLabel size="small">Status</InputLabel>
  <Select
    size="small"
    value={status}
    onChange={(e) => setStatus(e.target.value)}
    input={<OutlinedInput label="Status" />}
    sx={{ bgcolor: "#ffffff", height: 40 }}
  >

    <MenuItem value="New">New</MenuItem>
    <MenuItem value="Pending">Pending</MenuItem>
    <MenuItem value="Resolved">Resolved</MenuItem>
    <MenuItem value="Closed">Closed</MenuItem>
  </Select>
</FormControl>

{/* PRIORITY */}
<FormControl fullWidth variant="outlined" size="small" sx={{ mt: 2 }}>
  <InputLabel size="small">Priority</InputLabel>
  <Select
    size="small"
    value={priority}
    onChange={(e) => setPriority(e.target.value)}
    input={<OutlinedInput label="Priority" />}
    sx={{ bgcolor: "#ffffff", height: 40 }}
  >

    <MenuItem value="Low">Low</MenuItem>
    <MenuItem value="Medium">Medium</MenuItem>
    <MenuItem value="High">High</MenuItem>
  </Select>
</FormControl>

{/* ASSIGN TO */}
<FormControl fullWidth variant="outlined" size="small" sx={{ mt: 2 }}>
  <InputLabel size="small">Assign To</InputLabel>
  <Select
    size="small"
    value={assignTo}
    onChange={(e) => setAssignTo(e.target.value)}
    input={<OutlinedInput label="Assign To" />}
    sx={{ bgcolor: "#ffffff", height: 40 }}
  >
{assigneeList.map(name => (
  <MenuItem key={name} value={name}>
    {name}
  </MenuItem>
))}

  </Select>
</FormControl>



<Button
  fullWidth
  sx={{
    mt: 3,
    backgroundColor: "#505050",
    "&:hover": { backgroundColor: "#232323" }
  }}
  variant="contained"
  onClick={() => {
    if (!ticket) return;

    const updatedTimeline = ticket.timeline.map(entry =>
      entry.type === "assigned"
        ? { ...entry, user: assignTo }
        : entry
    );

    setTicket({
      ...ticket,
      assignedTo: assignTo,
      timeline: updatedTimeline
    });
  }}
>
  Update
</Button>

          </Box>
        )}

        {tab === 1 && (
          <Box mt={2}>
            {/* Ticket received */}
            <TimelineBlock
              title="Ticket received"
              time={ticket.timeline.find((t) => t.type === "received")?.time}
            />

            {/* Assigned */}
            <TimelineBlock
              title={`Assigned to ${
                ticket.timeline.find((t) => t.type === "assigned")?.user || "—"
              }`}
              time={ticket.timeline.find((t) => t.type === "assigned")?.time}
            />

            {/* Resolved */}
            <TimelineBlock
              title="Resolved ticket"
              time={ticket.timeline.find((t) => t.type === "resolved")?.time}
              emptyText="Not yet resolved"
            />
          </Box>
        )}
      </Box>
{/* SINGLE DYNAMIC DIALOG */}
<Dialog
  open={templateOpen || previewOpen}
  onClose={() => {
    setTemplateOpen(false);
    setPreviewOpen(false);
  }}
  fullWidth
  maxWidth={previewOpen ? "md" : "sm"}
>
  <DialogTitle>
    {previewOpen ? previewTemplate?.name : "Select Email Template"}
  </DialogTitle>

  <DialogContent dividers>
    {previewOpen ? (
      /* PREVIEW MODE CONTENT */
      <>
        <Typography fontWeight={600} mb={1}>Subject</Typography>
        <Typography mb={2}>{previewTemplate?.subject}</Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography sx={{ whiteSpace: "pre-line" }}>
          {previewTemplate?.content || previewTemplate?.body || "No content available"}
        </Typography>
      </>
    ) : (
      /* SELECTION MODE CONTENT */
      <List>
        {(TEMPLATES_MOCK_DATA as Template[])
          .filter((t) => t.type === "email")
          .map((template) => (
            <ListItemButton
              key={template.id}
              selected={selectedTemplateId === template.id}
              onClick={() => {
                setSelectedTemplateId(template.id);
                setPreviewTemplate(template);
                setPreviewOpen(true); // Switches to Preview mode
              }}
            >
              <ListItemIcon>
                <Radio checked={selectedTemplateId === template.id} />
              </ListItemIcon>
              <ListItemText primary={template.name} secondary={template.subject} />
            </ListItemButton>
          ))}
      </List>
    )}
  </DialogContent>

<DialogActions>
  <Button 
  variant="outlined"
  onClick={() => {
    setPreviewOpen(false);
    setTemplateOpen(false);
  }}
  sx={{
    textTransform: "none",
    borderRadius: "12px",
    backgroundColor: "#FFFFFF", 
    borderColor: "#505050",    
    color: "#505050",           
    fontWeight: 600,
    px: 3,
    "&:hover": {
      borderColor: "#232323",
      color: "#232323",         
      backgroundColor: "#FFFFFF", 
      boxShadow: "0px 2px 4px rgba(0,0,0,0.05)" 
    },
  }}
>
  Cancel
</Button>
  
  <Button
    variant="contained"
    disabled={!previewTemplate}
    // Using the shared function we created
    onClick={() => handleInsertTemplate(previewTemplate)}
    sx={{backgroundColor:"#505050", "&:hover":{backgroundColor:"#232323"}}}
  >
    Insert
  </Button>
</DialogActions>
</Dialog>

    </Box>
    
  );
};

const Detail = ({ label, value }: { label: string; value: string }) => (
  <Box display="flex" justifyContent="space-between" mt={1}>
    <Typography color="text.secondary">{label}</Typography>
    <Typography fontWeight={500}>{value}</Typography>
  </Box>
);

const TimelineBlock = ({
  title,
  time,
  emptyText,
}: {
  title: string;
  time?: string;
  emptyText?: string;
}) => (
  <Box mb={3}>
    <Typography fontWeight={600}>{title}</Typography>
    <Typography variant="body2" color="text.secondary">
      {time || emptyText || "—"}
    </Typography>
  </Box>
);

export default TicketView;
