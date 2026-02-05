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
import SourcePerformanceChart from "./SourcePerformanceChart";
import CommunicationChart from "./CommunicationChart";
import ConversionTrendChart from "./ConversionTrendChart";
import LeadPipelineFunnel from "./LeadPipelineFunnel";
import AppointmentsChart from "./AppointmentsChart";
import TeamPerformanceTab from "./TeamPerformanceTab";

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
        alignItems: "start",
        height: "auto",
        overflow: "hidden",
      }}
    >
      {/* TITLE + KPI CARDS (FULL WIDTH) */}
      <Box sx={{ gridColumn: "1 / -1" }}>
        <Typography
          sx={{ mb: 1 }}
          fontWeight={700}
          fontSize="18px"
          color="#232323"
        >
          Refer MD Dashboard
        </Typography>

        <KpiCards />
      </Box>

      {/* LEFT CONTENT */}
      <Box>
        <Card sx={{ p: 2 }}>
          {/* HEADER */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography
              sx={{
                fontWeight: 650,
                fontSize: "14px",
                color: "#232323",
              }}
            >
              Over View
            </Typography>

            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          </Box>

          {/* TABS */}
          <Box mb={2}>
            <OverviewTabs value={activeTab} onChange={setActiveTab} />
          </Box>

          {/* TAB CONTENT */}
          {activeTab === "source" && <SourcePerformanceChart />}
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
          maxHeight: "calc(100vh - 240px)",
          overflowY: "auto",
          alignSelf: "start",
          minHeight: "100%",
        }}
      >
        <SlaAlerts />
      </Card>
    </Box>
  );
};

export default DashboardLayout;
