import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";

import { mockData } from "./mockData";
import type { SlaAlert } from "../../types/dashboard.types";
import { slaAlertsStyles } from "../../styles/dashboard/SlaAlerts.style";

const AlertItem = ({ alert }: { alert: SlaAlert }) => {
  return (
    <Box sx={slaAlertsStyles.alertItem}>
      <Avatar sx={slaAlertsStyles.avatar(alert.severity)}>
        !
      </Avatar>
      <Box>
        <Typography variant="body2" fontWeight={600}>
          {alert.title}{" "}
          <Typography component="span" variant="caption" color="text.secondary">
            ({alert.time})
          </Typography>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {alert.description}
        </Typography>
      </Box>
    </Box>
  );
};

const SlaAlerts = () => {
  const { new: newAlerts, earlier } = mockData.slaAlerts;

  return (
    <Box>
      <Typography variant="h6" mb={2}>
        SLA Alerts
      </Typography>

      <Typography variant="caption" color="text.secondary">
        NEW FOR YOU
      </Typography>

      <Box mt={2}>
        {newAlerts.map((alert) => (
          <AlertItem key={alert.id} alert={alert} />
        ))}
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={slaAlertsStyles.sectionLabel}
      >
        EARLIER
      </Typography>

      <Box mt={2}>
        {earlier.map((alert) => (
          <AlertItem key={alert.id} alert={alert} />
        ))}
      </Box>
    </Box>
  );
};

export default SlaAlerts;
