// Leadsboardcard.tsx
// CardContent, LeadCard, LeadColumn

import * as React from "react";
import {
  Box, Stack, Typography, Paper, Avatar, Chip,
  IconButton, Button, Divider,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PhoneIcon from "@mui/icons-material/Phone";
import { useNavigate } from "react-router-dom";

import { MenuButton } from "./LeadsMenuDialogs";

import type { LeadItem, ColumnConfig } from "./Leadsboardtypes";

// Re-export so any file that was importing LeadItem from here still works
export type { LeadItem, ColumnConfig };

// ====================== Shared icon button style ======================
const iconBtnSx = {
  border: "1px solid #E2E8F0",
  p: 0.5,
  borderRadius: "8px",
  color: "#64748B",
  "&:hover": { bgcolor: "#F8FAFC", color: "#6366F1" },
};

// ====================== Card Content (collapsed / expanded) ======================
interface CardContentProps {
  lead: LeadItem;
  columnLabel: string;
  isHovered: boolean;
  onOpenSms:  (lead: LeadItem) => void;
  onOpenMail: (lead: LeadItem) => void;
  onOpenBook: (lead: LeadItem) => void;
  onOpenCall: (lead: LeadItem) => void;
}

export const CardContent: React.FC<CardContentProps> = ({
  lead, columnLabel, isHovered, onOpenSms, onOpenMail, onOpenBook, onOpenCall,
}) => {
  // Collapsed view
  if (!isHovered) {
    return (
      <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
        <Typography variant="caption" fontWeight={600} sx={{ color: "#64748B", fontSize: "0.7rem" }}>
          Score: <Box component="span" sx={{ color: "#1E293B" }}>{lead.score || 0}%</Box>
        </Typography>
      </Box>
    );
  }

  const showBookButton =
    (columnLabel === "NEW LEADS" || columnLabel === "FOLLOW-UPS") && isHovered;

  const formattedDate = lead.created_at
    ? new Date(lead.created_at as string).toLocaleDateString("en-GB")
    : "Not specified";
  const formattedTime = lead.created_at
    ? new Date(lead.created_at as string).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <Box sx={{ width: "100%", mt: 1.5 }}>
      {/* Location + Date */}
      <Stack spacing={1} sx={{ mb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <LocationOnIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
            {lead.location as string}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <CalendarMonthIcon sx={{ fontSize: 14, color: "#94A3B8" }} />
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
            {formattedDate}{formattedTime ? `, ${formattedTime}` : ""}
          </Typography>
        </Stack>
      </Stack>

      <Divider sx={{ my: 1.5, borderStyle: "dashed" }} />

      {/* Assigned + Source */}
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: "0.6rem", display: "block", fontWeight: 700 }}
          >
            ASSIGNED TO
          </Typography>
          <Typography variant="caption" fontWeight={600} color="#1E293B" sx={{ fontSize: "0.75rem" }}>
            {lead.assigned as string}
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: "0.6rem", display: "block", fontWeight: 700 }}
          >
            LEAD SOURCE
          </Typography>
          <Typography variant="caption" fontWeight={600} color="#1E293B" sx={{ fontSize: "0.75rem" }}>
            {lead.source as string}
          </Typography>
        </Box>
      </Stack>

      {/* Contact options */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ fontSize: "0.6rem", display: "block", fontWeight: 700, mb: 1 }}
      >
        CONTACT OPTION
      </Typography>
      <Stack direction="row" spacing={1.5} sx={{ mb: showBookButton ? 2 : 0 }}>
        {/* Call button — now wired to working handler */}
        <IconButton
          size="small"
          sx={iconBtnSx}
          onClick={(e) => { e.stopPropagation(); onOpenCall(lead); }}
        >
          <PhoneIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton
          size="small"
          sx={iconBtnSx}
          onClick={(e) => { e.stopPropagation(); onOpenSms(lead); }}
        >
          <ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton
          size="small"
          sx={iconBtnSx}
          onClick={(e) => { e.stopPropagation(); onOpenMail(lead); }}
        >
          <MailOutlineIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>

      {showBookButton && (
        <Button
          fullWidth
          variant="contained"
          size="small"
          onClick={(e) => { e.stopPropagation(); onOpenBook(lead); }}
          sx={{
            bgcolor: "#334155",
            textTransform: "none",
            borderRadius: "8px",
            fontWeight: 600,
            py: 1.2,
            mt: 1,
            "&:hover": { bgcolor: "#1e293b" },
          }}
        >
          Book an Appointment
        </Button>
      )}
    </Box>
  );
};

// ====================== Lead Card ======================
interface LeadCardProps {
  lead: LeadItem;
  columnLabel: string;
  columnColor: string;
  isHovered: boolean;
  onHover:    (id: string | null) => void;
  onOpenSms:  (lead: LeadItem) => void;
  onOpenMail: (lead: LeadItem) => void;
  onOpenBook: (lead: LeadItem) => void;
  onOpenCall: (lead: LeadItem) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setLeads: React.Dispatch<React.SetStateAction<any[]>>;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead, columnLabel, columnColor, isHovered,
  onHover, onOpenSms, onOpenMail, onOpenBook, onOpenCall, setLeads,
}) => {
  const navigate = useNavigate();

  return (
    <Paper
      elevation={0}
      onMouseEnter={() => onHover(lead.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => navigate(`/leads/${lead.id.replace("#", "")}`)}
      sx={{
        p: 2.5,
        borderRadius: "16px",
        border: "1px solid #EAECF0",
        transition: "all 0.3s ease",
        width: "100%",
        backgroundColor: "#FFFFFF",
        cursor: "pointer",
        ...(isHovered && {
          boxShadow: "0px 12px 24px -4px rgba(145,158,171,0.16)",
          borderColor: columnColor,
          transform: "translateY(-2px)",
          zIndex: 10,
        }),
      }}
    >
      {/* Header row */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              width: 36,
              height: 36,
              fontSize: "0.8rem",
              bgcolor: "#EEF2FF",
              color: "#6366F1",
              fontWeight: 700,
            }}
          >
            {lead.initials as string}
          </Avatar>
          <Box>
            <Typography
              variant="subtitle2"
              fontWeight={700}
              sx={{ fontSize: "0.9rem", color: "#1E293B" }}
            >
              {lead.full_name ?? lead.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
              {lead.id}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.5} alignItems="center">
          <Chip
            label={lead.quality as string}
            size="small"
            sx={{
              height: 20,
              fontSize: "0.65rem",
              fontWeight: 700,
              bgcolor:
                lead.quality === "Hot" ? "#FEE2E2"
                : lead.quality === "Warm" ? "#FEF3C7"
                : "#F1F5F9",
              color:
                lead.quality === "Hot" ? "#B91C1C"
                : lead.quality === "Warm" ? "#B45309"
                : "#475569",
            }}
          />
          <Box onClick={(e) => e.stopPropagation()}>
            <MenuButton lead={lead} setLeads={setLeads} tab="active" />
          </Box>
        </Stack>
      </Stack>

      <CardContent
        lead={lead}
        columnLabel={columnLabel}
        isHovered={isHovered}
        onOpenSms={onOpenSms}
        onOpenMail={onOpenMail}
        onOpenBook={onOpenBook}
        onOpenCall={onOpenCall}
      />
    </Paper>
  );
};

// ====================== Lead Column ======================
export interface LeadColumnProps {
  col: ColumnConfig;
  leads: LeadItem[];
  hoveredId: string | null;
  onHover:    (id: string | null) => void;
  onOpenSms:  (lead: LeadItem) => void;
  onOpenMail: (lead: LeadItem) => void;
  onOpenBook: (lead: LeadItem) => void;
  onOpenCall: (lead: LeadItem) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setLeads: React.Dispatch<React.SetStateAction<any[]>>;
}

export const LeadColumn: React.FC<LeadColumnProps> = ({
  col, leads, hoveredId, onHover, onOpenSms, onOpenMail, onOpenBook, onOpenCall, setLeads,
}) => (
  <Box
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
      flexShrink: 0,
    }}
  >
    <Typography
      variant="subtitle2"
      fontWeight={800}
      sx={{
        color: "#64748B",
        mb: 2.5,
        px: 1,
        display: "flex",
        alignItems: "center",
        gap: 1,
        letterSpacing: 0.5,
      }}
    >
      {col.label}{" "}
      <Box component="span" sx={{ color: "#94A3B8", fontWeight: 500 }}>
        ({leads.length.toString().padStart(2, "0")})
      </Box>
    </Typography>

    <Stack
      spacing={2}
      sx={{
        overflowY: "auto",
        px: 0.5,
        pb: 1,
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {leads.map((lead) => (
        <LeadCard
          key={lead.id}
          lead={lead}
          columnLabel={col.label}
          columnColor={col.color}
          isHovered={hoveredId === lead.id}
          onHover={onHover}
          onOpenSms={onOpenSms}
          onOpenMail={onOpenMail}
          onOpenBook={onOpenBook}
          onOpenCall={onOpenCall}
          setLeads={setLeads}
        />
      ))}
    </Stack>
  </Box>
);