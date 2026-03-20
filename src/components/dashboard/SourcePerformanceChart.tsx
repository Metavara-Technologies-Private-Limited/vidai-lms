import {
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Stack,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { mockData } from "./mockData";
import { chartStyles } from "../../styles/dashboard/SourcePerformanceChart.style";
import SafeResponsiveContainer from "./SafeResponsiveContainer";
import type { TimeRange } from "./TimeRangeSelector";
import { isWithinTimeRange } from "./timeRange.utils";
import { selectLeads } from "../../store/leadSlice";
import { selectCampaign } from "../../store/campaignSlice";

type Metric = "volume" | "rate" | "revenue" | "cost";
import type{CustomTooltipProps} from "../../types/dashboard.types";

interface SourcePerformanceChartProps {
  timeRange: TimeRange;
}

// Custom Tooltip

const CustomTooltip = ({
  active,
  payload,
  metric,
}: CustomTooltipProps & { metric: string }) => {
  if (!active || !payload || !payload.length) return null;

  const total = payload.reduce(
    (sum, entry) => sum + (entry.value ?? 0),
    0
  );

  const unit = metric === "rate" ? "%" : metric === "volume" ? "" : "$";

  return (
    <Box sx={chartStyles.tooltipContainer}>
      <Typography variant="subtitle2" fontWeight={700}>
        {metric === "revenue" || metric === "cost"
          ? `$${total.toLocaleString()}`
          : total}
        {unit}
      </Typography>

      {metric === "volume" && payload.length >= 3 && (
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 0.5,
            color: "text.secondary",
            fontSize: "10px",
          }}
        >
          {payload[0].value} (Hot)&nbsp;
          {payload[1].value} (Warm)&nbsp;
          {payload[2].value} (Cold)
        </Typography>
      )}
    </Box>
  );
};

const SourcePerformanceChart = ({ timeRange }: SourcePerformanceChartProps) => {
  const [metric, setMetric] = useState<Metric>("volume");
  const leads = useSelector(selectLeads);
  const campaigns = useSelector(selectCampaign);
  const sourceBaseRows = mockData.overview.sourcePerformance.map((row) => row.name);
  const campaignBaseRows = mockData.overview.sourcePerformance.map((row) => row.campaign);

  // Source-based data: Lead Volume, Conversion Rate, Revenue (by lead source)
  const sourceData = useMemo(() => {
    const filtered = (Array.isArray(leads) ? leads : []).filter(
      (l) => l.is_active !== false && isWithinTimeRange(l.modified_at, timeRange),
    );

    const normalizeSourceKey = (value: string): string =>
      value.toLowerCase().replace(/[^a-z0-9]/g, "");

    const sourceAliases: Record<string, string> = {
      website: "Website",
      chatbot: "Chatbot",
      socialmedia: "Social Media",
      social: "Social Media",
      referral: "Referral",
      callcenter: "Call Center",
      walkins: "Walk-Ins",
      walkin: "Walk-Ins",
    };

    const map = new Map<string, { hot: number; warm: number; cold: number; total: number; converted: number }>();

    for (const lead of filtered) {
      const rawSource = (lead.source || "").trim();
      const source = sourceAliases[normalizeSourceKey(rawSource)] ?? rawSource;
      if (!source) {
        continue;
      }

      if (!map.has(source)) {
        map.set(source, { hot: 0, warm: 0, cold: 0, total: 0, converted: 0 });
      }
      const entry = map.get(source)!;
      entry.total += 1;

      const rawStatus = (lead.lead_status || "").toString().toLowerCase().trim();
      if (rawStatus === "new" || rawStatus === "appointment") {
        entry.hot += 1;
      } else if (
        rawStatus === "follow-ups" ||
        rawStatus === "follow_ups" ||
        rawStatus === "follow up" ||
        rawStatus === "contacted"
      ) {
        entry.warm += 1;
      } else if (rawStatus === "converted") {
        entry.converted += 1;
        entry.hot += 1;
      } else if (rawStatus === "cycle conversion" || rawStatus === "cycle_conversion") {
        entry.converted += 1;
        entry.warm += 1;
      } else if (rawStatus === "lost") {
        entry.cold += 1;
      } else {
        entry.warm += 1;
      }
    }

    return sourceBaseRows.map((rowName) => {
      const counts = map.get(rowName);

      return {
        name: rowName,
        hot: counts?.hot ?? 0,
        warm: counts?.warm ?? 0,
        cold: counts?.cold ?? 0,
        convRate: counts && counts.total > 0
          ? Number(((counts.converted / counts.total) * 100).toFixed(1))
          : 0,
        revenue: 0,
        cost: 0,
      };
    });
  }, [leads, sourceBaseRows, timeRange]);

  // Campaign-based data: Revenue (total budget) and Cost per Lead (budget / leads)
  const campaignData = useMemo(() => {
    const active = (Array.isArray(campaigns) ? campaigns : []).filter(
      (c) => !c.is_deleted,
    );

    const liveCampaigns = active.map((c) => {
        // Use total_spend if available, else sum all platform budget_data values
        const budgetTotal =
          (c.total_spend ?? 0) > 0
            ? (c.total_spend ?? 0)
            : c.budget_data
            ? Object.values(c.budget_data).reduce(
                (sum: number, v) => sum + (Number(v) || 0),
                0,
              )
            : 0;

        const leadsCount = c.lead_generated > 0 ? c.lead_generated : 1;

        return {
          name: c.campaign_name,
          hot: 0,
          warm: 0,
          cold: 0,
          convRate: 0,
          revenue: Number(budgetTotal.toFixed(2)),
          cost: Number((budgetTotal / leadsCount).toFixed(2)),
        };
      });

    return campaignBaseRows.map((rowName, index) => {
      const liveCampaign = liveCampaigns[index];

      return {
        name: rowName,
        hot: 0,
        warm: 0,
        cold: 0,
        convRate: 0,
        revenue: liveCampaign?.revenue ?? 0,
        cost: liveCampaign?.cost ?? 0,
      };
    });
  }, [campaignBaseRows, campaigns]);

  const data =
    metric === "cost" || metric === "revenue" ? campaignData : sourceData;

  const config = {
    volume: { key: "volume", label: "No. of Leads" },
    rate: { key: "convRate", label: "Conversion Rate (in %)" },
    revenue: { key: "revenue", label: "Campaign Budget (in $)" },
    cost: { key: "cost", label: "Cost per Lead (in $)" },
  }[metric];

  return (
    <Box sx={chartStyles.container}>
      {/* HEADER */}
      <Stack direction="row" spacing={3} sx={{ mb: 1 }}>
        <RadioGroup
          row
          value={metric}
          onChange={(e) => setMetric(e.target.value as Metric)}
        >
          <FormControlLabel
            value="volume"
            control={<Radio size="small" sx={chartStyles.radioHot} />}
            label={
              <Typography variant="body2" fontWeight={500}>
                Lead Volume
              </Typography>
            }
          />
          <FormControlLabel
            value="rate"
            control={<Radio size="small" />}
            label={
              <Typography variant="body2" fontWeight={500}>
                Conversion Rate
              </Typography>
            }
          />
          <FormControlLabel
            value="revenue"
            control={<Radio size="small" />}
            label={
              <Typography variant="body2" fontWeight={500}>
                Revenue
              </Typography>
            }
          />
          <FormControlLabel
            value="cost"
            control={<Radio size="small" />}
            label={
              <Typography variant="body2" fontWeight={500}>
                Cost per Lead
              </Typography>
            }
          />
        </RadioGroup>
      </Stack>

      {/* LEGEND */}
      {metric === "volume" && (
        <Stack direction="row" spacing={2} sx={{ mb: 2, ml: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={chartStyles.legendDot("#7d859d")} />
            <Typography variant="caption" color="text.secondary">
              Hot
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={chartStyles.legendDot("#a3abc1")} />
            <Typography variant="caption" color="text.secondary">
              Warm
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={chartStyles.legendDot("#daddf0")} />
            <Typography variant="caption" color="text.secondary">
              Cold
            </Typography>
          </Stack>
        </Stack>
      )}

      {/* CHART */}
      <Box sx={chartStyles.chartWrapper}>
        <SafeResponsiveContainer minHeight={260}>
          <BarChart
            key={metric}
            data={data}
            margin={{ top: 30, right: 30, left: 10, bottom: 0 }}
            barSize={24}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f5f5f5"
            />

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={chartStyles.axisTick}
              dy={10}
              label={{
                value: metric === "cost" || metric === "revenue" ? "Campaigns" : "Lead Sources",
                position: "insideBottom",
                offset: -5,
                style: {
                  fontSize: 10,
                  fill: "#ccc",
                },
              }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={chartStyles.axisTick}
              label={{
                value: config.label,
                angle: -90,
                position: "insideLeft",
                offset: 0,
                style: {
                  fontSize: 10,
                  fill: "#ccc",
                },
              }}
            />

            <Tooltip
              content={<CustomTooltip metric={metric} />}
              cursor={{ fill: "#fcfcfc" }}
            />

            {metric === "volume" ? (
              <>
                <Bar dataKey="hot" stackId="a" fill="#7d859d" />
                <Bar dataKey="warm" stackId="a" fill="#a3abc1" />
                <Bar
                  dataKey="cold"
                  stackId="a"
                  fill="#daddf0"
                  radius={[4, 4, 0, 0]}
                />
              </>
            ) : (
              <Bar dataKey={config.key} radius={[4, 4, 0, 0]}>
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 2 ? "#7d859d" : "#daddf0"}
                  />
                ))}
              </Bar>
            )}
          </BarChart>
        </SafeResponsiveContainer>
      </Box>
    </Box>
  );
};

export default SourcePerformanceChart;