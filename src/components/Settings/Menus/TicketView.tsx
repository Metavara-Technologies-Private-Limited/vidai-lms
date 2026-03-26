import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
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
import { LeadAPI, LeadEmailAPI } from "../../../services/leads.api";
import type { Employee } from "../../../services/leads.api";
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

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const uniqueEmails = (items: string[]) =>
  Array.from(new Set(items.map((mail) => mail.trim().toLowerCase())));

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const getString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const getNumberString = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? trimmed : "";
};

const getNested = (source: unknown, keys: string[]) => {
  const record = asRecord(source);
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }
  return undefined;
};

const unwrapApiData = (value: unknown) => {
  const record = asRecord(value);
  if (record.results && typeof record.results === "object") {
    return record.results;
  }
  if (record.data && typeof record.data === "object") {
    return record.data;
  }
  return value;
};

const extractClinicEmails = (clinicData: unknown): string[] => {
  const record = asRecord(unwrapApiData(clinicData));
  const directCandidates = [
    getString(record.email),
    getString(record.clinic_email),
    getString(record.reply_email),
    getString(record.contact_email),
  ].filter((mail) => mail && isEmail(mail));

  const nestedEmails = Array.isArray(record.emails)
    ? (record.emails as unknown[])
        .map((item) => getString(item))
        .filter((mail) => mail && isEmail(mail))
    : [];

  return uniqueEmails([...directCandidates, ...nestedEmails]);
};

const extractEmployeeEmail = (employeeData: unknown): string => {
  const record = asRecord(employeeData);
  const userRecord = asRecord(record.user);

  const candidates = [
    getString(record.email),
    getString(record.emp_email),
    getString(record.user_email),
    getString(record.official_email),
    getString(userRecord.email),
    getString(userRecord.username),
  ];

  const firstValid = candidates.find((mail) => mail && isEmail(mail));
  return firstValid || "";
};

const resolveClinicId = (ticketData: unknown): string => {
  const ticketRecord = asRecord(ticketData);
  const localClinicId = getNumberString(localStorage.getItem("clinic_id"));
  if (localClinicId) return localClinicId;

  const fromTicket =
    getNumberString(
      getNested(ticketRecord, ["clinic_id", "clinic", "lab_id"]),
    ) || "";
  if (fromTicket) return fromTicket;

  return "1";
};

const extractApiErrorMessage = (data: unknown): string | null => {
  if (!data) return null;

  if (typeof data === "string") return data;

  const record = asRecord(data);
  const detail = getString(record.detail);
  if (detail) return detail;

  const message = getString(record.message);
  if (message) return message;

  const error = getString(record.error);
  if (error) return error;

  const nonFieldErrors = record.non_field_errors;
  if (Array.isArray(nonFieldErrors) && nonFieldErrors.length > 0) {
    const first = getString(nonFieldErrors[0]);
    if (first) return first;
  }

  return null;
};

const TicketView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leads, setLeads] = useState<Array<{ id: string; email?: string }>>([]);
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
  const [replyFrom, setReplyFrom] = useState("");
  const [replyTo, setReplyTo] = useState<string[]>([]);
  const [replyCc, setReplyCc] = useState<string[]>([]);
  const [replyBcc, setReplyBcc] = useState<string[]>([]);
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
    email?: string;
    emp_email?: string;
    user_email?: string;
    official_email?: string;
    user?: {
      email?: string;
      username?: string;
    };
  };

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const ticketData = await ticketsApi.getTicketById(id);
      const clinicId = resolveClinicId(ticketData);

      const [empData, leadsData] = await Promise.all([
        clinicsApi.getClinicEmployees(clinicId),
        LeadAPI.list(),
      ]);

      setTicket(ticketData);
      setLeads(Array.isArray(leadsData) ? leadsData : []);

      try {
        const clinicData = await clinicsApi.getClinicDetail(clinicId);
        const clinicEmails = extractClinicEmails(clinicData);

        setReplyFrom((prev) => {
          const prevNormalized = prev.trim().toLowerCase();
          if (prevNormalized && clinicEmails.includes(prevNormalized))
            return prev;
          return clinicEmails[0] || "";
        });
      } catch {
        setReplyFrom("");
      }

      // ✅ Normalize employee type
      const normalizedEmployees: Employee[] = (
        empData as TicketEmployeeApi[]
      ).map((emp) => ({
        id: emp.id,
        emp_name: emp.emp_name,
        emp_type: emp.emp_type,
        department_name: emp.department_name ?? "",
        email: extractEmployeeEmail(emp),
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
    setReplyCc([]);
    setReplyBcc([]);
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
          type,
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
    if (!id) return;

    // No recipients selected
    if (replyTo.length === 0) {
      toast.warn("No recipient in leads.");
      return;
    }

    if (!replyMessage.trim()) {
      toast.warn("Reply message cannot be empty.");
      return;
    }

    if (!replyFrom.trim()) {
      toast.warn("Clinic sender email is required in From.");
      return;
    }

    const toastId = toast.loading("Sending reply...");

    try {
      await ticketsApi.sendTicketReply(id, {
        subject: replySubject || "Reply",
        message: replyMessage,
        to: replyTo,
        cc: replyCc,
        bcc: replyBcc,
      });

      toast.update(toastId, {
        render: "Reply sent successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      setReplyMessage("");
      setReplyTo([]);
      setReplyCc([]);
      setReplyBcc([]);
      setOpenReply(false);
      setReplySubject("");
    } catch (err) {
      let failureMessage = "Failed to send reply. Please try again.";

      if (axios.isAxiosError(err)) {
        const backendMessage = extractApiErrorMessage(err.response?.data);
        if (backendMessage) {
          failureMessage = backendMessage;
        } else if (err.response?.status === 500) {
          failureMessage =
            "Server error while sending reply. Please check backend logs.";
        }

        if (err.response?.status === 500) {
          const allRecipients = Array.from(
            new Set(
              [...replyTo, ...replyCc, ...replyBcc].map((mail) =>
                mail.toLowerCase(),
              ),
            ),
          );

          const leadMatches = allRecipients
            .map((email) =>
              leads.find((lead) => lead.email?.trim().toLowerCase() === email),
            )
            .filter((lead): lead is { id: string; email?: string } =>
              Boolean(lead),
            );

          if (
            leadMatches.length === allRecipients.length &&
            leadMatches.length > 0
          ) {
            try {
              await Promise.all(
                leadMatches.map((lead) =>
                  LeadEmailAPI.sendNow({
                    lead: lead.id,
                    subject: replySubject || "Reply",
                    email_body: replyMessage,
                    sender_email: replyFrom || null,
                  }),
                ),
              );

              toast.update(toastId, {
                render: "Reply sent successfully!",
                type: "success",
                isLoading: false,
                autoClose: 3000,
              });

              setReplyMessage("");
              setReplyTo([]);
              setReplyCc([]);
              setReplyBcc([]);
              setOpenReply(false);
              setReplySubject("");
              return;
            } catch (fallbackError) {
              console.error("Fallback lead email send failed:", fallbackError);
              failureMessage =
                "Reply send failed in both ticket and lead mail APIs.";
            }
          } else {
            failureMessage =
              "Reply endpoint failed, and one or more recipients are not mapped to leads for fallback sending.";
          }
        }
      }

      console.error("Failed to send reply:", err);
      toast.update(toastId, {
        render: failureMessage,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  const handleCancelReply = () => {
    setOpenReply(false);
    setReplyMessage("");
    setReplyTo([]);
    setReplyCc([]);
    setReplyBcc([]);
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

  const selectedAssigneeId =
    assignTo === "" ? (ticket.assigned_to ?? null) : assignTo;
  const selectedAssignee = !selectedAssigneeId
    ? undefined
    : employees.find((emp) => emp.id === Number(selectedAssigneeId));

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
          assigneeName={
            selectedAssignee?.emp_name || ticket.assigned_to_name || ""
          }
          assigneeEmail={selectedAssignee?.email || ""}
          replyProps={{
            openReply,
            setOpenReply,
            fromEmail: replyFrom,
            setFromEmail: setReplyFrom,
            replyTo,
            setReplyTo,
            replyCc,
            setReplyCc,
            replyBcc,
            setReplyBcc,
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
          selectedAssigneeEmail={selectedAssignee?.email || ""}
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
