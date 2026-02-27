import { Box, Typography } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { mockData } from "./mockData";
import { chartStyles } from "../../styles/dashboard/SourcePerformanceChart.style";
import type{CustomTooltipProps} from "../../types/dashboard.types";

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

const ConversionTrendChart = () => {
  const data = mockData.overview.conversionTrendPerformance;

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