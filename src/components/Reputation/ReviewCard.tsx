import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";

<<<<<<< Updated upstream
import StarIcon from "@mui/icons-material/Star";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
=======
>>>>>>> Stashed changes
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import GroupIcon from "@mui/icons-material/Group";

import dayjs from "dayjs";

type Props = {
  campaign: any;
};

const PlatformIcon = ({ platform }: { platform: string }) => {
  const p = (platform || "").toLowerCase();
  if (p === "instagram") return <InstagramIcon sx={{ color: "#E1306C", fontSize: 18 }} />;
  if (p === "facebook")  return <FacebookIcon  sx={{ color: "#1877F2", fontSize: 18 }} />;
  if (p === "linkedin")  return <LinkedInIcon  sx={{ color: "#0A66C2", fontSize: 18 }} />;
  return null;
};

const getStatusStyle = (status: string, isActive: boolean) => {
  const s = (status || "").toLowerCase();
  if (s === "live" || isActive)   return { background: "#EAF7EF", color: "#2E7D32" };
  if (s === "scheduled")          return { background: "#EEF4FF", color: "#1565C0" };
  if (s === "draft")              return { background: "#F5F5F5", color: "#616161" };
  return                                 { background: "#FFF3E8", color: "#E65100" };
};

const ReviewCard = ({ campaign }: Props) => {
  const name = campaign.campaign_name || campaign.name || "Untitled Campaign";
  const status = campaign.status || (campaign.is_active ? "Live" : "Draft");

  // Platforms from social_configs (primary) or platforms array (fallback)
  const platforms: string[] = campaign.social_configs?.length
    ? campaign.social_configs
        .filter((sc: any) => sc.is_active)
        .map((sc: any) => (sc.platform_name || "").toLowerCase())
    : (campaign.platforms || []).map((p: string) => p.toLowerCase());

  const leadGenerated = campaign.lead_generated ?? campaign.leads_count ?? 0;

  const budgetData = campaign.budget_data || {};
  const budgetTotal =
    budgetData.total ||
    Object.entries(budgetData)
      .filter(([k]) => k !== "total")
      .reduce((s, [, v]) => s + Number(v), 0) ||
    campaign.total_spend ||
    0;

  const startDate = campaign.start_date || campaign.start || "";
  const endDate   = campaign.end_date   || campaign.end   || "";
  const formattedStart = startDate ? dayjs(startDate).format("DD/MM/YYYY") : "-";
  const formattedEnd   = endDate   ? dayjs(endDate).format("DD/MM/YYYY")   : "-";

  const statusStyle = getStatusStyle(status, campaign.is_active);

  const modeLabel =
    campaign.campaign_mode === "organic_posting"  ? "Organic"
    : campaign.campaign_mode === "paid_advertising" ? "Paid"
    : campaign.campaign_mode || "Social";

<<<<<<< Updated upstream
const ReviewCard = ({ onOpen }: { onOpen: () => void }) => {

=======
>>>>>>> Stashed changes
  return (
    <Card
      onClick={onOpen}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: "1px solid #E5E7EB",
        boxShadow: "none",
        width: "100%",
<<<<<<< Updated upstream
        cursor: "pointer",
=======
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 4px 16px rgba(0,0,0,0.08)" },
>>>>>>> Stashed changes
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 36, height: 36, borderRadius: 2,
              background: "#EEF4FF", display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <AutoAwesomeIcon sx={{ color: "#5C9CE5", fontSize: 18 }} />
          </Box>
          <Typography
            sx={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3, maxWidth: 160, wordBreak: "break-word" }}
          >
            {name}
          </Typography>
        </Box>

        <Box
          sx={{
            px: 1.5, py: 0.4, borderRadius: 10,
            fontSize: 12, fontWeight: 500, whiteSpace: "nowrap",
            ...statusStyle,
          }}
        >
          {status}
        </Box>
      </Box>

      {/* Platform chips */}
      {platforms.length > 0 && (
        <Box sx={{ display: "flex", gap: 0.8, mb: 2, flexWrap: "wrap" }}>
          {platforms.map((p) => (
            <Chip
              key={p}
              icon={<PlatformIcon platform={p} />}
              label={p.charAt(0).toUpperCase() + p.slice(1)}
              size="small"
              sx={{ fontSize: 11, height: 24, background: "#F9FAFB", border: "1px solid #E5E7EB" }}
            />
          ))}
        </Box>
      )}

      {/* Stats */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>LEADS</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <GroupIcon sx={{ fontSize: 14, color: "#5C9CE5" }} />
            <Typography sx={{ fontWeight: 500 }}>{leadGenerated}</Typography>
          </Box>
        </Box>

        <Box>
          <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>BUDGET</Typography>
          <Typography sx={{ fontWeight: 500 }}>
            {budgetTotal > 0 ? `$${budgetTotal}` : "Organic"}
          </Typography>
        </Box>

        <Box>
          <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>MODE</Typography>
          <Typography sx={{ fontWeight: 500, fontSize: 13 }}>{modeLabel}</Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Footer */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>PLATFORMS</Typography>
          <Box sx={{ display: "flex", gap: 0.5, mt: 0.3 }}>
            {platforms.map((p) => <PlatformIcon key={p} platform={p} />)}
          </Box>
        </Box>

        <Box sx={{ textAlign: "right" }}>
          <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>DURATION</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <CalendarMonthIcon sx={{ fontSize: 13, color: "#9CA3AF" }} />
            <Typography sx={{ fontSize: 12 }}>{formattedStart} – {formattedEnd}</Typography>
          </Box>
        </Box>
      </Box>
    </Card>
  );
};

export default ReviewCard;