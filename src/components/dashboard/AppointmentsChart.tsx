import { Box, } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useState } from "react";
import { mockData } from "./mockData";
import { chartStyles } from "../../styles/Dashboard/SourcePerformanceChart.style";
//import type{TooltipProps} from "recharts";
import type{CustomTooltipProps} from "../../types/dashboard.types";


const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div style={{ background: "#fff", padding: 8, border: "1px solid #eee" }}>
      <p>{label}</p>
      <p>{payload[0].value}</p>
    </div>
  );
};

const AppointmentsChart = () => {
  const data = mockData.overview.appointmentsPerformance;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <Box sx={chartStyles.container}>
      <Box sx={chartStyles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            margin={{ top: 30, right: 30, left: 10, bottom: 20 }} 
            barSize={24} // Thinner bars to match design
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
            <XAxis 
              dataKey="status" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: "#666" }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: "#666" }}
              label={{ 
                value: 'No. of Appointments', 
                angle: -90, 
                position: 'insideLeft', 
                fontSize: 10, 
                fill: '#ccc' 
              }}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: "#fcfcfc" }} 
            />
            <Bar 
              dataKey="value" 
              radius={[4, 4, 0, 0]}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {data.map((_entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  // Highlight "No-shows" (index 2) or hovered item
                  fill={index === 2 || hoveredIndex === index ? "#7d859d" : "#daddf0"} 
                  style={{ transition: 'fill 0.3s ease' }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default AppointmentsChart;