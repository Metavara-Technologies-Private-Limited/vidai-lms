import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import StarIcon from "@mui/icons-material/Star";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ForumIcon from "@mui/icons-material/Forum";
import PercentIcon from "@mui/icons-material/Percent";

const cardData = [
  {
    title: "Avg Rating",
    value: "4.6",
    icon: <StarIcon sx={{ color: "#F4B400" }} />,
    bg: "#FFF6E5",
  },
  {
    title: "Reviews Requests Sent",
    value: "2,451",
    icon: <SendIcon sx={{ color: "#5C9CE5" }} />,
    bg: "#EEF4FF",
  },
  {
    title: "Reviews Submitted",
    value: "1,451",
    icon: <CheckCircleIcon sx={{ color: "#4CAF50" }} />,
    bg: "#EAF7EF",
  },
  {
    title: "Total Reviews",
    value: "2,015",
    icon: <ForumIcon sx={{ color: "#F2994A" }} />,
    bg: "#FFF3E8",
  },
  {
    title: "Conversion Rate",
    value: "31.2%",
    icon: <PercentIcon sx={{ color: "#7E57C2" }} />,
    bg: "#F3EEFF",
  },
];

const ReputationHeaderCards = () => {
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
            borderRadius: 3,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            backgroundColor: "#fff",
            border: "1px solid #eee",
            boxShadow: "none",
          }}
        >
          {/* Icon */}
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

          {/* Title */}
          <Typography
            sx={{
              fontSize: 13,
              color: "#8A8A8A",
              mb: 0.5,
            }}
          >
            {card.title}
          </Typography>

          {/* Value */}
          <Typography
            sx={{
              fontSize: 20,
              fontWeight: 600,
              color: "#1A1A1A",
            }}
          >
            {card.value}
          </Typography>
        </Card>
      ))}
    </Box>
  );
};

export default ReputationHeaderCards;