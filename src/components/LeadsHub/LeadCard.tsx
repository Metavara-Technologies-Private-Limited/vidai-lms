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
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import MailOutlineIcon from "@mui/icons-material/MailOutline";

import { MenuButton, CallButton } from "./LeadsMenuDialogs";

// FIX: import MappedLead directly inline instead of from a separate types file
// to avoid Windows file-casing issues entirely. MappedLead only needs the fields
// used in this component — all other fields pass through via [key: string]: unknown.
export interface MappedLead {
  id: string;
  full_name: string;
  name: string;
  initials: string;
  location: string;
  created_at: string | null;
  source: string;
  assigned: string;
  score: number;
  quality: "Hot" | "Warm" | "Cold";
  status: string;
  lead_status: string;
  department_id: number | null;
  assigned_to_id: number | null;
  clinic_id: number | null;
  appointment_date: string | null;
  slot: string;
  remark: string;
  is_active: boolean;
  [key: string]: unknown;
}

// ──────────────────────────────────────────────
// CARD CONTENT (collapsed vs expanded)
// ──────────────────────────────────────────────
interface CardContentProps {
  lead: MappedLead;
  columnLabel: string;
  isHovered: boolean;
  onOpenSms: (lead: MappedLead) => void;
  onOpenMail: (lead: MappedLead) => void;
  onOpenBook: (lead: MappedLead) => void;
}

const LeadCardContent: React.FC<CardContentProps> = ({
  lead, columnLabel, isHovered, onOpenSms, onOpenMail, onOpenBook,
}) => {
  const iconBtnStyle = {
    border: "1px solid #E2E8F0",
    p: 0.5,
    borderRadius: "8px",
    color: "#64748B",
    "&:hover": { bgcolor: "#F8FAFC", color: "#6366F1" },
  };

  const showButton =
    (columnLabel === "NEW LEADS" || columnLabel === "FOLLOW-UPS") && isHovered;

  if (!isHovered) {
    return (
      <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
        <Typography variant="caption" fontWeight={600} sx={{ color: "#64748B", fontSize: "0.7rem" }}>
          Score:{" "}
          <Box component="span" sx={{ color: "#1E293B" }}>{lead.score || 0}%</Box>
        </Typography>
      </Box>
    );
  }

  const formattedDate = lead.created_at
    ? new Date(lead.created_at).toLocaleDateString("en-GB")
    : "Not specified";
  const formattedTime = lead.created_at
    ? new Date(lead.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <Box sx={{ width: "100%", mt: 1.5 }}>
      <Stack spacing={1} sx={{ mb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <LocationOnIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
            {lead.location}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <CalendarMonthIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
            {`${formattedDate}${formattedTime ? `, ${formattedTime}` : ""}`}
          </Typography>
        </Stack>
      </Stack>

      <Divider sx={{ my: 1.5, borderStyle: "dashed" }} />

      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary"
            sx={{ fontSize: "0.6rem", display: "block", fontWeight: 700 }}>
            ASSIGNED TO
          </Typography>
          <Typography variant="caption" fontWeight={600} color="#1E293B" sx={{ fontSize: "0.75rem" }}>
            {lead.assigned}
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="caption" color="text.secondary"
            sx={{ fontSize: "0.6rem", display: "block", fontWeight: 700 }}>
            LEAD SOURCE
          </Typography>
          <Typography variant="caption" fontWeight={600} color="#1E293B" sx={{ fontSize: "0.75rem" }}>
            {lead.source}
          </Typography>
        </Box>
      </Stack>

      <Typography variant="caption" color="text.secondary"
        sx={{ fontSize: "0.6rem", display: "block", fontWeight: 700, mb: 1 }}>
        CONTACT OPTION
      </Typography>
      <Stack direction="row" spacing={1.5} sx={{ mb: showButton ? 2 : 0 }}>
        <Box sx={iconBtnStyle} onClick={(e) => e.stopPropagation()}>
          <CallButton lead={lead} />
        </Box>
        <IconButton size="small" sx={iconBtnStyle}
          onClick={(e) => { e.stopPropagation(); onOpenSms(lead); }}>
          <ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton size="small" sx={iconBtnStyle}
          onClick={(e) => { e.stopPropagation(); onOpenMail(lead); }}>
          <MailOutlineIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>

      {showButton && (
        <Button fullWidth variant="contained" size="small"
          onClick={(e) => { e.stopPropagation(); onOpenBook(lead); }}
          sx={{
            bgcolor: "#334155", textTransform: "none", borderRadius: "8px",
            fontWeight: 600, py: 1.2, mt: 1, "&:hover": { bgcolor: "#1e293b" },
          }}>
          Book an Appointment
        </Button>
      )}
    </Box>
  );
};

// ──────────────────────────────────────────────
// LEAD CARD
// ──────────────────────────────────────────────
interface LeadCardProps {
  lead: MappedLead;
  columnLabel: string;
  columnColor: string;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
  onOpenSms: (lead: MappedLead) => void;
  onOpenMail: (lead: MappedLead) => void;
  onOpenBook: (lead: MappedLead) => void;
  // FIX: any[] matches MenuButton's setLeads type — avoids MappedLead[] vs LeadItem[] mismatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setLeads: React.Dispatch<React.SetStateAction<any[]>>;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead, columnLabel, columnColor, isHovered,
  onMouseEnter, onMouseLeave, onClick,
  onOpenSms, onOpenMail, onOpenBook, setLeads,
}) => (
  <Paper
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    onClick={onClick}
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: "16px",
      border: "1px solid #EAECF0",
      transition: "all 0.3s ease",
      width: "100%",
      backgroundColor: "#FFFFFF",
      cursor: "pointer",
      ...(isHovered && {
        boxShadow: "0px 12px 24px -4px rgba(145, 158, 171, 0.16)",
        borderColor: columnColor,
        transform: "translateY(-2px)",
        zIndex: 10,
      }),
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar sx={{ width: 36, height: 36, fontSize: "0.8rem", bgcolor: "#EEF2FF", color: "#6366F1", fontWeight: 700 }}>
          {lead.initials}
        </Avatar>
        <Box>
          <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: "0.9rem", color: "#1E293B" }}>
            {lead.full_name || lead.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
            {lead.id}
          </Typography>
        </Box>
      </Stack>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Chip
          label={lead.quality}
          size="small"
          sx={{
            height: 20,
            fontSize: "0.65rem",
            fontWeight: 700,
            bgcolor: lead.quality === "Hot" ? "#FEE2E2" : lead.quality === "Warm" ? "#FEF3C7" : "#F1F5F9",
            color: lead.quality === "Hot" ? "#B91C1C" : lead.quality === "Warm" ? "#B45309" : "#475569",
          }}
        />
        <Box onClick={(e) => e.stopPropagation()}>
          <MenuButton lead={lead} setLeads={setLeads} tab="active" />
        </Box>
      </Stack>
    </Stack>

    <LeadCardContent
      lead={lead}
      columnLabel={columnLabel}
      isHovered={isHovered}
      onOpenSms={onOpenSms}
      onOpenMail={onOpenMail}
      onOpenBook={onOpenBook}
    />
  </Paper>
);