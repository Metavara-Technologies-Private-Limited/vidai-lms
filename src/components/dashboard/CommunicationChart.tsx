import { Box, Typography, Stack } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { mockData } from "./mockData";
import { chartStyles } from "../../styles/dashboard/SourcePerformanceChart.style";
import type{CustomTooltipProps} from "../../types/dashboard.types";

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
    return (
      <Box sx={chartStyles.tooltipContainer}>
        <Typography variant="subtitle2" fontWeight={700}>{total}</Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary', fontSize: '10px' }}>
          {payload[0].value} (High)  {payload[1].value} (Low)  {payload[2].value} (No)
        </Typography>
      </Box>
    );
  }
  return null;
};

const CommunicationChart = () => {
  const data = mockData.overview.communicationPerformance;

  return (
    <Box sx={chartStyles.container}>
      {/* LEGEND */}
      <Stack direction="row" spacing={2} sx={{ mb: 3, mt: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#7d859d' }} />
          <Typography variant="caption">High</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#a3abc1' }} />
          <Typography variant="caption">Low</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#daddf0' }} />
          <Typography variant="caption">No</Typography>
        </Stack>
      </Stack>

      {/* CHART */}
      <Box sx={chartStyles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 0 }} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
            <XAxis 
              dataKey="platform" 
              axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#666" }} 
            />
            <YAxis 
              axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#666" }} 
              label={{ value: 'No. of Interactions', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#ccc' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#fcfcfc" }} />

            <Bar dataKey="high" stackId="a" fill="#7d859d" />
            <Bar dataKey="low" stackId="a" fill="#a3abc1" />
            <Bar dataKey="no" stackId="a" fill="#daddf0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default CommunicationChart;