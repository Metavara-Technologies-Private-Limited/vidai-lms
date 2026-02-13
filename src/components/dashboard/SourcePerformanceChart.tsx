import {
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Stack,
  CircularProgress,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useState, useEffect, useMemo } from "react";
// ✅ Integration Imports
import { LeadAPI } from "../../services/leads.api";
import type { Lead } from "../../types/leads.types";
import { chartStyles } from "../../styles/dashboard/SourcePerformanceChart.style";
import type { CustomTooltipProps } from "../../types/dashboard.types";

type Metric = "volume" | "rate" | "revenue" | "cost";

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

const SourcePerformanceChart = () => {
  const [metric, setMetric] = useState<Metric>("volume");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch dynamic data
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await LeadAPI.list();
        setLeads(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Chart Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  // ✅ Data Processing: Map leads to chart segments
  const processedData = useMemo(() => {
    const sources = ["Website", "Chatbot", "Social Media", "Referral", "Call Center"];
    
    return sources.map(sourceName => {
      const sourceLeads = leads.filter(l => l.source === sourceName);
      
      return {
        name: sourceName,
        // For Volume (Stacked)
        hot: sourceLeads.filter(l => l.quality === "Hot").length,
        warm: sourceLeads.filter(l => l.quality === "Warm").length,
        cold: sourceLeads.filter(l => l.quality === "Cold").length,
        // For other metrics (Mocked or calculated if fields exist)
        volume: sourceLeads.length,
        convRate: sourceLeads.length > 0 ? Math.floor(Math.random() * 30) + 5 : 0,
        revenue: sourceLeads.length * 500,
        cost: sourceLeads.length * 50,
        campaign: sourceName
      };
    });
  }, [leads]);

  const config = {
    volume: { key: "volume", label: "No. of Leads" },
    rate: { key: "convRate", label: "Conversion Rate (in %)" },
    revenue: { key: "revenue", label: "Invoice Amount (in $)" },
    cost: { key: "cost", label: "Amount (in $)" },
  }[metric];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={350}>
        <CircularProgress size={40} sx={{ color: '#7d859d' }} />
      </Box>
    );
  }

  return (
    <Box sx={chartStyles.container}>
      <Stack direction="row" spacing={3} sx={{ mb: 1 }}>
        <RadioGroup
          row
          value={metric}
          onChange={(e) => setMetric(e.target.value as Metric)}
        >
          <FormControlLabel value="volume" control={<Radio size="small" sx={chartStyles.radioHot} />} label={<Typography variant="body2" fontWeight={500}>Lead Volume</Typography>} />
          <FormControlLabel value="rate" control={<Radio size="small" />} label={<Typography variant="body2" fontWeight={500}>Conversion Rate</Typography>} />
          <FormControlLabel value="revenue" control={<Radio size="small" />} label={<Typography variant="body2" fontWeight={500}>Revenue</Typography>} />
          <FormControlLabel value="cost" control={<Radio size="small" />} label={<Typography variant="body2" fontWeight={500}>Cost per Lead</Typography>} />
        </RadioGroup>
      </Stack>

      {metric === "volume" && (
        <Stack direction="row" spacing={2} sx={{ mb: 2, ml: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={chartStyles.legendDot("#7d859d")} />
            <Typography variant="caption" color="text.secondary">Hot</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={chartStyles.legendDot("#a3abc1")} />
            <Typography variant="caption" color="text.secondary">Warm</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box sx={chartStyles.legendDot("#daddf0")} />
            <Typography variant="caption" color="text.secondary">Cold</Typography>
          </Stack>
        </Stack>
      )}

      <Box sx={chartStyles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={processedData} margin={{ top: 30, right: 30, left: 10, bottom: 0 }} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
            <XAxis dataKey={metric === "cost" ? "campaign" : "name"} axisLine={false} tickLine={false} tick={chartStyles.axisTick} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={chartStyles.axisTick} label={{ value: config.label, angle: -90, position: "insideLeft", offset: 0, style: { fontSize: 10, fill: "#ccc" } }} />
            <Tooltip content={<CustomTooltip metric={metric} />} cursor={{ fill: "#fcfcfc" }} />

            {metric === "volume" ? (
              <>
                <Bar dataKey="hot" stackId="a" fill="#7d859d" />
                <Bar dataKey="warm" stackId="a" fill="#a3abc1" />
                <Bar dataKey="cold" stackId="a" fill="#daddf0" radius={[4, 4, 0, 0]} />
              </>
            ) : (
              <Bar dataKey={config.key} radius={[4, 4, 0, 0]}>
                {processedData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#7d859d" : "#daddf0"} />
                ))}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default SourcePerformanceChart;