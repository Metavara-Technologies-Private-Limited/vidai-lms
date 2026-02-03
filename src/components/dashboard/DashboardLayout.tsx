import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import KpiCards from "./KpiCards";
import SlaAlerts from "./SlaAlerts";
import TimeRangeSelector from "./TimeRangeSelector";
import type { TimeRange } from "./TimeRangeSelector";
import OverviewTabs from "./OverviewTabs";
import type { OverviewTab } from "./OverviewTabs";

const DashboardLayout = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [activeTab, setActiveTab] = useState<OverviewTab>("source");
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "3fr 1fr",
        },
        gap: 2,
        alignItems: "flex-start",
      }}
    >
      {/* LEFT SECTION */}
      <Box>
        <KpiCards />

        <Card sx={{ p: 2, mt: 2 }}>
          {/* HEADER */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography fontWeight={600}>Over View</Typography>

            <TimeRangeSelector
              value={timeRange}
              onChange={setTimeRange}
            />
          </Box>

          {/* TABS */}
          <Box mb={2}>
            <OverviewTabs
              value={activeTab}
              onChange={setActiveTab}
            />
          </Box>

          {/* TAB CONTENT (placeholder for now) */}
          {activeTab === "source" && (
            <Typography>Source Performance Chart here</Typography>
          )}
                    {activeTab === "communication" && (
            <Typography>communication Chart here</Typography>
          )}
          {activeTab === "conversion" && (
            <Typography>Conversion Trend Chart here</Typography>
          )}  
          {activeTab === "pipeline" && (
            <Typography>Lead Pipeline Funnel Chart here</Typography>
          )}  
          {activeTab === "appointments" && (
            <Typography>Appointments Chart here</Typography>
          )}  
          {activeTab === "team" && (
            <Typography>Team Performance Chart here</Typography>
          )}  
          

        </Card>
      </Box>

      {/* RIGHT SLA CARD */}
      <Card
        sx={{
          p: 2,
          maxHeight: "calc(100vh - 120px)",
          overflowY: "auto",
        }}
      >
        <SlaAlerts />
      </Card>
    </Box>
  );
};

export default DashboardLayout;
