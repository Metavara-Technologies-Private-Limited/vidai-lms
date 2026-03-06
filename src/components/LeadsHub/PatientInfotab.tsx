import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Card,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip,
} from "@mui/material";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { Info } from "./LeadDetailSubComponents";
import type { LeadRecord } from "./LeadDetailTypes";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE_URL: string =
  (import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_BASE_URL?.replace("/api", "") ??
  "http://127.0.0.1:8000";

function resolveDocUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = API_BASE_URL.replace(/\/$/, "");
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
}

function getFileExt(url: string): string {
  try {
    const path = new URL(url).pathname;
    return path.split(".").pop()?.toLowerCase() ?? "";
  } catch {
    return url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  }
}

function getFileName(url: string, fallback: string): string {
  if (fallback && fallback !== "Document") return fallback;
  try {
    const path = new URL(url).pathname;
    const parts = path.split("/");
    return decodeURIComponent(parts[parts.length - 1]) || fallback;
  } catch {
    const parts = url.split("?")[0].split("/");
    return decodeURIComponent(parts[parts.length - 1]) || fallback;
  }
}

type DocType = "pdf" | "image" | "word" | "other";

function getDocType(url: string): DocType {
  const ext = getFileExt(url);
  if (ext === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext)) return "image";
  if (["doc", "docx"].includes(ext)) return "word";
  return "other";
}

function DocTypeIcon({ url, size = 22 }: { url: string; size?: number }) {
  const type = getDocType(url);
  const sx = { fontSize: size };
  if (type === "pdf")   return <PictureAsPdfOutlinedIcon sx={{ ...sx, color: "#EF4444" }} />;
  if (type === "image") return <ImageOutlinedIcon sx={{ ...sx, color: "#3B82F6" }} />;
  if (type === "word")  return <DescriptionOutlinedIcon sx={{ ...sx, color: "#2563EB" }} />;
  return <InsertDriveFileOutlinedIcon sx={{ ...sx, color: "#64748B" }} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// useBlobUrl
// Fetches the remote file and creates a local blob:// URL.
// This completely bypasses the browser's cross-origin iframe restriction
// because the iframe src becomes blob://localhost/... (same origin).
// ─────────────────────────────────────────────────────────────────────────────
function useBlobUrl(remoteUrl: string, enabled: boolean) {
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError]     = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!enabled || !remoteUrl) return;

    let objectUrl: string | null = null;
    setLoading(true);
    setError(null);
    setBlobUrl(null);

    fetch(remoteUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} — file not found`);
        return res.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch((err: unknown) => {
        setError((err as Error).message || "Failed to load file");
      })
      .finally(() => setLoading(false));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [remoteUrl, enabled]);

  return { blobUrl, loading, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// DocumentViewer Dialog
// ─────────────────────────────────────────────────────────────────────────────
interface DocumentViewerProps {
  open: boolean;
  url: string;
  name: string;
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ open, url, name, onClose }) => {
  const resolvedUrl = resolveDocUrl(url);
  const type        = getDocType(resolvedUrl);
  const displayName = getFileName(resolvedUrl, name);

  const { blobUrl, loading, error } = useBlobUrl(resolvedUrl, open);

  const handleDownload = () => {
    const src = blobUrl || resolvedUrl;
    const a   = document.createElement("a");
    a.href     = src;
    a.download = displayName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
      PaperProps={{ sx: { borderRadius: "16px", maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column" } }}>

      {/* Header */}
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.5, px: 2.5, borderBottom: "1px solid #F1F5F9", flexShrink: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <DocTypeIcon url={resolvedUrl} size={20} />
          <Typography fontWeight={600} fontSize="14px" color="#1E293B" noWrap maxWidth={400}>{displayName}</Typography>
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Download">
            <IconButton size="small" onClick={handleDownload} sx={{ color: "#475569", "&:hover": { bgcolor: "#F1F5F9" } }}>
              <DownloadOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Open in new tab">
            <IconButton size="small" onClick={() => window.open(resolvedUrl, "_blank", "noopener,noreferrer")} sx={{ color: "#475569", "&:hover": { bgcolor: "#F1F5F9" } }}>
              <OpenInNewOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose} sx={{ color: "#475569", "&:hover": { bgcolor: "#F1F5F9" } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      {/* Body */}
      <DialogContent sx={{ p: 0, flex: 1, overflow: "hidden", bgcolor: "#F8FAFC" }}>

        {/* Loading */}
        {loading && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
            <Stack alignItems="center" spacing={1.5}>
              <CircularProgress size={36} />
              <Typography fontSize="13px" color="text.secondary">Loading file…</Typography>
            </Stack>
          </Box>
        )}

        {/* Error */}
        {!loading && error && (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 2, p: 4 }}>
            <PictureAsPdfOutlinedIcon sx={{ fontSize: 56, color: "#CBD5E1" }} />
            <Typography fontWeight={600} color="#475569">Could not load file</Typography>
            <Typography fontSize="13px" color="text.secondary" textAlign="center">{error}</Typography>
            <Stack direction="row" spacing={1.5} mt={1}>
              <Box component="button" onClick={handleDownload}
                sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 3, py: 1.25, borderRadius: "8px", border: "none", cursor: "pointer", bgcolor: "#1F2937", color: "white", fontWeight: 600, fontSize: "14px", "&:hover": { bgcolor: "#111827" } }}>
                <DownloadOutlinedIcon sx={{ fontSize: 18 }} /> Download
              </Box>
              <Box component="button" onClick={() => window.open(resolvedUrl, "_blank", "noopener,noreferrer")}
                sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 3, py: 1.25, borderRadius: "8px", cursor: "pointer", border: "1px solid #E5E7EB", bgcolor: "white", color: "#374151", fontWeight: 600, fontSize: "14px", "&:hover": { bgcolor: "#F9FAFB" } }}>
                <OpenInNewOutlinedIcon sx={{ fontSize: 18 }} /> Open in Tab
              </Box>
            </Stack>
          </Box>
        )}

        {/* PDF — blob URL = same origin = no cross-origin block */}
        {!loading && !error && blobUrl && type === "pdf" && (
          <iframe
            src={blobUrl}
            title={displayName}
            style={{ width: "100%", height: "78vh", border: "none", display: "block" }}
          />
        )}

        {/* Image */}
        {!loading && !error && blobUrl && type === "image" && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", p: 3, minHeight: 300 }}>
            <Box component="img" src={blobUrl} alt={displayName}
              sx={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: "8px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} />
          </Box>
        )}

        {/* Word / Other */}
        {!loading && !error && (type === "word" || type === "other") && (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 2.5 }}>
            <DocTypeIcon url={resolvedUrl} size={56} />
            <Typography fontWeight={600} color="#1E293B" fontSize="15px">{displayName}</Typography>
            <Typography fontSize="13px" color="text.secondary">This file type cannot be previewed in the browser.</Typography>
            <Stack direction="row" spacing={1.5} mt={1}>
              <Box component="button" onClick={handleDownload}
                sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 3, py: 1.25, borderRadius: "8px", border: "none", cursor: "pointer", bgcolor: "#1F2937", color: "white", fontWeight: 600, fontSize: "14px", "&:hover": { bgcolor: "#111827" } }}>
                <DownloadOutlinedIcon sx={{ fontSize: 18 }} /> Download File
              </Box>
              <Box component="button" onClick={() => window.open(resolvedUrl, "_blank", "noopener,noreferrer")}
                sx={{ display: "flex", alignItems: "center", gap: 0.75, px: 3, py: 1.25, borderRadius: "8px", cursor: "pointer", border: "1px solid #E5E7EB", bgcolor: "white", color: "#374151", fontWeight: 600, fontSize: "14px", "&:hover": { bgcolor: "#F9FAFB" } }}>
                <OpenInNewOutlinedIcon sx={{ fontSize: 18 }} /> Open in New Tab
              </Box>
            </Stack>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DocumentCard
// ─────────────────────────────────────────────────────────────────────────────
interface DocumentCardProps {
  url: string;
  name: string;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ url, name }) => {
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const resolvedUrl = resolveDocUrl(url);
  const displayName = getFileName(resolvedUrl, name);
  const ext  = getFileExt(resolvedUrl).toUpperCase();
  const type = getDocType(resolvedUrl);

  const extColors: Record<DocType, { bg: string; color: string }> = {
    pdf:   { bg: "#FEF2F2", color: "#EF4444" },
    image: { bg: "#EFF6FF", color: "#3B82F6" },
    word:  { bg: "#EFF6FF", color: "#2563EB" },
    other: { bg: "#F8FAFC", color: "#64748B" },
  };
  const { bg, color } = extColors[type];

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(resolvedUrl);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl; a.download = displayName;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
    } catch {
      window.open(resolvedUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <>
      <Box onClick={() => setViewerOpen(true)}
        sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, borderRadius: "10px", border: "1px solid #F1F5F9", bgcolor: "#FFFFFF", cursor: "pointer", transition: "all 0.15s ease", "&:hover": { borderColor: "#E2E8F0", bgcolor: "#F8FAFC", "& .doc-actions": { opacity: 1 } } }}>
        <Box sx={{ width: 40, height: 40, borderRadius: "8px", bgcolor: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <DocTypeIcon url={resolvedUrl} size={20} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontWeight={600} fontSize="13px" color="#1E293B" noWrap title={displayName}>{displayName}</Typography>
          {ext && <Chip label={ext} size="small" sx={{ height: 18, fontSize: "10px", fontWeight: 700, bgcolor: bg, color, borderRadius: "4px", mt: 0.3, "& .MuiChip-label": { px: 0.75 } }} />}
        </Box>
        <Stack className="doc-actions" direction="row" spacing={0.25} sx={{ opacity: 0, transition: "opacity 0.15s", flexShrink: 0 }}>
          <Tooltip title="Preview">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setViewerOpen(true); }} sx={{ color: "#64748B", "&:hover": { color: "#1E293B", bgcolor: "#F1F5F9" } }}>
              <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton size="small" onClick={handleDownload} sx={{ color: "#64748B", "&:hover": { color: "#1E293B", bgcolor: "#F1F5F9" } }}>
              <DownloadOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Open in new tab">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); window.open(resolvedUrl, "_blank", "noopener,noreferrer"); }} sx={{ color: "#64748B", "&:hover": { color: "#1E293B", bgcolor: "#F1F5F9" } }}>
              <OpenInNewOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <DocumentViewer open={viewerOpen} url={resolvedUrl} name={displayName} onClose={() => setViewerOpen(false)} />
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PatientInfoTab
// ─────────────────────────────────────────────────────────────────────────────
interface PatientInfoTabProps {
  lead: LeadRecord;
  leadPhone: string; leadEmail: string; leadLocation: string;
  leadGender: string; leadAge: string; leadMaritalStatus: string;
  leadAddress: string; leadLanguage: string; leadAssigned: string; leadCreatedAt: string;
  partnerName: string; partnerAge: string; partnerGender: string;
  leadSubSource: string; leadCampaignName: string; leadCampaignDuration: string;
  appointmentDepartment: string; appointmentPersonnel: string;
  appointmentDate: string; appointmentSlot: string; appointmentRemark: string;
  treatmentInterest: string[];
  documents: { url: string; name: string }[];
  docsLoading: boolean; docsError: string | null; onClearDocsError: () => void;
}

const PatientInfoTab: React.FC<PatientInfoTabProps> = ({
  leadPhone, leadEmail, leadLocation, leadGender, leadAge, leadMaritalStatus,
  leadAddress, leadLanguage, leadAssigned, leadCreatedAt,
  partnerName, partnerAge, partnerGender,
  leadSubSource, leadCampaignName, leadCampaignDuration,
  appointmentDepartment, appointmentPersonnel, appointmentDate,
  appointmentSlot, appointmentRemark, treatmentInterest,
  documents, docsLoading, docsError, onClearDocsError,
}) => (
  <Stack direction="row" spacing={3}>
    {/* LEFT */}
    <Box sx={{ flex: 2 }}>
      <Card sx={{ p: 3, borderRadius: "16px", mb: 1, bgcolor: "#fcfcfc", boxShadow: "none", border: "none", mt: -1 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={3}>Basic Information</Typography>
        <Divider sx={{ mb: 1, mt: -2, mx: -3 }} />

        <Typography variant="caption" fontWeight={500} color="#232323" display="block" mb={2} sx={{ textTransform: "uppercase", letterSpacing: "1px" }}>Lead Information</Typography>
        <Stack spacing={3}>
          <Stack direction="row" spacing={6}><Info label="CONTACT NO" value={leadPhone} /><Info label="EMAIL" value={leadEmail} /><Info label="LOCATION" value={leadLocation} /></Stack>
          <Stack direction="row" spacing={6}><Info label="GENDER" value={leadGender} /><Info label="AGE" value={leadAge} /><Info label="MARITAL STATUS" value={leadMaritalStatus} /></Stack>
          <Stack direction="row" spacing={6}><Info label="ADDRESS" value={leadAddress} /><Info label="LANGUAGE PREFERENCE" value={leadLanguage} /><Info label="ASSIGNED TO" value={leadAssigned} isAvatar /></Stack>
          <Info label="CREATED DATE & TIME" value={leadCreatedAt} />
        </Stack>

        <Divider sx={{ mb: 2, mt: 2, mx: -3 }} />
        <Typography variant="caption" fontWeight={500} color="#232323" display="block" mb={2} sx={{ textTransform: "uppercase", letterSpacing: "1px" }}>Partner Information</Typography>
        <Stack direction="row" spacing={6}><Info label="FULL NAME" value={partnerName} /><Info label="AGE" value={partnerAge} /><Info label="GENDER" value={partnerGender} /></Stack>

        <Divider sx={{ mb: 2, mt: 2, mx: -3 }} />
        <Typography variant="caption" fontWeight={500} color="#232323" display="block" mb={2} sx={{ textTransform: "uppercase", letterSpacing: "1px" }}>Source & Campaign Details</Typography>
        <Stack direction="row" spacing={6}><Info label="SUB-SOURCE" value={leadSubSource} /><Info label="CAMPAIGN NAME" value={leadCampaignName} /><Info label="CAMPAIGN DURATION" value={leadCampaignDuration} /></Stack>
      </Card>
    </Box>

    {/* RIGHT */}
    <Stack spacing={3} sx={{ flex: 1 }}>
      {/* Appointment */}
      <Card sx={{ p: 3, bgcolor: "#fcfffa", borderRadius: "10px", border: "none", mt: -1 }}>
        <Typography color="#16A34A" fontWeight={700} variant="subtitle2" mb={2}>Appointment</Typography>
        <Divider sx={{ mb: 1, mt: 1, mx: -3 }} />
        <Stack direction="row" mb={2}>
          <Box sx={{ flex: 1 }}><Typography variant="caption" color="text.secondary">DEPARTMENT</Typography><Typography fontWeight={600} variant="body2">{appointmentDepartment}</Typography></Box>
          <Box sx={{ flex: 1 }}><Typography variant="caption" color="text.secondary">PERSONNEL</Typography><Typography fontWeight={600} variant="body2">{appointmentPersonnel}</Typography></Box>
        </Stack>
        <Stack direction="row" mb={2}>
          <Box sx={{ flex: 1 }}><Typography variant="caption" color="text.secondary">DATE</Typography><Typography fontWeight={600} variant="body2">{appointmentDate}</Typography></Box>
          <Box sx={{ flex: 1 }}><Typography variant="caption" color="text.secondary">SLOT</Typography><Typography fontWeight={600} variant="body2">{appointmentSlot}</Typography></Box>
        </Stack>
        <Typography variant="caption" color="text.secondary">REMARK</Typography>
        <Typography fontWeight={600} variant="body2">{appointmentRemark}</Typography>
      </Card>

      {/* Treatment */}
      <Card sx={{ p: 3, borderRadius: "10px", backgroundColor: "#fcfcfc", border: "none", boxShadow: "none" }}>
        <Typography fontWeight={700} variant="subtitle2" mb={2}>Treatment Interest</Typography>
        <Divider sx={{ mb: 2, mx: -3 }} />
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {treatmentInterest.length > 0 ? treatmentInterest.map((t, i) => (
            <Chip key={i} label={t} size="small" sx={{ bgcolor: "#F5F3FF", color: "#7C3AED", fontWeight: 500, mb: 1 }} />
          )) : <Typography variant="body2" color="text.secondary">No treatments selected</Typography>}
        </Stack>
      </Card>

      {/* Documents */}
      <Card sx={{ p: 2, borderRadius: "10px", mb: 2, backgroundColor: "#fcfcfc", border: "none", boxShadow: "none" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography fontWeight={700} variant="subtitle2">Documents</Typography>
          {documents.length > 0 && (
            <Chip label={`${documents.length} file${documents.length > 1 ? "s" : ""}`} size="small"
              sx={{ height: 20, fontSize: "11px", fontWeight: 600, bgcolor: "#F1F5F9", color: "#475569", "& .MuiChip-label": { px: 1 } }} />
          )}
        </Stack>
        <Divider sx={{ mb: 2, mx: -2 }} />

        {docsLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <Stack alignItems="center" spacing={1}><CircularProgress size={22} /><Typography variant="caption" color="text.secondary">Loading documents…</Typography></Stack>
          </Box>
        ) : docsError ? (
          <Alert severity="error" onClose={onClearDocsError} sx={{ borderRadius: "8px", fontSize: "12px" }}>{docsError}</Alert>
        ) : documents.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <InsertDriveFileOutlinedIcon sx={{ fontSize: 36, color: "#CBD5E1", mb: 0.5 }} />
            <Typography variant="caption" color="text.secondary" display="block">No documents uploaded</Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {documents.map((doc, idx) => <DocumentCard key={idx} url={doc.url} name={doc.name} />)}
          </Stack>
        )}
      </Card>
    </Stack>
  </Stack>
);

export default PatientInfoTab;