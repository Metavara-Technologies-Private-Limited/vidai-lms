import { Box, Typography, Stack } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useMemo, useEffect, useState } from "react";
import { chartStyles } from "../../styles/dashboard/SourcePerformanceChart.style";
import SafeResponsiveContainer from "./SafeResponsiveContainer";
import type { TimeRange } from "./TimeRangeSelector";
import type { CustomTooltipProps } from "../../types/dashboard.types";
import { api } from "../../services/leads.api";
import { formatDateForApi, getTimeRangeBounds } from "./timeRange.utils";

interface CommunicationChartProps {
  timeRange: TimeRange;
}

interface PlatformRow {
  platform: string;
  high: number;
  low: number;
  no: number;
}

// ── Fallback shape while loading or on error ──────────────────────────────
// Order: Email → SMS → Call → WhatsApp → Chatbot
const EMPTY_DATA: PlatformRow[] = [
  { platform: "Email",    high: 0, low: 0, no: 0 },
  { platform: "SMS",      high: 0, low: 0, no: 0 },
  { platform: "Call",     high: 0, low: 0, no: 0 },
  { platform: "WhatsApp", high: 0, low: 0, no: 0 },
  { platform: "Chatbot",  high: 0, low: 0, no: 0 },
];

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
    return (
      <Box sx={chartStyles.tooltipContainer}>
        <Typography variant="subtitle2" fontWeight={700}>{total}</Typography>
        <Typography
          variant="caption"
          sx={{ display: "block", mt: 0.5, color: "text.secondary", fontSize: "10px" }}
        >
          {payload[0].value} (High)&nbsp;&nbsp;
          {payload[1].value} (Low)&nbsp;&nbsp;
          {payload[2].value} (No)
        </Typography>
      </Box>
    );
  }
  return null;
};

const CommunicationChart = ({ timeRange }: CommunicationChartProps) => {
  const [rawData, setRawData] = useState<PlatformRow[]>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  // ── Fetch real interaction counts from Django ─────────────────────────────
  useEffect(() => {
    const controller = new AbortController();

    const fetchCounts = async () => {
      try {
        setLoading(true);
        const bounds = getTimeRangeBounds(timeRange);
        const res = await api.get<PlatformRow[]>("/interactions/counts/", {
          params: {
            time_range: timeRange,
            start_date: formatDateForApi(bounds.start),
            end_date: formatDateForApi(bounds.end),
          },
          signal: controller.signal,
        });
        const json = res.data;

        // Ensure correct order: Email, SMS, Call, WhatsApp, Chatbot
        const ordered: PlatformRow[] = EMPTY_DATA.map((empty) => {
          const found = json.find(
            (r) => r.platform.toLowerCase() === empty.platform.toLowerCase()
          );
          return found ?? empty;
        });

        setRawData(ordered);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.warn("InteractionCounts fetch failed:", err);
          setRawData(EMPTY_DATA);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
    return () => controller.abort();
  }, [timeRange]);

  const data: PlatformRow[] = useMemo(() => rawData, [rawData]);

  return (
    <Box sx={chartStyles.container}>
      {/* LEGEND */}
      <Stack direction="row" spacing={2} sx={{ mb: 3, mt: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#7d859d" }} />
          <Typography variant="caption">High</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#a3abc1" }} />
          <Typography variant="caption">Low</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#daddf0" }} />
          <Typography variant="caption">No</Typography>
        </Stack>

        {/* Live badge */}
        {!loading && (
          <Box
            sx={{
              ml: "auto",
              px: 1,
              py: 0.2,
              borderRadius: 1,
              bgcolor: "#e8f5e9",
              border: "1px solid #a5d6a7",
            }}
          >
            <Typography variant="caption" sx={{ color: "#2e7d32", fontSize: "10px" }}>
              ● Live
            </Typography>
          </Box>
        )}
      </Stack>

      {/* CHART */}
      <Box sx={chartStyles.chartWrapper}>
        <SafeResponsiveContainer minHeight={260}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 10, bottom: 0 }}
            barSize={24}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
            <XAxis
              dataKey="platform"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#666" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#666" }}
              label={{
                value: "No. of Interactions",
                angle: -90,
                position: "insideLeft",
                fontSize: 10,
                fill: "#ccc",
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#fcfcfc" }} />
            <Bar dataKey="high" stackId="a" fill="#7d859d" />
            <Bar dataKey="low"  stackId="a" fill="#a3abc1" />
            <Bar dataKey="no"   stackId="a" fill="#daddf0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </SafeResponsiveContainer>
      </Box>

      {/* Data source note */}
      <Typography
        variant="caption"
        sx={{ display: "block", mt: 1, color: "text.disabled", fontSize: "10px" }}
      >
        Email: Zapier · SMS &amp; Calls: Twilio · WhatsApp &amp; Chatbot: coming soon
      </Typography>
    </Box>
  );
};

export default CommunicationChart;