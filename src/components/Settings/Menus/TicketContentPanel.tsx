import {
  Box,
  Typography,
  Divider,
  Avatar,
  Stack,
  TextField,
  Button,
} from "@mui/material";
import ReplyMail from "../../../assets/icons/Reply_Ticket_Mail.svg";
import dayjs from "dayjs";
import TicketReplyEditor from "./TicketReplyEditor";
import type { TicketReplyEditorProps } from "./TicketReplyEditor";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../../store";
import { addEmail } from "../../../store/emailHistorySlice";
import { selectUser } from "../../../store/authSlice";
import type {
  TicketDetail,
  TicketDocument,
} from "../../../types/tickets.types";
import { selectLeads, fetchLeads } from "../../../store/leadSlice";
import { useEffect, useMemo, useState } from "react";
import { ticketsApi } from "../../../services/tickets.api";
import { toast } from "react-toastify";
interface Lead {
  id: string;
  patient_name?: string;
  full_name?: string;
  name?: string;
  email?: string;
  email_id?: string;
}

interface Employee {
  id: number;
  emp_name?: string;
  email?: string;
  emp_email?: string;
  user_email?: string;
  official_email?: string;
}

interface Props {
  ticket: TicketDetail | null;
  description: string;
  onTicketUpdate?: (ticket: TicketDetail) => void;
  replyProps?: TicketReplyEditorProps | null;
  assigneeName?: string;
  assigneeEmail?: string;
  employees?: Employee[];
  canEdit?: boolean;
  canReply?: boolean;

  setDescription: (v: string) => void;

  handlePreviewOpen: (file: string) => void;

  openReply: boolean;
  setOpenReply: (v: boolean) => void;
}

const TicketContentPanel = ({
  ticket,
  description,
  setDescription,
  onTicketUpdate,
  handlePreviewOpen,
  openReply,
  setOpenReply,
  replyProps,
  assigneeName,
  assigneeEmail,
  employees = [],
  canEdit = true,
  canReply = true,
}: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const leadsFromStore = useSelector(selectLeads);
  const authUser = useSelector(selectUser);

  const leads: Lead[] = useMemo(() => {
    return Array.isArray(leadsFromStore) ? leadsFromStore : [];
  }, [leadsFromStore]);

  const [isEditing, setIsEditing] = useState(false);

  const editUpdateButtonSx = {
    textTransform: "none",
    minHeight: "34px",
    height: "34px",
    px: 2,
    backgroundColor: "#505050",
    color: "#FFFFFF",
    border: "none",
    "&:hover": {
      backgroundColor: "#232323",
      color: "#FFFFFF",
    },
  };

  const replyButtonSx = {
    textTransform: "none",
    minHeight: "34px",
    height: "34px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    p: 0,
    "& img": {
      display: "block",
    },
  };

  useEffect(() => {
    // dispatch one time only; guard is checked at mount so doc avoids loops
    if (leads.length === 0) {
      dispatch(fetchLeads());
    }
  }, [dispatch, leads.length]);

  //  Convert Leads into Email Recipients
  const recipients = (Array.isArray(leads) ? leads : [])
    .filter((l: Lead) => l.email || l.email_id)
    .map((l: Lead) => ({
      id: l.id,
      name: l.patient_name || l.full_name || l.name || "Unknown",
      email: l.email || l.email_id || "",
    }));

  if (!ticket) return null;

  const displayName =
    assigneeName?.trim() || ticket.assigned_to_name || ticket.requested_by;

  // Get the actual email for the assignee with proper fallbacks
  const getEmployeeEmail = (): string => {
    const candidateEmail = assigneeEmail?.trim();
    if (candidateEmail && candidateEmail.includes("@")) {
      return candidateEmail;
    }

    if (ticket.assigned_to_id && employees.length > 0) {
      const emp = employees.find(
        (e) => Number(e.id) === Number(ticket.assigned_to_id),
      );

      if (emp) {
        const email =
          emp.email || emp.emp_email || emp.user_email || emp.official_email;

        if (email && email.includes("@")) {
          return email.trim();
        }
      }
    }

    if (ticket.assigned_to_email && ticket.assigned_to_email.includes("@")) {
      return ticket.assigned_to_email.trim();
    }

    return "No Email";
  };

  const displayEmail = getEmployeeEmail();

  const isValidEmail = (value: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const uniqueValidEmails = (items: Array<string | undefined>): string[] => {
    const seen = new Set<string>();

    items.forEach((item) => {
      const trimmed = item?.trim();
      if (!trimmed || !isValidEmail(trimmed)) return;
      seen.add(trimmed.toLowerCase());
    });

    return Array.from(seen);
  };

  const getRequestedByEmail = (): string => {
    const requestedBy = ticket.requested_by?.trim() || "";
    return isValidEmail(requestedBy) ? requestedBy : "";
  };

  const getEditorEmail = (): string => {
    const editorEmail = authUser?.email?.trim() || "";
    return isValidEmail(editorEmail) ? editorEmail : "";
  };

  const buildDescriptionUpdateBody = (): string => {
    const assignee = displayName || "Team";
    const descriptionValue = description.trim() || "No description provided.";

    const lines = [
      `Hi ${assignee},`,
      "",
      "<strong>The ticket description has been updated.</strong>",
      "",
      "Ticket Details:",
      `Ticket ID: ${ticket.ticket_no || ticket.id}`,
      `Subject: ${ticket.subject}`,
      "",
      "<strong>Updated Description:</strong>",
      descriptionValue,
      "",
      "Please review the updated ticket and take any required action.",
      "",
      "Regards,",
      `${ticket.lab_name || "Clinic"} Support Team`,
    ];

    return lines.join("\n");
  };

  const handleUpdate = async () => {
    try {
      const assigneeEmailValue = getEmployeeEmail();

      if (!isValidEmail(assigneeEmailValue)) {
        console.error("Assigned user's email is invalid.");
        return;
      }

      const requestedByEmail = getRequestedByEmail();
      const editorEmail = getEditorEmail();
      const ccRecipients = uniqueValidEmails([requestedByEmail, editorEmail]);

      const updatedTicket = await ticketsApi.updateTicket(ticket.id, {
        subject: ticket.subject,
        description: description,
        lab: ticket.lab,
        department: ticket.department,
        requested_by: ticket.requested_by,
        priority: ticket.priority,
        status: ticket.status,
        assigned_to: ticket.assigned_to_id ?? null,
        assigned_to_name: ticket.assigned_to_name || displayName,
        event: "ticket_updated",
        clinicName: ticket.lab_name || "Clinic",
        to: [assigneeEmailValue],
        cc: ccRecipients.length > 0 ? ccRecipients : undefined,
        email_body: buildDescriptionUpdateBody(),
      });

      setDescription(updatedTicket.description);
      const latestTicket = await ticketsApi.getTicketById(ticket.id);
      onTicketUpdate?.(latestTicket);
      setIsEditing(false);
      toast.success("Mail sent with edited description");
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  return (
    <Box
      flex={2}
      p={3}
      borderRadius={2}
      bgcolor="#FAFAFA"
      border="1px solid #E0E0E0"
      sx={{
        minHeight: 0,
        height: "100%",
        maxHeight: { xs: "48vh", lg: "100%" },
        overflowY: "auto",
      }}
    >
      {/* Subject */}
      <Typography fontSize={16} fontWeight={700} mb={1}>
        {ticket.subject}
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {/* Content Section */}
      <Box
        p={3}
        borderRadius={2}
        bgcolor="#FFFFFF"
        border="1px solid #ECECEC"
        mb={3}
      >
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar>
              {(displayName?.trim()?.charAt(0) || "U").toUpperCase()}
            </Avatar>
            <Box>
              <Typography fontWeight={700}>{displayName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {displayEmail}
              </Typography>
            </Box>
          </Stack>

          <Typography variant="caption" color="text.secondary">
            {dayjs(ticket.created_at).format("ddd, MMM DD, h:mm A")}
          </Typography>
        </Box>

        {/* Editable Description */}
        <TextField
          fullWidth
          multiline
          rows={6}
          value={description}
          disabled={!isEditing}
          onChange={(e) => setDescription(e.target.value)}
          variant="standard"
          placeholder="Describe the issue in detail..."
          InputProps={{ disableUnderline: true }}
          sx={{
            mb: 4,
            "& .MuiInputBase-root": {
              fontSize: "0.95rem",
              lineHeight: 1.7,
              padding: 0,
              backgroundColor: "transparent",
            },
            "& textarea": { padding: 0 },
          }}
        />

        {/* Attachments */}
        <Stack direction="row" spacing={2}>
          {ticket.documents?.map((doc: TicketDocument) => (
            <Box
              key={doc.id}
              sx={{
                p: 1.5,
                border: "1px solid #E0E0E0",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
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

      {/* Actions */}
      <Stack direction="row" spacing={2} mt={2} alignItems="center">
        {/* Edit / Update */}
        {canEdit &&
          (isEditing ? (
            <Button
              variant="contained"
              onClick={handleUpdate}
              sx={editUpdateButtonSx}
            >
              Update
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => setIsEditing(true)}
              sx={editUpdateButtonSx}
            >
              Edit
            </Button>
          ))}

        {/* Reply Button */}
        {canReply && !openReply && (
          <Button
            onClick={() => setOpenReply(true)}
            sx={replyButtonSx}
          >
            <img src={ReplyMail} alt="Reply" />
          </Button>
        )}
      </Stack>

      {/* Reply Editor shows BELOW */}
      {openReply && replyProps ? (
        <TicketReplyEditor
          {...replyProps}
          recipients={recipients}
          openReply={openReply}
          setOpenReply={setOpenReply}
          handleSendReply={() => {
            // Save email into Redux history - create one record per recipient
            replyProps.replyTo.forEach((email) => {
              // Find which lead this email belongs to
              const recipientLead = recipients.find((r) => r.email === email);

              dispatch(
                addEmail({
                  id: Date.now().toString() + "_" + email,
                  to: email,
                  subject: replyProps.replySubject || "(No Subject)",
                  message: replyProps.replyMessage,
                  created_at: new Date().toISOString(),
                  ticket_id: ticket.id,
                  lead_id: recipientLead?.id || "",
                }),
              );
            });

            // call original send logic if exists
            replyProps.handleSendReply();
          }}
        />
      ) : null}
    </Box>
  );
};

export default TicketContentPanel;
