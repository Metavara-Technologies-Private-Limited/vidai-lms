import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

import StarIcon from "@mui/icons-material/Star";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
//import MailIcon from "@mui/icons-material/Mail";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

const ReviewCard = () => {
  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: "1px solid #E5E7EB",
        boxShadow: "none",
        width: "100%",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              background: "#EEF4FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AutoAwesomeIcon sx={{ color: "#5C9CE5", fontSize: 18 }} />
          </Box>

          <Typography sx={{ fontWeight: 600 }}>
            Post-Consultation Feedback
          </Typography>
        </Box>

        {/* Status */}
        <Box
          sx={{
            px: 1.5,
            py: 0.4,
            borderRadius: 10,
            fontSize: 12,
            background: "#EAF7EF",
            color: "#2E7D32",
            fontWeight: 500,
          }}
        >
          Sent
        </Box>
      </Box>

      {/* Stats */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>
            REQUEST SENT :
          </Typography>
          <Typography sx={{ fontWeight: 500 }}>215</Typography>
        </Box>

        <Box>
          <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>
            REVIEW SUBMITTED :
          </Typography>
          <Typography sx={{ fontWeight: 500 }}>125</Typography>
        </Box>

        <Box>
          <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>
            AVG. RATING :
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <StarIcon sx={{ color: "#F4B400", fontSize: 16 }} />
            <Typography sx={{ fontWeight: 500 }}>4.8</Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Bottom */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>
            MODE:
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <WhatsAppIcon sx={{ color: "#25D366", fontSize: 18 }} />
            <Typography sx={{ fontSize: 14 }}>WhatsApp</Typography>
          </Box>
        </Box>

        <Box>
          <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>
            DATE & TIME :
          </Typography>

          <Typography sx={{ fontSize: 14 }}>
            19/01/2025, 11:40 AM
          </Typography>
        </Box>
      </Box>
    </Card>
  );
};

export default ReviewCard;