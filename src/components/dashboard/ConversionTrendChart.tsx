import { Box, Typography } from "@mui/material";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { chartStyles } from "../../styles/dashboard/SourcePerformanceChart.style";
import SafeResponsiveContainer from "./SafeResponsiveContainer";
import { selectLeads } from "../../store/leadSlice";
import type { TimeRange } from "./TimeRangeSelector";
import { isWithinTimeRange } from "./timeRange.utils";
import type{CustomTooltipProps} from "../../types/dashboard.types";
import type { Lead } from "../../services/leads.api";

type LeadWithTemplateMeta = Lead & {
  template_id?: string | number | null;
  templateId?: string | number | null;
  message_template_id?: string | number | null;
  whatsapp_template_id?: string | number | null;
};

interface ConversionTrendChartProps {
  timeRange: TimeRange;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={chartStyles.tooltipContainer}>
        <Typography variant="subtitle2" fontWeight={700}>
          {payload[0].value}%
        </Typography>
      </Box>
    );
  }
  return null;
};

const ConversionTrendChart = ({ timeRange }: ConversionTrendChartProps) => {
  const leads = useSelector(selectLeads) as LeadWithTemplateMeta[];

  const data = useMemo(() => {
    const monthKeys = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const totals = new Array<number>(12).fill(0);
    const converted = new Array<number>(12).fill(0);

    if (!Array.isArray(leads) || leads.length === 0) {
      return monthKeys.map((month) => ({ month, rate: 0 }));
    }

    const getLeadDate = (lead: LeadWithTemplateMeta): Date | null => {
      const raw = lead.modified_at || lead.created_at;
      if (!raw) return null;
      const parsed = new Date(raw);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const filteredByRange = leads.filter((lead) => {
      if (lead.is_active === false) return false;
      const date = getLeadDate(lead);
      return date ? isWithinTimeRange(date, timeRange) : false;
    });

    filteredByRange.forEach((lead) => {
      const date = getLeadDate(lead);
      if (!date) return;

      const monthIndex = date.getMonth();
      totals[monthIndex] += 1;

      const status = (lead.lead_status || "").toString().trim().toLowerCase();
      if (status === "converted" || status === "cycle_conversion" || status === "cycle conversion") {
        converted[monthIndex] += 1;
      }
    });

    return monthKeys.map((month, index) => ({
      month,
      rate: totals[index] > 0 ? Number(((converted[index] / totals[index]) * 100).toFixed(1)) : 0,
    }));

  }, [leads, timeRange]);

  return (
    <Box sx={chartStyles.container}>
      <Box sx={chartStyles.chartWrapper}>
        <SafeResponsiveContainer minHeight={260}>
          <LineChart key={timeRange} data={data} margin={{ top: 30, right: 30, left: 10, bottom: 10 }}>
            {/* Horizontal Grid Lines */}
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
            
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: "#666" }} 
              dy={10}
            />
            
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              interval={0}
              tick={{ fontSize: 11, fill: "#666" }}
              domain={[0, 100]}
              ticks={[10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
              allowDecimals={false}
              label={{ 
                value: 'Conversion Rate (in %)', 
                angle: -90, 
                position: 'insideLeft', 
                fontSize: 10, 
                fill: '#ccc',
                offset: 0
              }}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f0f0f0', strokeWidth: 1 }} />

            <Line 
              type="linear" // <--- This makes the lines STRAIGHT instead of curved
              dataKey="rate" 
              stroke="#7d859d" 
              strokeWidth={2}
              // Styled dot with white border per design
              dot={{ r: 4, fill: "#7d859d", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 5, strokeWidth: 0 }}
              animationDuration={1000}
            />
          </LineChart>
        </SafeResponsiveContainer>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.5, px: 2 }}>
        <Box sx={{ flex: 1, height: "1px", bgcolor: "#e6e6e6" }} />
        <Typography variant="caption" sx={{ fontSize: 20, color: "#b3b3b3", lineHeight: 1 }}>
          Time Period
        </Typography>
        <Box sx={{ flex: 1, height: "1px", bgcolor: "#e6e6e6" }} />
      </Box>
    </Box>
  );
};

export default ConversionTrendChart;