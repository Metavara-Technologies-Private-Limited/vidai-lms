import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import {
  ticketViewWrapperSx,
  ticketViewHeaderSx,
  ticketBackButtonSx,
  replyToolbarIconSx,
} from "../../../styles/Settings/Tickets.styles";

import TicketContentPanel from "../Menus/TicketContentPanel";
import TemplateService from "../../../services/templates.api";
import TicketDailog from "../Menus/TicketDailogs";

import {
  Box,
  Typography,
  Button,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import BackwardIcon from "../../../assets/icons/Backward_icon.svg";
import { ticketsApi, clinicsApi } from "../../../services/tickets.api";
import type {
  TicketDetail,
  TicketStatus,
  TicketPriority,
  EmailTemplate,
} from "../../../types/tickets.types";
import type { Employee, LeadEmailPayload } from "../../../services/leads.api";
import { LeadEmailAPI, LeadAPI } from "../../../services/leads.api";
import { toast } from "react-toastify";
import TicketPropertiesSidebar from "../Menus/TicketPropertiesSidebar";

const FILE_BASE_URL = "http://127.0.0.1:8000";

const ticketTypes = [
  "Question",
  "Bugs",
  "Problems",
  "Incident",
  "Custom Integration",
  "Login creation",
];

type Lead = {
  id: string;
  full_name?: string;
  email?: string;
};

const TicketView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
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
  const [replyTo, setReplyTo] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [replySubject, setReplySubject] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [type, setType] = useState<string>("Question");
  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [viewTemplateOpen, setViewTemplateOpen] = useState(false);
  const [viewTemplateData, setViewTemplateData] =
    useState<EmailTemplate | null>(null);

  type TicketEmployeeApi = {
    id: number;
    emp_name: string;
    emp_type: string;
    department_name?: string;
  };

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [ticketData, empData, leadsData] = await Promise.all([
        ticketsApi.getTicketById(id),
        clinicsApi.getClinicEmployees("1"),
        LeadAPI.list(),
      ]);

      setTicket(ticketData);
      setLeads(leadsData);

      // ✅ Normalize employee type
      const normalizedEmployees: Employee[] = (
        empData as TicketEmployeeApi[]
      ).map((emp) => ({
        id: emp.id,
        emp_name: emp.emp_name,
        emp_type: emp.emp_type,
        department_name: emp.department_name ?? "",
      }));

      setEmployees(normalizedEmployees);

      // Sync local states with DB response
      setStatus(ticketData.status);
      setPriority(ticketData.priority);
      setAssignTo(ticketData.assigned_to || "");
      setDescription(ticketData.description);
    } catch {
      setError("Failed to load ticket details from server.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!openTemplateDialog) return;

    const loadTemplates = async () => {
      try {
        const response = await TemplateService.getTemplates("mail");

        // ✅ Define API response shape (instead of using any)
        type TemplateApiItem = {
          id: string | number;
          name: string;
          subject: string;
          body?: string;
        };

        const templateList: TemplateApiItem[] = Array.isArray(response)
          ? response
          : (response?.results ?? []);

        // ✅ Normalize into Ticket EmailTemplate type
        const normalized: EmailTemplate[] = templateList.map((t) => ({
          id: t.id,
          audience_name: t.name,
          subject: t.subject,
          email_body: t.body ?? "",
          body: t.body,
        }));

        setTemplates(normalized);
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
    setReplyTo([]);
  }, [ticket]);

  //  File Preview Handlers
  const handlePreviewOpen = (file: string) => {
    const fullUrl = file.startsWith("http") ? file : `${FILE_BASE_URL}${file}`;

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

    if (
      status !== ticket.status ||
      priority !== ticket.priority ||
      assignTo !== (ticket.assigned_to || "") ||
      type !== ticket.type
    ) {

      await ticketsApi.updateTicketStatus(id, {
        status,
        priority,
        assigned_to: assignTo || "",
        type
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
  } catch {
    const msg = "Failed to update ticket.";
    setError(msg);
    toast.error(msg);
  } finally {
    setUpdating(false);
  }
};

  const handleSendReply = async () => {
    // No recipients selected
    if (replyTo.length === 0) {
      toast.warn("No recipient in leads.");
      return;
    }

    if (!replyMessage.trim()) {
      toast.warn("Reply message cannot be empty.");
      return;
    }

    try {
      // Send email to each recipient and save to their lead email history
      const sendPromises = replyTo.map(async (recipientEmail) => {
        // Find the lead with this email
        const lead = leads.find(
          (l) => l.email?.toLowerCase() === recipientEmail.toLowerCase(),
        );

        if (!lead) {
          console.warn(`Lead not found for email: ${recipientEmail}`);
          return;
        }

        // Create email payload for LeadEmailAPI
        const emailPayload: LeadEmailPayload = {
          lead: lead.id,
          subject: replySubject || "Reply",
          email_body: replyMessage,
          send_now: true,
        };

        // Send email and save to lead's email history
        await LeadEmailAPI.sendNow(emailPayload);
      });

const toastId = toast.loading("Sending reply...");

await Promise.all(sendPromises);

toast.update(toastId, {
  render: "Reply sent successfully!",
  type: "success",
  isLoading: false,
  autoClose: 3000,
});

      setReplyMessage("");
      setReplyTo([]);
      setOpenReply(false);
      setReplySubject("");
    } catch (err) {
      console.error("Failed to send reply:", err);
      toast.error("Failed to send reply. Please try again.");
    }
  };

  const handleCancelReply = () => {
    setOpenReply(false);
    setReplyMessage("");
    setReplyTo([]);
    setReplySubject("");
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

    setReplyMessage((prev) => prev + `\n📎 Attached: ${file.name}\n`);
  };

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReplyMessage((prev) => prev + `\n🖼 Image: ${file.name}\n`);
  };

  const handleEmojiInsert = (emoji: string) => {
    setReplyMessage((prev) => prev + emoji);
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
      },
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
            <Button size="small" onClick={() => closeToast?.()}>
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
      },
    );
  };

  if (loading)
    return (
      <Box display="flex" justifyContent="center" mt={10}>
        <CircularProgress />
      </Box>
    );
  if (error || !ticket)
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error || "Ticket not found."}
      </Alert>
    );

  return (
    <Box sx={ticketViewWrapperSx}>
      <Stack direction="row" sx={ticketViewHeaderSx}>
        <Button onClick={() => navigate(-1)} sx={ticketBackButtonSx}>
          <img src={BackwardIcon} alt="Back" />
        </Button>

        <Typography fontSize={14} fontWeight={700}>
          {ticket.ticket_no?.replace("TICKET-", "TN-")}
        </Typography>
      </Stack>

      <Box display="flex" gap={4}>
        {/*#####    Ticket Content comes here ################ */}
        <TicketContentPanel
          ticket={ticket}
          description={description}
          setDescription={setDescription}
          handlePreviewOpen={handlePreviewOpen}
          openReply={openReply}
          setOpenReply={setOpenReply}
          replyProps={{
            openReply,
            setOpenReply,
            replyTo,
            setReplyTo,
            replySubject,
            setReplySubject,
            replyMessage,
            setReplyMessage,
            anchorEl,
            setAnchorEl,
            showEmoji,
            setShowEmoji,
            handleSendReply,
            handleCancelReply,
            handleAttachClick,
            handleInsertLink,
            handleInsertDriveLink,
            handleImageClick,
            handleEmojiInsert,
            setOpenTemplateDialog,
            iconSx: replyToolbarIconSx,
          }}
        />

        {/* RIGHT PANEL: PROPERTIES SIDEBAR */}
        <TicketPropertiesSidebar
          ticket={ticket}
          employees={employees}
          tab={tab}
          setTab={setTab}
          type={type}
          setType={setType}
          status={status}
          setStatus={setStatus}
          priority={priority}
          setPriority={setPriority}
          assignTo={assignTo}
          setAssignTo={setAssignTo}
          handleUpdate={handleUpdate}
          updating={updating}
          ticketTypes={ticketTypes}
        />
      </Box>
      {/*   #################  dailogs used in ticket view page    ################ */}
      <TicketDailog
        previewOpen={previewOpen}
        previewFile={previewFile}
        handlePreviewClose={handlePreviewClose}
        openTemplateDialog={openTemplateDialog}
        templates={templates}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        setOpenTemplateDialog={setOpenTemplateDialog}
        onInsertTemplate={(selectedTemplate) => {
          if (!selectedTemplate) return;

          const templateContent = selectedTemplate.body || "";
          setReplyMessage((prev) => prev + "<br/><br/>" + templateContent);
          if (!replySubject) {
            setReplySubject(selectedTemplate.subject || "");
          }

          setOpenTemplateDialog(false);
          setSelectedTemplate(null);
        }}
        viewTemplateOpen={viewTemplateOpen}
        viewTemplateData={viewTemplateData}
        setViewTemplateOpen={setViewTemplateOpen}
        setViewTemplateData={setViewTemplateData}
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

export default TicketView;
