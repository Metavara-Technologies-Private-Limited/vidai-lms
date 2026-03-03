import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import { useMemo } from "react";
import { useSelector } from "react-redux";

import type { SlaAlert } from "../../types/dashboard.types";
import { slaAlertsStyles } from "../../styles/dashboard/SlaAlerts.styles";
import { selectLeads } from "../../store/leadSlice";
import type { Lead } from "../../services/leads.api";

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

const NEW_FOR_YOU_THRESHOLD_HOURS = 12;
const MAX_ALERTS = 15;

const normalizeLeadStatus = (status?: string | null): string => {
  if (!status) return "";
  return status.toLowerCase().trim().replace(/[_\s]+/g, "-");
};

const getMinutesSince = (isoDate?: string): number | null => {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;

  return Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60)));
};

const formatRelativeTime = (minutesSince: number): string => {
  if (minutesSince < 60) return `${minutesSince} min ago`;

  const hours = Math.floor(minutesSince / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  return `${days} day ago`;
};

const buildAlertForLead = (lead: Lead, minutesSince: number, id: number): SlaAlert => {
  const normalizedStatus = normalizeLeadStatus(lead.lead_status);
  const isEarlier = minutesSince > NEW_FOR_YOU_THRESHOLD_HOURS * 60;

  if (isEarlier) {
    return {
      id,
      title: "Lead at risk of going cold",
      time: formatRelativeTime(minutesSince),
      description: `${lead.full_name} has no recent follow-up activity`,
      severity: "high",
    };
  }

  if (normalizedStatus === "new" || normalizedStatus === "new-lead" || normalizedStatus === "new-leads") {
    return {
      id,
      title: `Hot lead waiting for first contact for ${minutesSince} mins`,
      time: formatRelativeTime(minutesSince),
      description: "Immediate follow-up required to avoid drop-off",
      severity: minutesSince >= 30 ? "high" : "medium",
    };
  }

  return {
    id,
    title: "SLA nearing breach for lead follow-up",
    time: formatRelativeTime(minutesSince),
    description: `${lead.full_name} requires timely action`,
    severity: minutesSince >= 30 ? "high" : "medium",
  };
};

const SlaAlerts = () => {
  const leads = useSelector(selectLeads);

  const { newAlerts, earlier } = useMemo(() => {
    const activeLeads = leads.filter((lead) => lead.is_active !== false);

    const generatedAlerts = activeLeads
      .map((lead, index) => {
        const minutesSince = getMinutesSince(lead.modified_at || lead.created_at);
        if (minutesSince === null) return null;

        return {
          alert: buildAlertForLead(lead, minutesSince, index + 1),
          minutesSince,
        };
      })
      .filter((entry): entry is { alert: SlaAlert; minutesSince: number } => entry !== null)
      .sort((a, b) => a.minutesSince - b.minutesSince)
      .slice(0, MAX_ALERTS);

    const newForYou = generatedAlerts
      .filter((entry) => entry.minutesSince <= NEW_FOR_YOU_THRESHOLD_HOURS * 60)
      .map((entry) => entry.alert);

    const earlierAlerts = generatedAlerts
      .filter((entry) => entry.minutesSince > NEW_FOR_YOU_THRESHOLD_HOURS * 60)
      .map((entry) => entry.alert);

    return {
      newAlerts: newForYou,
      earlier: earlierAlerts,
    };
  }, [leads]);

  return (
    <Box>
      <Typography variant="h6" mb={2}>
        SLA Alerts
      </Typography>

      <Box sx={slaAlertsStyles.scrollArea}>
        <Typography variant="caption" color="text.secondary">
          NEW FOR YOU ({newAlerts.length})
        </Typography>

        <Box mt={2}>
          {newAlerts.length > 0 ? (
            newAlerts.map((alert) => <AlertItem key={alert.id} alert={alert} />)
          ) : (
            <Typography variant="caption" color="text.secondary">
              No new SLA alerts
            </Typography>
          )}
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={slaAlertsStyles.sectionLabel}
        >
          EARLIER ({earlier.length})
        </Typography>

        <Box mt={2}>
          {earlier.length > 0 ? (
            earlier.map((alert) => <AlertItem key={alert.id} alert={alert} />)
          ) : (
            <Typography variant="caption" color="text.secondary">
              No earlier SLA alerts
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default SlaAlerts;
