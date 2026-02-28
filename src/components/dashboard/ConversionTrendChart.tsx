import { Box, Typography } from "@mui/material";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { mockData } from "./mockData";
import { chartStyles } from "../../styles/dashboard/SourcePerformanceChart.style";
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

    if (!Array.isArray(leads) || leads.length === 0) {
      return mockData.overview.conversionTrendPerformance;
    }

    const hasTemplateId = (lead: LeadWithTemplateMeta): boolean => {
      const templateId =
        lead.template_id ??
        lead.templateId ??
        lead.message_template_id ??
        lead.whatsapp_template_id ??
        null;
      return templateId !== null && templateId !== undefined && String(templateId).trim() !== "";
    };

    const filteredByRange = leads.filter(
      (lead) => lead.is_active !== false && isWithinTimeRange(lead.modified_at, timeRange),
    );

    const eligibleLeads = filteredByRange.filter((lead) => hasTemplateId(lead));

    const leadsForCalculation = eligibleLeads.length > 0
      ? eligibleLeads
      : filteredByRange;

    if (leadsForCalculation.length === 0) {
      return mockData.overview.conversionTrendPerformance;
    }

    const monthlyTotals = new Array<number>(12).fill(0);
    const monthlyConverted = new Array<number>(12).fill(0);

    leadsForCalculation.forEach((lead) => {
      if (!lead.modified_at) {
        return;
      }

      const modifiedDate = new Date(lead.modified_at);
      if (Number.isNaN(modifiedDate.getTime())) {
        return;
      }

      const monthIndex = modifiedDate.getMonth();
      monthlyTotals[monthIndex] += 1;

      const status = (lead.lead_status || "").toString().trim().toLowerCase();
      if (status === "converted" || status === "cycle_conversion") {
        monthlyConverted[monthIndex] += 1;
      }
    });

    return monthKeys.map((month, index) => {
      const total = monthlyTotals[index];
      const converted = monthlyConverted[index];
      const rate = total > 0 ? Number(((converted / total) * 100).toFixed(1)) : 0;
      return { month, rate };
    });

  }, [leads, timeRange]);

  return (
    <Box sx={chartStyles.container}>
      <Box sx={chartStyles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 30, right: 30, left: 10, bottom: 10 }}>
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
              tick={{ fontSize: 11, fill: "#666" }}
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
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default ConversionTrendChart;