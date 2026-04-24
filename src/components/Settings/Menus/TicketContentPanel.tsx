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
import type {
  TicketDetail,
  TicketDocument,
} from "../../../types/tickets.types";
import { selectLeads, fetchLeads } from "../../../store/leadSlice";
import { useEffect, useMemo } from "react";

interface Lead {
  id: string;
  patient_name?: string;
  full_name?: string;
  name?: string;
  email?: string;
  email_id?: string;
}

interface Props {
  ticket: TicketDetail | null;
  description: string;
  replyProps?: TicketReplyEditorProps | null;
  assigneeName?: string;
  assigneeEmail?: string;
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
  handlePreviewOpen,
  openReply,
  setOpenReply,
  replyProps,
  assigneeName,
  assigneeEmail,
  canEdit = true,
  canReply = true,
}: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const leadsFromStore = useSelector(selectLeads);

  const leads: Lead[] = useMemo(() => {
    return Array.isArray(leadsFromStore) ? leadsFromStore : [];
  }, [leadsFromStore]);

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

  const displayName = assigneeName?.trim() || ticket.requested_by;
  const normalizedFallback = ticket.requested_by
    .toLowerCase()
    .replace(/\s/g, ".");
  const displayEmail =
    assigneeEmail?.trim() ||
    (normalizedFallback.includes("@")
      ? normalizedFallback
      : `${normalizedFallback}@fertility.com`);

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
          disabled={!canEdit}
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

      {/* Reply Button */}
      {canReply && !openReply && (
        <Button
          onClick={() => setOpenReply(true)}
          sx={{ textTransform: "none", mt: 2 }}
        >
          <img src={ReplyMail} alt="Reply" />
        </Button>
      )}

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
