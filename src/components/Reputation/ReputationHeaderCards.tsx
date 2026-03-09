import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";

import ForumIcon from "@mui/icons-material/Forum";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import StarIcon from "@mui/icons-material/Star";
import PercentIcon from "@mui/icons-material/Percent";

type Props = {
  campaigns: any[];
};

const ReputationHeaderCards = ({ campaigns }: Props) => {
  const total = campaigns.length;

  const live = campaigns.filter(
    (c) => (c.status || "").toLowerCase() === "live" || c.is_active === true
  ).length;

  const totalLeads = campaigns.reduce(
    (sum, c) => sum + (c.lead_generated ?? c.leads_count ?? 0),
    0
  );

  const scheduled = campaigns.filter(
    (c) => (c.status || "").toLowerCase() === "scheduled"
  ).length;

  const liveRate = total > 0 ? ((live / total) * 100).toFixed(1) : "0.0";

  const cardData = [
    {
      title: "Total Campaigns",
      value: String(total),
      icon: <ForumIcon sx={{ color: "#F2994A" }} />,
      bg: "#FFF3E8",
    },
    {
      title: "Live Campaigns",
      value: String(live),
      icon: <SendIcon sx={{ color: "#5C9CE5" }} />,
      bg: "#EEF4FF",
    },
    {
      title: "Leads Generated",
      value: String(totalLeads),
      icon: <CheckCircleIcon sx={{ color: "#4CAF50" }} />,
      bg: "#EAF7EF",
    },
    {
      title: "Scheduled",
      value: String(scheduled),
      icon: <StarIcon sx={{ color: "#F4B400" }} />,
      bg: "#FFF6E5",
    },
    {
      title: "Live Rate",
      value: `${liveRate}%`,
      icon: <PercentIcon sx={{ color: "#7E57C2" }} />,
      bg: "#F3EEFF",
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: 2,
        mb: 3,
      }}
    >
      {cardData.map((card) => (
        <Card
          key={card.title}
          sx={{
            p: 2.5,
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            backgroundColor: "#fff",
            border: "1px solid #eee",
            boxShadow: "none",
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: card.bg,
              mb: 1.5,
            }}
          >
            {card.icon}
          </Box>
          <Typography sx={{ fontSize: 13, color: "#8A8A8A", mb: 0.5 }}>
            {card.title}
          </Typography>
          <Typography sx={{ fontSize: 20, fontWeight: 600, color: "#1A1A1A" }}>
            {card.value}
          </Typography>
        </Card>
      ))}
    </Box>
  );
};

export default ReputationHeaderCards;