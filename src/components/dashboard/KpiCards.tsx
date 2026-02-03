import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";

import { mockData } from "./mockData";
import { kpiCardsStyles } from "../../styles/dashboard/KpiCards.styles";

const KpiCards = () => {
  return (
    <Box sx={kpiCardsStyles.grid}>
      {mockData.kpis.map((item) => (
        <Card key={item.id} sx={kpiCardsStyles.card}>
          <Typography variant="body2" sx={kpiCardsStyles.label}>
            {item.label}
          </Typography>
          <Typography variant="h5" sx={kpiCardsStyles.value}>
            {item.value}
          </Typography>
        </Card>
      ))}
    </Box>
  );
};

export default KpiCards;
