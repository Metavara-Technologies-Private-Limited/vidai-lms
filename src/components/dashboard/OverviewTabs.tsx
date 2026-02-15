import { Box, Button } from "@mui/material";
import { overviewTabsStyles } from "../../styles/Dashboard/OverviewTabs.styles";

export type OverviewTab =
  | "source"
  | "communication"
  | "conversion"
  | "pipeline"
  | "appointments"
  | "team";

interface Props {
  value: OverviewTab;
  onChange: (value: OverviewTab) => void;
}

const tabs: { label: string; value: OverviewTab }[] = [
  { label: "Source Performance", value: "source" },
  { label: "Communication", value: "communication" },
  { label: "Conversion Trend", value: "conversion" },
  { label: "Lead Pipeline Funnel", value: "pipeline" },
  { label: "Appointments", value: "appointments" },
  { label: "Team Performance", value: "team" },
];

const OverviewTabs = ({ value, onChange }: Props) => {
  return (
    <Box sx={overviewTabsStyles.container}>
      {tabs.map((tab) => (
        <Button
          key={tab.value}
          size="small"
          onClick={() => onChange(tab.value)}
          sx={overviewTabsStyles.tabButton(value === tab.value)}
        >
          {tab.label}
        </Button>
      ))}
    </Box>
  );
};

export default OverviewTabs;
