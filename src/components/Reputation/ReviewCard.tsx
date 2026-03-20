import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

import StarIcon from "@mui/icons-material/Star";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

type ReviewRequest = {
  id: string;
  request_name: string;
  status: string;
  requests_sent?: number;
  reviews_submitted?: number;
  avg_rating?: number;
  mode?: string;
  created_at?: string;
};

type ReviewCardProps = {
  request: ReviewRequest;
  onOpen: () => void;
};

const ReviewCard = ({ request, onOpen }: ReviewCardProps) => {
  const normalizedStatus = (request.status || "draft").toLowerCase();
  const statusLabel =
    normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);

  const statusStyles =
    normalizedStatus === "draft"
      ? { background: "#F3F4F6", color: "#4B5563" }
      : normalizedStatus === "scheduled"
        ? { background: "#FEF3C7", color: "#92400E" }
        : { background: "#EAF7EF", color: "#2E7D32" };

  return (
    <Card
      onClick={onOpen}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: "1px solid #E5E7EB",
        boxShadow: "none",
        width: "100%",
        cursor: "pointer",
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
            {request.request_name}
          </Typography>
        </Box>

        {/* Status */}
        <Box
          sx={{
            px: 1.5,
            py: 0.4,
            borderRadius: 10,
            fontSize: 12,
            ...statusStyles,
            fontWeight: 500,
          }}
        >
          {statusLabel}
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
          <Typography sx={{ fontWeight: 500 }}>
            {request.requests_sent || 0}
          </Typography>
        </Box>

        <Box>
          <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>
            REVIEW SUBMITTED :
          </Typography>
          <Typography sx={{ fontWeight: 500 }}>
            {request.reviews_submitted || 0}
          </Typography>
        </Box>

        <Box>
          <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>
            AVG. RATING :
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <StarIcon sx={{ color: "#F4B400", fontSize: 16 }} />
            <Typography sx={{ fontWeight: 500 }}>
              {request.avg_rating || 0}
            </Typography>
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
          <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>MODE:</Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography sx={{ fontSize: 14 }}>
              {request.mode || "Email"}
            </Typography>
          </Box>
        </Box>

        <Box>
          <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>
            DATE & TIME :
          </Typography>

          <Typography sx={{ fontSize: 14 }}>
            {request.created_at
              ? new Date(request.created_at).toLocaleString()
              : "-"}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
};

export default ReviewCard;
