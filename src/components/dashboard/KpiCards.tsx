import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";

import TotalLeadsIcon from "../../assets/icons/TotalLeads.svg";
import NewLeadsIcon from "../../assets/icons/newLeads.svg";
import AppointmentsIcon from "../../assets/icons/appointments.svg";
import FollowUpsIcon from "../../assets/icons/followUps.svg";
import TotalConvertedIcon from "../../assets/icons/totalConverted.svg";
import LostLeadsIcon from "../../assets/icons/lostLeads.svg";

import { mockData } from "./mockData";
import { kpiCardsStyles } from "../../styles/dashboard/KpiCards.styles";

/* KPI → ICON MAP */
const KPI_ICONS: Record<string, string> = {
  totalLeads: TotalLeadsIcon,
  newLeads: NewLeadsIcon,
  appointments: AppointmentsIcon,
  followUps: FollowUpsIcon,
  totalConverted: TotalConvertedIcon,
  lostLeads: LostLeadsIcon,
};

const getCardStyle = (id: string) => {
  switch (id) {
    case "totalLeads":
      return kpiCardsStyles.totalLeads;
    case "newLeads":
      return kpiCardsStyles.newLeads;
    case "appointments":
      return kpiCardsStyles.appointments;
    case "followUps":
      return kpiCardsStyles.followUps;
    case "totalConverted":
      return kpiCardsStyles.totalConverted;
    case "lostLeads":
      return kpiCardsStyles.lostLeads;
    default:
      return {};
  }
};

const KpiCards = () => {
  return (
    <Box sx={kpiCardsStyles.grid}>
      {mockData.kpis.map((item) => (
        <Card
          key={item.id}
          sx={{
            ...kpiCardsStyles.cardBase,
            ...getCardStyle(item.id),
          }}
        >
          {/* ICON */}
          <Box sx={kpiCardsStyles.iconWrapper}>
            <img
              src={KPI_ICONS[item.id]}
              alt={item.label}
              style={kpiCardsStyles.icon}
            />
          </Box>

          {/* ===== TOTAL CONVERTED (SPECIAL LAYOUT) ===== */}
          {item.id === "totalConverted" ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                width: "100%",
                mt: 1,
              }}
            >
              {/* LEFT : LABEL + TOTAL */}
              <Box>
                <Typography sx={kpiCardsStyles.label}>
                  {item.label}
                </Typography>
                <Typography sx={kpiCardsStyles.value}>
                  {item.value}
                </Typography>
              </Box>

              {/* RIGHT : REGISTER / TREATMENT */}
              <Box sx={{ display: "flex", gap: 3 }}>
                {item.breakdown?.map((b) => (
                  <Box key={b.label}>
                    <Typography sx={kpiCardsStyles.breakdownLabel}>
                      {b.label}
                    </Typography>
                    <Typography sx={kpiCardsStyles.breakdownValue}>
                      {b.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            /* ===== NORMAL KPI CARDS ===== */
            <>
              <Typography sx={kpiCardsStyles.label}>
                {item.label}
              </Typography>
              <Typography sx={kpiCardsStyles.value}>
                {item.value}
              </Typography>
            </>
          )}
        </Card>
      ))}
    </Box>
  );
};

export default KpiCards;
