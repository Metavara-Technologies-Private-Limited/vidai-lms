import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import KpiCards from "../dashboard/KpiCards";
import SlaAlerts from "../dashboard/SlaAlerts";
import TimeRangeSelector from "../dashboard/TimeRangeSelector";
import type { TimeRange } from "../dashboard/TimeRangeSelector";
import OverviewTabs from "../dashboard/OverviewTabs";
import type { OverviewTab } from "../dashboard/OverviewTabs";
import SourcePerformanceChart from "../dashboard/SourcePerformanceChart";
import CommunicationChart from "../dashboard/CommunicationChart";
import ConversionTrendChart from "../dashboard/ConversionTrendChart";
import LeadPipelineFunnel from "../dashboard/LeadPipelineFunnel";
import AppointmentsChart from "../dashboard/AppointmentsChart";
import TeamPerformanceTab from "../dashboard/TeamPerformanceTab";

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
  <SourcePerformanceChart />
)}
                    {activeTab === "communication" && <CommunicationChart />}
          {activeTab === "conversion" && <ConversionTrendChart />}

          {activeTab === "pipeline" && <LeadPipelineFunnel />}
          
          {activeTab === "appointments" && <AppointmentsChart />}

          {activeTab === "team" && <TeamPerformanceTab />}

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
