import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import { useEffect, useState, lazy, Suspense } from "react";
import { useDispatch, useSelector } from "react-redux";
import KpiCards from "./KpiCards";
import SlaAlerts from "./SlaAlerts";
import TimeRangeSelector from "./TimeRangeSelector";
import type { TimeRange } from "./TimeRangeSelector";
import OverviewTabs from "./OverviewTabs";
import type { OverviewTab } from "./OverviewTabs";
import type { AppDispatch } from "../../store";
import {
  // fetchLeads,
  // selectLeads,
  selectLeadsLoading,
} from "../../store/leadSlice";
import { fetchCampaign, selectCampaign } from "../../store/campaignSlice";
// import { selectClinic } from "../../store/clinicSlice";
import { CircularProgress } from "@mui/material";

const SourcePerformanceChart = lazy(() => import("./SourcePerformanceChart"));
const CommunicationChart = lazy(() => import("./CommunicationChart"));
const ConversionTrendChart = lazy(() => import("./ConversionTrendChart"));
const LeadPipelineFunnel = lazy(() => import("./LeadPipelineFunnel"));
const AppointmentsChart = lazy(() => import("./AppointmentsChart"));
const TeamPerformanceTab = lazy(() => import("./TeamPerformanceTab"));

const DashboardLayout = () => {
  const dispatch = useDispatch<AppDispatch>();
  // const leads = useSelector(selectLeads);
  const campaigns = useSelector(selectCampaign);
  const leadsLoading = useSelector(selectLeadsLoading);
  // const clinic = useSelector(selectClinic);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [activeTab, setActiveTab] = useState<OverviewTab>("source");

  // load leads and campaigns once when the dashboard mounts
  useEffect(() => {
    // Always fetch leads; leadSlice handles clinic fallback internally.
    if (campaigns.length === 0) {
      dispatch(fetchCampaign());
    }
  }, [campaigns.length, dispatch]);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          xl: "minmax(0, 3fr) minmax(320px, 1fr)",
        },
        gap: 2,
        height: "auto",
        minWidth: 0,
        alignItems: "stretch",
      }}
    >
      {/* LEFT SECTION */}
      <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        {leadsLoading && (
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              Loading leads...
            </Typography>
          </Box>
        )}{" "}
        {/* ADD */}
        <Typography variant="h6" pb={2}>
          Refera MD Dashboard
        </Typography>
        <KpiCards timeRange={timeRange} />
        <Card
          sx={{
            p: { xs: 1.25, sm: 2 },
            mt: 2,
            border: "1px solid",
            borderColor: "rgba(0, 0, 0, 0.05)",
            flex: 1,
            overflow: "auto",
            minWidth: 0,
            minHeight: 360,
          }}
        >
          {/* HEADER */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            flexWrap="wrap"
            gap={1.25}
            mb={2}
          >
            <Typography fontWeight={600}>Overview</Typography>

            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          </Box>

          {/* TABS */}
          <Box>
            <OverviewTabs value={activeTab} onChange={setActiveTab} />
          </Box>

          {/* TAB CONTENT */}
          <Suspense
            fallback={
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">
                  Loading chart...
                </Typography>
              </Box>
            }
          >
            {activeTab === "source" && (
              <SourcePerformanceChart timeRange={timeRange} />
            )}
            {activeTab === "communication" && (
              <CommunicationChart timeRange={timeRange} />
            )}
            {activeTab === "conversion" && (
              <ConversionTrendChart timeRange={timeRange} />
            )}
            {activeTab === "pipeline" && (
              <LeadPipelineFunnel timeRange={timeRange} />
            )}
            {activeTab === "appointments" && (
              <AppointmentsChart timeRange={timeRange} />
            )}
            {activeTab === "team" && (
              <TeamPerformanceTab timeRange={timeRange} />
            )}
          </Suspense>
        </Card>
      </Box>

      {/* RIGHT SLA CARD */}
      <Card
        sx={{
          p: { xs: 1.25, sm: 2 },
          overflow: "auto",
          minWidth: 0,
          minHeight: { xs: 320, md: 360 },
        }}
      >
        <SlaAlerts />
      </Card>
    </Box>
  );
};

export default DashboardLayout;
