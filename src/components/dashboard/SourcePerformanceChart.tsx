/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { selectClinic } from "../../store/clinicSlice";
import type { CampaignAPIType } from "../../types/campaigns.types";

type Metric = "volume" | "rate" | "revenue" | "cost";
import type { CustomTooltipProps } from "../../types/dashboard.types";

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

  const total = payload.reduce((sum, entry) => sum + (entry.value ?? 0), 0);

  const unit = metric === "rate" ? "%" : metric === "volume" ? "" : "$";

  return (
    <Box sx={chartStyles.tooltipContainer}>
      <Typography variant="subtitle2" fontWeight={700}>
        {(payload[0] as any)?.payload?.name}{" "}
      </Typography>

      <Typography variant="body2">
        {metric === "revenue" || metric === "cost"
          ? `${total.toLocaleString()}`
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
  const campaigns = useSelector(selectCampaign) as CampaignAPIType[];
  const selectedClinicId = useSelector(selectClinic)?.id;
  const rawStoredClinicId = localStorage.getItem("clinic_id");
  const parsedStoredClinicId = rawStoredClinicId
    ? Number(rawStoredClinicId)
    : NaN;
  const storedClinicId =
    Number.isFinite(parsedStoredClinicId) && parsedStoredClinicId > 0
      ? parsedStoredClinicId
      : null;
  const clinicId = selectedClinicId != null ? selectedClinicId : storedClinicId;
  const socialMediaRevenueFromCampaigns = (
    Array.isArray(campaigns) ? campaigns : []
  )
    .filter(
      (c) =>
        Boolean(clinicId) &&
        Number(c.clinic) === clinicId &&
        !c.is_deleted &&
        isWithinTimeRange(
          c.modified_at || c.created_at || c.start_date,
          timeRange,
        ),
    )
    .reduce((sum, c) => {
      const hasActivePlatform = Object.values(c.platform_data || {}).some(
        (v) => v && String(v).trim() !== "",
      );

      if (!hasActivePlatform) return sum;

      const budgetTotal =
        (c.total_spend ?? 0) > 0
          ? (c.total_spend ?? 0)
          : c.budget_data
            ? Object.entries(c.budget_data).reduce(
                (s: number, [key, v]) =>
                  key === "total" ? s : s + (Number(v) || 0),
                0,
              )
            : 0;

      return sum + budgetTotal;
    }, 0);
  const sourceBaseRows = mockData.overview.sourcePerformance.map(
    (row) => row.name,
  );
  // const campaignBaseRows = liveCampaigns.map((c) => c.name);

  // Source-based data: Lead Volume, Conversion Rate, Revenue (by lead source)
  const sourceData = useMemo(() => {
    const filtered = (Array.isArray(leads) ? leads : []).filter(
      (l) =>
        Boolean(clinicId) &&
        Number(l.clinic_id) === clinicId &&
        l.is_active !== false &&
        isWithinTimeRange(l.modified_at || l.created_at, timeRange),
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

    const map = new Map<
      string,
      {
        hot: number;
        warm: number;
        cold: number;
        total: number;
        converted: number;
      }
    >();

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

      const rawStatus = (lead.lead_status || "")
        .toString()
        .toLowerCase()
        .trim();
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
      } else if (
        rawStatus === "cycle conversion" ||
        rawStatus === "cycle_conversion"
      ) {
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

      const total = counts?.total ?? 0;
      const converted = counts?.converted ?? 0;

      const revenue =
        rowName === "Social Media"
          ? socialMediaRevenueFromCampaigns
          : converted * 100;
      const cost = total > 0 ? revenue / total : 0;

      return {
        name: rowName,
        hot: counts?.hot ?? 0,
        warm: counts?.warm ?? 0,
        cold: counts?.cold ?? 0,
        convRate:
          total > 0 ? Number(((converted / total) * 100).toFixed(1)) : 0,
        revenue,
        cost,
      };
    });
  }, [clinicId, leads, socialMediaRevenueFromCampaigns, sourceBaseRows, timeRange]);

  // Campaign-based data: Revenue (total budget) and Cost per Lead (budget / actual linked leads)
  const campaignData = useMemo(() => {
    const active = (Array.isArray(campaigns) ? campaigns : []).filter(
      (c) =>
        Boolean(clinicId) &&
        Number(c.clinic) === clinicId &&
        !c.is_deleted &&
        isWithinTimeRange(
          c.modified_at || c.created_at || c.start_date,
          timeRange,
        ),
    );

    // Normalised leads array for linking
    const allLeads = Array.isArray(leads) ? leads : [];

    const liveCampaigns = active.map((c) => {
      // ── budget: prefer total_spend; otherwise sum per-platform keys from
      //    budget_data, explicitly EXCLUDING the 'total' key to avoid
      //    double-counting (budget_data = { instagram: 350, facebook: 250,
      //    google: 200, total: 800 } → summing all gives 1600, not 800).
      const budgetTotal =
        (c.total_spend ?? 0) > 0
          ? (c.total_spend ?? 0)
          : c.budget_data
            ? Object.entries(c.budget_data).reduce(
                (sum: number, [key, v]) =>
                  key === "total" ? sum : sum + (Number(v) || 0),
                0,
              )
            : 0;

      // ── FIX: count leads actually linked to this campaign ──────────────────
      // Match by campaign_id (numeric equality) OR by campaign_name (case-insensitive)
      const campaignId = String(c.id);
      const normalizedCampaignName = String(c.campaign_name ?? "")
        .trim()
        .toLowerCase();

      const linkedLeadsCount = allLeads.filter((lead) => {
        // campaign_id field on lead (may be string or number)
        const leadCampaignId = String(
          (lead as any).campaign_id ?? "",
        ).trim();

        // campaign_name field on lead (some backends send name instead of id)
        const leadCampaignName = String(
          (lead as any).campaign_name ?? "",
        )
          .trim()
          .toLowerCase();

        return (
          (leadCampaignId !== "" && leadCampaignId === campaignId) ||
          (leadCampaignName !== "" &&
            normalizedCampaignName !== "" &&
            leadCampaignName === normalizedCampaignName)
        );
      }).length;

      // Use actual linked leads count; fall back to campaign's own lead_generated
      // field only when no leads are found in the store (e.g. store not yet loaded)
      const leadsCount =
        linkedLeadsCount > 0
          ? linkedLeadsCount
          : (c.lead_generated ?? 0);

      const cost = leadsCount > 0 ? budgetTotal / leadsCount : 0;

      return {
        name: c.campaign_name,
        hot: 0,
        warm: 0,
        cold: 0,
        convRate: 0,
        revenue: Number(budgetTotal.toFixed(2)),
        cost: Number(cost.toFixed(2)),
      };
    });

    // const campaignMap = new Map(liveCampaigns.map((c) => [c.name, c]));

    // return campaignBaseRows.map((rowName) => {
    //   const campaign = campaignMap.get(rowName);

    //   return {
    //     name: rowName,
    //     hot: 0,
    //     warm: 0,
    //     cold: 0,
    //     convRate: campaign?.convRate ?? 0,
    //     revenue: campaign?.revenue ?? 0,
    //     cost: campaign?.cost ?? 0,
    //   };
    // });
    const sorted = [...liveCampaigns].sort((a, b) => b.cost - a.cost);

    const top = sorted.slice(0,10);
    const others = sorted.slice(10);

    const othersCost = others.reduce((sum, c) => sum + c.cost, 0);

    return [
      ...top.map((c) => ({
        name: c.name,
        hot: 0,
        warm: 0,
        cold: 0,
        convRate: c.convRate,
        revenue: c.revenue,
        cost: c.cost,
      })),
      ...(others.length > 0
        ? [
            {
              name: "Others",
              hot: 0,
              warm: 0,
              cold: 0,
              convRate: 0,
              revenue: 0,
              cost: othersCost,
            },
          ]
        : []),
    ];
  }, [campaigns, clinicId, leads, timeRange]);

  const data =
    metric === "cost"
      ? campaignData 
      : sourceData;
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
              interval="preserveStartEnd"
              minTickGap={20}
              tickFormatter={(value: string) =>
                value.length > 12 ? value.slice(0, 12) + "..." : value
              }
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