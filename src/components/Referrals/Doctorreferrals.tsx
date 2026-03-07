import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Avatar,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import BackwardIcon from "../../assets/icons/Backward_icon.svg";
import { LeadAPI } from "../../services/leads.api";
import type { Lead, LeadDocument } from "../../services/leads.api";

// ── Types ──────────────────────────────────────────────────────────────────
interface PatientCard {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  mrn: string;
  referralDate: string;
  raw: Lead;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: "#E7F1FF", color: "#1D4ED8" },
  { bg: "#F0FDF4", color: "#16A34A" },
  { bg: "#FFF7ED", color: "#C2410C" },
  { bg: "#F5F3FF", color: "#7C3AED" },
  { bg: "#FFF1F2", color: "#BE123C" },
  { bg: "#F0F9FF", color: "#0369A1" },
  { bg: "#FFFBEB", color: "#B45309" },
  { bg: "#F0FDFA", color: "#0F766E" },
];

function getAvatarStyle(id: string) {
  const num = parseInt(id.replace(/\D/g, "").slice(-4) || "0", 10);
  return AVATAR_COLORS[num % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function buildMRN(id: string) {
  return `PCC-${id.replace(/\D/g, "").slice(-4).padStart(4, "0").toUpperCase()}`;
}

// ── Info field sub-component ───────────────────────────────────────────────
const InfoField = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => (
  <Box>
    <Typography
      fontSize="11px"
      fontWeight={600}
      color="#9E9E9E"
      textTransform="uppercase"
      letterSpacing="0.05em"
      mb={0.5}
    >
      {label}
    </Typography>
    <Typography fontSize="13px" color="#232323">
      {value || "—"}
    </Typography>
  </Box>
);

// ── Main Component ─────────────────────────────────────────────────────────
const DoctorReferrals: React.FC = () => {
  const navigate = useNavigate();
  const { doctorId } = useParams<{ doctorId: string }>();
  const location = useLocation();
  const state = location.state as { doctorName?: string } | null;
  const doctorName = state?.doctorName ?? `Doctor #${doctorId}`;

  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<PatientCard[]>([]);
  const [selected, setSelected] = useState<PatientCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);

        // Use LeadAPI.list() — auth token handled automatically via axios interceptor
        const allLeads: Lead[] = await LeadAPI.list();

        // Filter leads assigned to this specific doctor
        const filtered = allLeads.filter(
          (lead) => String(lead.assigned_to_id) === String(doctorId)
        );

        const cards: PatientCard[] = filtered.map((lead) => {
          const style = getAvatarStyle(lead.id);
          return {
            id: lead.id,
            name: lead.full_name ?? "Unknown",
            initials: getInitials(lead.full_name ?? "U"),
            avatarBg: style.bg,
            avatarColor: style.color,
            mrn: buildMRN(lead.id),
            referralDate: formatDate(lead.created_at),
            raw: lead,
          };
        });

        setPatients(cards);
        if (cards.length > 0) setSelected(cards[0]);
      } catch (err) {
        console.error("Failed to load referrals:", err);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, [doctorId]);

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.mrn.toLowerCase().includes(search.toLowerCase())
  );

  const sel = selected;
  const treatments = sel?.raw.treatment_interest
    ? sel.raw.treatment_interest
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return (
    <Box p={1}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
        mt={-2}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            component="img"
            src={BackwardIcon}
            alt="Back"
            sx={{ width: 40, height: 40, cursor: "pointer" }}
            onClick={() => navigate(-1)}
          />
          <Typography variant="h6" fontWeight={600} mt={-1}>
            {doctorName} Referrals
          </Typography>
        </Box>

        {/* Month display */}
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          border="1px solid #E2E8F0"
          borderRadius="8px"
          px={1.5}
          py={0.75}
          sx={{ cursor: "pointer", bgcolor: "#fff" }}
        >
          <Typography fontSize="13px" color="#374151">
            {new Date().toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </Typography>
          <CalendarTodayOutlinedIcon sx={{ fontSize: 15, color: "#64748B" }} />
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" pt={8}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <Box display="flex" gap={2.5} alignItems="flex-start">
          {/* ── Left Panel ───────────────────────────────────────────── */}
          <Paper
            elevation={0}
            sx={{
              width: 290,
              flexShrink: 0,
              borderRadius: "12px",
              border: "1px solid #F0F0F0",
              bgcolor: "#fff",
              overflow: "hidden",
            }}
          >
            {/* Panel header */}
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              px={2}
              py={1.5}
              sx={{ borderBottom: "1px solid #F8F8F9" }}
            >
              <Typography fontSize="13px" fontWeight={600} color="#232323">
                All Referrals ({filtered.length})
              </Typography>
              <Box display="flex">
                <Tooltip title="Info">
                  <IconButton size="small" sx={{ color: "#9E9E9E" }}>
                    <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Filter">
                  <IconButton size="small" sx={{ color: "#9E9E9E" }}>
                    <FilterListIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Search */}
            <Box px={1.5} py={1} sx={{ borderBottom: "1px solid #F8F8F9" }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by Lead name/MRN No."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 16, color: "#9E9E9E" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    fontSize: "12px",
                    bgcolor: "#F8F8F9",
                    "& fieldset": { borderColor: "transparent" },
                    "&:hover fieldset": { borderColor: "#E2E8F0" },
                    "&.Mui-focused fieldset": { borderColor: "#1D4ED8" },
                    height: 36,
                  },
                }}
              />
            </Box>

            {/* Patient list */}
            <Box
              sx={{
                maxHeight: "calc(100vh - 280px)",
                overflowY: "auto",
                "&::-webkit-scrollbar": { width: "4px" },
                "&::-webkit-scrollbar-thumb": {
                  bgcolor: "#E2E8F0",
                  borderRadius: "4px",
                },
              }}
            >
              {filtered.length === 0 ? (
                <Box py={5} textAlign="center">
                  <Typography fontSize="13px" color="#9E9E9E">
                    No patients found
                  </Typography>
                </Box>
              ) : (
                filtered.map((p) => (
                  <Box
                    key={p.id}
                    onClick={() => setSelected(p)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      cursor: "pointer",
                      bgcolor:
                        selected?.id === p.id ? "#EFF6FF" : "transparent",
                      borderLeft:
                        selected?.id === p.id
                          ? "3px solid #1D4ED8"
                          : "3px solid transparent",
                      borderBottom: "1px solid #F8F8F9",
                      transition: "all 0.12s",
                      "&:hover": {
                        bgcolor:
                          selected?.id === p.id ? "#EFF6FF" : "#FAFAFA",
                      },
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: p.avatarBg,
                          color: p.avatarColor,
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        {p.initials}
                      </Avatar>
                      <Box flex={1} minWidth={0}>
                        <Typography
                          fontSize="13px"
                          fontWeight={600}
                          color="#232323"
                          noWrap
                        >
                          {p.name}
                        </Typography>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          mt={0.25}
                        >
                          <Typography
                            fontSize="11px"
                            color="#1D4ED8"
                            fontWeight={500}
                          >
                            {p.mrn}
                          </Typography>
                          <Typography fontSize="11px" color="#9E9E9E">
                            {p.referralDate}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Paper>

          {/* ── Right Panel ───────────────────────────────────────────── */}
          {sel ? (
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                borderRadius: "12px",
                border: "1px solid #F0F0F0",
                bgcolor: "#fff",
                p: 3,
                overflowY: "auto",
                maxHeight: "calc(100vh - 160px)",
              }}
            >
              {/* Title + MRN badge */}
              <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
                <Typography fontSize="15px" fontWeight={700} color="#232323">
                  Patient Info
                </Typography>
                <Box
                  sx={{
                    bgcolor: "#EFF6FF",
                    color: "#1D4ED8",
                    px: 1.25,
                    py: 0.25,
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 600,
                  }}
                >
                  {sel.mrn}
                </Box>
              </Box>

              {/* Patient name */}
              <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: sel.avatarBg,
                    color: sel.avatarColor,
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  {sel.initials}
                </Avatar>
                <Typography fontSize="14px" fontWeight={700} color="#232323">
                  {sel.name}
                </Typography>
              </Box>

              <Divider sx={{ mb: 2.5, borderColor: "#F8F8F9" }} />

              {/* Patient Information */}
              <Typography
                fontSize="11px"
                fontWeight={700}
                color="#9E9E9E"
                textTransform="uppercase"
                letterSpacing="0.06em"
                mb={2}
              >
                Patient Information
              </Typography>
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2.5} mb={3}>
                <InfoField label="Contact No." value={sel.raw.contact_no} />
                <InfoField label="Email" value={sel.raw.email} />
                <InfoField label="Location" value={sel.raw.location} />
                <InfoField label="Gender" value="—" />
                <InfoField label="Age" value={sel.raw.age} />
                <InfoField label="Address" value={sel.raw.address} />
                <InfoField
                  label="Language Preference"
                  value={(sel.raw as Lead & { language_preference?: string }).language_preference}
                />
                <InfoField
                  label="Created Date & Time"
                  value={formatDateTime(sel.raw.created_at)}
                />
              </Box>

              <Divider sx={{ mb: 2.5, borderColor: "#F8F8F9" }} />

              {/* Partner Information */}
              <Typography
                fontSize="11px"
                fontWeight={700}
                color="#9E9E9E"
                textTransform="uppercase"
                letterSpacing="0.06em"
                mb={2}
              >
                Partner Information
              </Typography>
              <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2.5} mb={3}>
                <InfoField label="Full Name" value={sel.raw.partner_full_name} />
                <InfoField label="Age" value={sel.raw.partner_age} />
                <InfoField label="Gender" value={sel.raw.partner_gender} />
              </Box>

              <Divider sx={{ mb: 2.5, borderColor: "#F8F8F9" }} />

              {/* Treatment Interest */}
              <Typography
                fontSize="11px"
                fontWeight={700}
                color="#9E9E9E"
                textTransform="uppercase"
                letterSpacing="0.06em"
                mb={1.5}
              >
                Treatment Interest
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
                {treatments.length > 0 ? (
                  treatments.map((t) => (
                    <Chip
                      key={t}
                      label={t}
                      size="small"
                      sx={{
                        bgcolor: "#F8F8F9",
                        color: "#232323",
                        fontWeight: 500,
                        fontSize: "12px",
                        borderRadius: "6px",
                        height: 26,
                        border: "1px solid #E2E8F0",
                      }}
                    />
                  ))
                ) : (
                  <Typography fontSize="13px" color="#9E9E9E">
                    No treatment interests recorded
                  </Typography>
                )}
              </Box>

              {/* Documents */}
              {sel.raw.documents && sel.raw.documents.length > 0 && (
                <>
                  <Divider sx={{ mb: 2.5, borderColor: "#F8F8F9" }} />
                  <Typography
                    fontSize="11px"
                    fontWeight={700}
                    color="#9E9E9E"
                    textTransform="uppercase"
                    letterSpacing="0.06em"
                    mb={1.5}
                  >
                    Documents
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    {sel.raw.documents.map((doc: LeadDocument) => {
                      const fileName =
                        doc.file?.split("/").pop() ?? "Document";
                      const fileUrl = doc.file?.startsWith("http")
                        ? doc.file
                        : `http://127.0.0.1:8000${doc.file}`;
                      return (
                        <Box
                          key={doc.id}
                          display="flex"
                          alignItems="center"
                          gap={1.5}
                          px={2}
                          py={1.25}
                          sx={{
                            border: "1px solid #F0F0F0",
                            borderRadius: "8px",
                            bgcolor: "#FAFAFA",
                          }}
                        >
                          <DescriptionOutlinedIcon
                            sx={{ fontSize: 18, color: "#F43F5E" }}
                          />
                          <Typography
                            fontSize="13px"
                            fontWeight={500}
                            color="#232323"
                            flex={1}
                            noWrap
                          >
                            {fileName}
                          </Typography>
                          <Box display="flex" gap={0.5}>
                            <Tooltip title="View">
                              <IconButton
                                size="small"
                                sx={{ color: "#626262" }}
                                onClick={() =>
                                  doc.file && window.open(fileUrl, "_blank")
                                }
                              >
                                <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download">
                              <IconButton
                                size="small"
                                sx={{ color: "#626262" }}
                                onClick={() => {
                                  if (doc.file) {
                                    const a = document.createElement("a");
                                    a.href = fileUrl;
                                    a.download = fileName;
                                    a.click();
                                  }
                                }}
                              >
                                <DownloadOutlinedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </>
              )}
            </Paper>
          ) : (
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                borderRadius: "12px",
                border: "1px solid #F0F0F0",
                bgcolor: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 400,
              }}
            >
              <Typography fontSize="14px" color="#9E9E9E">
                Select a patient to view their details
              </Typography>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
};

export default DoctorReferrals;