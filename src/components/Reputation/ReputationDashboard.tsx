import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import TablePagination from "@mui/material/TablePagination";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import EmailIcon from "@mui/icons-material/Email";
import GoogleIcon from "@mui/icons-material/Google";
import PhoneIcon from "@mui/icons-material/Phone";
import CampaignIcon from "@mui/icons-material/Campaign";
import PeopleIcon from "@mui/icons-material/People";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import StarIcon from "@mui/icons-material/Star";

<<<<<<< Updated upstream
import Backward_icon from "../../assets/icons/Backward_icon.svg";

import ReputationHeaderCards from "./ReputationHeaderCards";
import ReputationFilter from "./ReputationFilter";
import ReviewRequest from "./ReviewRequest";
import ReviewCard from "./ReviewCard";
import ReviewCardDetailedView from "./ReviewCardDetailedView";
=======
import {
  fetchCampaign,
  selectCampaign,
  selectCampaignLoading,
} from "../../store/campaignSlice";
import type { AppDispatch } from "../../store";
>>>>>>> Stashed changes

// ── Inline ReviewRequest ──────────────────────────────────────────────────────
const ReviewRequest = ({ open, onClose }: { open: boolean; onClose: () => void }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
    <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      New Review Request
      <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
    </DialogTitle>
    <DialogContent dividers>
      <Typography color="text.secondary" fontSize={14}>Review request feature coming soon.</Typography>
    </DialogContent>
    <DialogActions><Button onClick={onClose} size="small">Close</Button></DialogActions>
  </Dialog>
);

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { label: "All",        value: "all",       icon: <CampaignIcon sx={{ fontSize: 16 }} /> },
  { label: "Facebook",   value: "facebook",  icon: <FacebookIcon  sx={{ fontSize: 16, color: "#1877F2" }} /> },
  { label: "Instagram",  value: "instagram", icon: <InstagramIcon sx={{ fontSize: 16, color: "#E1306C" }} /> },
  { label: "LinkedIn",   value: "linkedin",  icon: <LinkedInIcon  sx={{ fontSize: 16, color: "#0A66C2" }} /> },
  { label: "Google Ads", value: "google",    icon: <GoogleIcon    sx={{ fontSize: 16, color: "#EA4335" }} /> },
  { label: "Email",      value: "email",     icon: <EmailIcon     sx={{ fontSize: 16, color: "#F2994A" }} /> },
  { label: "Call",       value: "call",      icon: <PhoneIcon     sx={{ fontSize: 16, color: "#27AE60" }} /> },
];

const PLATFORM_KEYWORDS = ["facebook", "instagram", "linkedin", "google", "email", "call", "whatsapp"];

// ── Safe string ───────────────────────────────────────────────────────────────
const safeStr = (val: any): string =>
  val != null ? String(val).toLowerCase().trim() : "";

// ── Extract platforms from ANY field in the campaign object ───────────────────
const getPlatforms = (c: any): string[] => {
  const found = new Set<string>();

  const scan = (val: any) => {
    if (!val) return;
    const s = safeStr(val);
    for (const kw of PLATFORM_KEYWORDS) {
      if (s.includes(kw)) found.add(kw);
    }
  };

  // 1. social_configs — [{ platform_name: "facebook" }]
  if (Array.isArray(c.social_configs)) {
    c.social_configs.forEach((sc: any) => {
      scan(sc?.platform_name);
      scan(sc?.name);
      scan(sc?.platform);
    });
  }

  // 2. select_ad_accounts — ["facebook", "instagram"]
  if (Array.isArray(c.select_ad_accounts)) {
    c.select_ad_accounts.forEach(scan);
  }

  // 3. platforms array
  if (Array.isArray(c.platforms)) {
    c.platforms.forEach(scan);
  }

  // 4. platform_data object keys — { facebook: "text", instagram: "text" }
  if (c.platform_data && typeof c.platform_data === "object" && !Array.isArray(c.platform_data)) {
    Object.keys(c.platform_data).forEach(scan);
  }

  // 5. campaign_mode, campaign_type, type
  scan(c.campaign_mode);
  scan(c.campaign_type);
  scan(c.type);

  // 6. LAST RESORT: scan campaign name (handles "Facebook IVF Awareness - December")
  //    Only used if nothing else found
  if (found.size === 0) {
    scan(c.campaign_name || c.name || "");
  }

  return Array.from(found);
};

// ── Tab filter ────────────────────────────────────────────────────────────────
const matchesTab = (c: any, tab: string): boolean => {
  if (tab === "all") return true;
  const platforms = getPlatforms(c);
  return platforms.includes(tab === "google" ? "google" : tab);
};

// ── Status chip ───────────────────────────────────────────────────────────────
const getStatusChip = (c: any) => {
  const s = safeStr(c.status);
  if (c.is_active === true || s === "live")  return { label: "Live",      bg: "#EAF7EF", color: "#2E7D32" };
  if (s === "scheduled")                     return { label: "Scheduled", bg: "#EEF4FF", color: "#1565C0" };
  if (s === "draft")                         return { label: "Draft",     bg: "#F5F5F5", color: "#616161" };
  if (s === "completed" || s === "ended")    return { label: "Completed", bg: "#FFF3E8", color: "#E65100" };
  return { label: s || "Draft", bg: "#F5F5F5", color: "#616161" };
};

// ── Platform icon ─────────────────────────────────────────────────────────────
const PlatformBadge = ({ platform }: { platform: string }) => {
  const p = platform.toLowerCase();
  if (p === "instagram")    return <InstagramIcon sx={{ fontSize: 20, color: "#E1306C" }} />;
  if (p === "facebook")     return <FacebookIcon  sx={{ fontSize: 20, color: "#1877F2" }} />;
  if (p === "linkedin")     return <LinkedInIcon  sx={{ fontSize: 20, color: "#0A66C2" }} />;
  if (p.includes("google")) return <GoogleIcon    sx={{ fontSize: 20, color: "#EA4335" }} />;
  if (p.includes("email"))  return <EmailIcon     sx={{ fontSize: 20, color: "#F2994A" }} />;
  if (p.includes("call"))   return <PhoneIcon     sx={{ fontSize: 20, color: "#27AE60" }} />;
  return <CampaignIcon sx={{ fontSize: 20, color: "#9CA3AF" }} />;
};

// ── Main ──────────────────────────────────────────────────────────────────────
const ReputationDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const rawCampaigns = useSelector(selectCampaign);
  const allCampaigns: any[] = Array.isArray(rawCampaigns) ? rawCampaigns : [];
  const loading = useSelector(selectCampaignLoading);

<<<<<<< Updated upstream
  const [openReviewDialog, setOpenReviewDialog] = useState(false);
  const [openReviewDetails, setOpenReviewDetails] = useState(false);

  return (
    <Box sx={{ p: 0.5 }}>

{!openReviewDetails && (
  <Typography variant="h5" sx={{ mb: 3 }}>
    Reputation Management
  </Typography>
)}

      {/* ================= NORMAL PAGE ================= */}
      {!openReviewDetails && (
        <>
          {/* Header Cards */}
          <ReputationHeaderCards />

          {/* Filter + New Review Request */}
          <ReputationFilter onOpen={() => setOpenReviewDialog(true)} />

          {/* Review Request Dialog */}
          <ReviewRequest
            open={openReviewDialog}
            onClose={() => setOpenReviewDialog(false)}
          />

          {/* Review Cards Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 2,
            }}
          >
            <ReviewCard onOpen={() => setOpenReviewDetails(true)} />
            <ReviewCard onOpen={() => setOpenReviewDetails(true)} />
            <ReviewCard onOpen={() => setOpenReviewDetails(true)} />
            <ReviewCard onOpen={() => setOpenReviewDetails(true)} />
            <ReviewCard onOpen={() => setOpenReviewDetails(true)} />
          </Box>
        </>
      )}

      {/* ================= DETAILED VIEW PAGE ================= */}
      {openReviewDetails && (
        <>
          {/* Back Button */}
          <Box
            sx={{
              mb: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
              cursor: "pointer",
              width: "fit-content",
            }}
            onClick={() => setOpenReviewDetails(false)}
          >
            <img src={Backward_icon} alt="Back" width={40} height={40} />

  <Typography
    sx={{
      fontSize: 18,
      fontWeight: 600,
      color: "#232323",
    }}
  >
    Post-Consultation Feedback
  </Typography>
          </Box>

          {/* Header Cards with row related values */}
          <ReputationHeaderCards
            avgRating={4.7}
            reviewsSubmitted={5}
            reviewRequestsSent={10}
          />

          {/* Detailed Table */}
          <ReviewCardDetailedView />
        </>
      )}

=======
  const [activeTab, setActiveTab]     = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openReview, setOpenReview]   = useState(false);
  const [page, setPage]               = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => { dispatch(fetchCampaign()); }, [dispatch]);

  // Debug — open browser console to see actual API shape
  useEffect(() => {
    if (allCampaigns.length > 0) {
      console.log("📦 First campaign raw:", JSON.stringify(allCampaigns[0], null, 2));
      console.log("📦 Second campaign raw:", JSON.stringify(allCampaigns[1], null, 2));
      console.log("🔑 All unique campaign_modes:", [...new Set(allCampaigns.map(c => c.campaign_mode))]);
      console.log("🔑 social_configs samples:", allCampaigns.slice(0,5).map(c => ({ name: c.campaign_name, social_configs: c.social_configs, platform_data: c.platform_data })));
      console.log("✅ getPlatforms(first 5):", allCampaigns.slice(0,5).map(c => ({ name: c.campaign_name, platforms: getPlatforms(c) })));
    }
  }, [allCampaigns.length]);

  const filtered = allCampaigns.filter((c: any) => {
    try {
      if (searchQuery && !safeStr(c.campaign_name || c.name).includes(searchQuery.toLowerCase())) return false;
      return matchesTab(c, activeTab);
    } catch { return false; }
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const tabCampaigns = allCampaigns.filter(c => { try { return matchesTab(c, activeTab); } catch { return false; } });
  const totalImpressions = tabCampaigns.reduce((s, c) => s + (Number(c.impressions ?? c.total_impressions) || 0), 0);
  const totalClicks      = tabCampaigns.reduce((s, c) => s + (Number(c.clicks ?? c.total_clicks) || 0), 0);
  const totalConversions = tabCampaigns.reduce((s, c) => s + (Number(c.conversions ?? c.lead_generated ?? c.leads_count) || 0), 0);
  const totalSpend       = tabCampaigns.reduce((s, c) => s + (Number(c.total_spend ?? c.budget_data?.total) || 0), 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";
  const avgCVR = totalClicks > 0      ? ((totalConversions / totalClicks) * 100).toFixed(1)  : "0.0";
  const avgCPC = totalClicks > 0      ? (totalSpend / totalClicks).toFixed(2)                : "0.00";
  const avgCPL = totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2)           : "0.00";

  const statCards = [
    { label: "Total Impressions",    value: totalImpressions.toLocaleString(), icon: <TrendingUpIcon />,  color: "#5C9CE5" },
    { label: "Total Clicks",         value: totalClicks.toLocaleString(),      icon: <PeopleIcon />,      color: "#27AE60" },
    { label: "Conversions",          value: totalConversions.toLocaleString(), icon: <StarIcon />,        color: "#F2994A" },
    { label: "Total Spend",          value: `$${totalSpend.toLocaleString()}`, icon: <AttachMoneyIcon />, color: "#7E57C2" },
    { label: "CTR (Click-Through)",  value: `${avgCTR}%`,                      icon: <TrendingUpIcon />,  color: "#E91E63" },
    { label: "Conversion Rate",      value: `${avgCVR}%`,                      icon: <TrendingUpIcon />,  color: "#00BCD4" },
    { label: "CPC (Cost per Click)", value: `$${avgCPC}`,                      icon: <AttachMoneyIcon />, color: "#FF9800" },
    { label: "CPA (Cost per Lead)",  value: `$${avgCPL}`,                      icon: <AttachMoneyIcon />, color: "#4CAF50" },
  ];

  return (
    <Box sx={{ p: 3, background: "#F8F9FA", minHeight: "100%" }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>Reports</Typography>

      {/* Tabs */}
      <Box sx={{ background: "#fff", borderRadius: 3, border: "1px solid #E5E7EB", mb: 3, px: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => { setActiveTab(v); setPage(0); }}
            TabIndicatorProps={{ style: { display: "none" } }}
            sx={{
              "& .MuiTab-root": { textTransform: "none", fontWeight: 500, fontSize: 13, minHeight: 48, px: 2, gap: 0.5, borderRadius: 2, color: "#6B7280" },
              "& .Mui-selected": { color: "#1A1A1A !important", background: "#F3F4F6", borderRadius: 2 },
            }}
          >
            {TABS.map(t => <Tab key={t.value} value={t.value} label={t.label} icon={t.icon} iconPosition="start" />)}
          </Tabs>
          <TextField
            size="small" placeholder="Search by campaign name" value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            sx={{ width: 240, "& .MuiOutlinedInput-root": { borderRadius: 2, background: "#F9FAFB", fontSize: 13 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "#9CA3AF", fontSize: 18 }} /></InputAdornment> }}
          />
        </Box>
      </Box>

      {/* Stat cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 1.5, mb: 3 }}>
        {statCards.map(s => (
          <Box key={s.label} sx={{ background: "#fff", borderRadius: 2, border: "1px solid #E5E7EB", p: 2, display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Box sx={{ color: s.color }}>{s.icon}</Box>
            <Typography sx={{ fontSize: 10, color: "#9CA3AF", lineHeight: 1.3 }}>{s.label}</Typography>
            <Typography sx={{ fontSize: 17, fontWeight: 700, color: "#1A1A1A" }}>{s.value}</Typography>
          </Box>
        ))}
      </Box>

      {/* Table */}
      <Box sx={{ background: "#fff", borderRadius: 3, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        <Box sx={{ px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #F3F4F6" }}>
          <Typography sx={{ fontWeight: 600, fontSize: 15 }}>
            Campaigns
            <Chip label={filtered.length} size="small" sx={{ ml: 1, fontSize: 11, height: 20, background: "#F3F4F6" }} />
          </Typography>
          <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => setOpenReview(true)}
            sx={{ textTransform: "none", borderRadius: 2, background: "#1A1A1A", fontSize: 13, "&:hover": { background: "#333" } }}>
            New Review Request
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress size={32} /></Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, color: "#9CA3AF" }}>
            <CampaignIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
            <Typography>No campaigns found</Typography>
            {allCampaigns.length > 0 && (
              <Typography variant="caption" display="block" mt={0.5}>
                {allCampaigns.length} total — try "All" tab or different filter
              </Typography>
            )}
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { background: "#F9FAFB", fontWeight: 600, fontSize: 12, color: "#6B7280", borderBottom: "1px solid #E5E7EB" } }}>
                    <TableCell>Campaign Name</TableCell>
                    <TableCell align="right">Total Impressions</TableCell>
                    <TableCell align="right">Total Clicks</TableCell>
                    <TableCell align="right">Conversions</TableCell>
                    <TableCell align="right">Total Spend</TableCell>
                    <TableCell align="right">CTR</TableCell>
                    <TableCell align="right">Conv. Rate</TableCell>
                    <TableCell align="right">CPC</TableCell>
                    <TableCell align="right">CPA</TableCell>
                    <TableCell>Platforms</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((c: any) => {
                    const name        = c.campaign_name || c.name || "Untitled";
                    const impressions = Number(c.impressions ?? c.total_impressions) || 0;
                    const clicks      = Number(c.clicks ?? c.total_clicks) || 0;
                    const conversions = Number(c.conversions ?? c.lead_generated ?? c.leads_count) || 0;
                    const spend       = Number(c.total_spend ?? c.budget_data?.total) || 0;
                    const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) + "%" : "—";
                    const cvr = clicks > 0      ? ((conversions / clicks) * 100).toFixed(1) + "%" : "—";
                    const cpc = clicks > 0      ? "$" + (spend / clicks).toFixed(2)               : "—";
                    const cpl = conversions > 0 ? "$" + (spend / conversions).toFixed(2)          : "—";
                    const platforms = getPlatforms(c);
                    const chip      = getStatusChip(c);

                    return (
                      <TableRow key={c.id}
                        sx={{ "& td": { fontSize: 13, borderBottom: "1px solid #F3F4F6", py: 1.5 }, "&:hover": { background: "#FAFAFA" } }}>
                        <TableCell sx={{ maxWidth: 220 }}>
                          <Typography noWrap sx={{ fontSize: 13, fontWeight: 500 }}>{name}</Typography>
                        </TableCell>
                        <TableCell align="right">{impressions.toLocaleString()}</TableCell>
                        <TableCell align="right">{clicks.toLocaleString()}</TableCell>
                        <TableCell align="right">{conversions.toLocaleString()}</TableCell>
                        <TableCell align="right">${spend.toLocaleString()}</TableCell>
                        <TableCell align="right">{ctr}</TableCell>
                        <TableCell align="right">{cvr}</TableCell>
                        <TableCell align="right">{cpc}</TableCell>
                        <TableCell align="right">{cpl}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                            {platforms.length > 0
                              ? platforms.map((p, i) => <Box key={i} title={p}><PlatformBadge platform={p} /></Box>)
                              : <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>—</Typography>}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ px: 1.2, py: 0.3, borderRadius: 10, display: "inline-block", fontSize: 11, fontWeight: 500, background: chip.bg, color: chip.color }}>
                            {chip.label}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div" count={filtered.length} page={page}
              onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
              rowsPerPageOptions={[10, 25, 50]}
              sx={{ borderTop: "1px solid #F3F4F6" }}
              labelDisplayedRows={({ from, to, count }) => `Showing ${from} to ${to} of ${count} entries`}
            />
          </>
        )}
      </Box>

      <ReviewRequest open={openReview} onClose={() => setOpenReview(false)} />
>>>>>>> Stashed changes
    </Box>
  );
};

export default ReputationDashboard;