import { useState } from "react";
import {
  Box,
  Typography,
  Divider,
  Button,
  Chip,
  TextField,
  Tabs,
  Tab,
  MenuItem,
  Select, FormControl, InputLabel, OutlinedInput
} from "@mui/material";
import { TICKETS_MOCK } from "./mockData";
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

const TicketView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const ticket = TICKETS_MOCK.find((t) => t.ticketNo === id);

  // ✅ ALL HOOKS FIRST
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

  // ✅ ONLY AFTER ALL HOOKS
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
    p: 2,
    borderRadius: 1.5,
    mt: 2,
  }}
>
            <Typography mt={1}>
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
            <Button
            sx={{ backgroundColor:"#505050",
                "&:hover":{backgroundColor:"#232323"}
            }}
             variant="contained" onClick={() => setShowReplyBox(true)}>
              Reply
            </Button>
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
        if (e.target.files?.[0]) {
          alert(`File attached: ${e.target.files[0].name}`);
        }
      }}
    />

    <input
      ref={imageInputRef}
      type="file"
      accept="image/*"
      hidden
      onChange={(e) => {
        if (e.target.files?.[0]) {
          alert(`Image selected: ${e.target.files[0].name}`);
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
  {/* Text size toggle */}
  <FormatSizeIcon
    fontSize="small"
    sx={{ cursor: "pointer" }}
    onClick={() =>
      setReplyBody((prev) => prev + "\n\n")
    }
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
      const url = prompt("Enter link");
      if (url) setReplyBody((prev) => prev + `\n${url}`);
    }}
  />

  {/* Emoji */}
  <EmojiEmotionsOutlinedIcon
    fontSize="small"
    sx={{ cursor: "pointer" }}
    onClick={() =>
      setReplyBody((prev) => prev + " 😊")
    }
  />

  {/* Image */}
  <ImageOutlinedIcon
    fontSize="small"
    sx={{ cursor: "pointer" }}
    onClick={() => imageInputRef.current?.click()}
  />

  {/* Google Drive */}
  <CloudOutlinedIcon
    fontSize="small"
    sx={{ cursor: "pointer" }}
    onClick={() =>
      alert("Connect to Google Drive (coming soon)")
    }
  />

  {/* Schedule */}
  <ScheduleOutlinedIcon
    fontSize="small"
    sx={{ cursor: "pointer" }}
    onClick={() =>
      alert("Schedule send – feature coming soon")
    }
  />

  {/* Edit / Signature */}
  <EditOutlinedIcon
    fontSize="small"
    sx={{ cursor: "pointer" }}
    onClick={() =>
      setReplyBody(
        (prev) =>
          prev +
          "\n\n—\nCrysta IVF, Bangalore"
      )
    }
  />

  {/* More */}
  <AddOutlinedIcon
    fontSize="small"
    sx={{ cursor: "pointer" }}
    onClick={() => alert("More options")}
  />
</Box>


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
    //disabled={!replyBody.trim()}
    sx={{
      bgcolor: "#505050",
      "&:hover": { bgcolor: "#232323" },
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
      px: 3,
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
  size="small"          // ⬅ IMPORTANT
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

    <MenuItem value="John Grant">John Grant</MenuItem>
    <MenuItem value="Emily Carter">Emily Carter</MenuItem>
  </Select>
</FormControl>



            <Button fullWidth 
            sx={{ mt: 3, backgroundColor:"#505050", 
            "&:hover":{backgroundColor:"#232323"}
            }} variant="contained">
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
