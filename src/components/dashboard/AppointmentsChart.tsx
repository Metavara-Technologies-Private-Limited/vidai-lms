import { Box, CircularProgress } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useEffect, useMemo, useState } from "react";
import { LeadAPI, type Lead } from "../../services/leads.api";
import { mockData } from "./mockData";
import { chartStyles } from "../../styles/dashboard/SourcePerformanceChart.style";
//import type{TooltipProps} from "recharts";
import type { CustomTooltipProps, AppointmentChartData } from "../../types/dashboard.types";


const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;
  const value = payload[0]?.value ?? 0;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #eceef5",
        borderRadius: 12,
        padding: "8px 14px",
        boxShadow: "0 6px 16px rgba(12, 18, 28, 0.08)",
      }}
    >
      <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#252b37", textAlign: "center" }}>
        {value}
      </p>
      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#8f95a3", textAlign: "center" }}>
        {label}
      </p>
    </div>
  );
};

const AppointmentsChart = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await LeadAPI.list();
        setLeads(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error("Appointments chart API error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  const data = useMemo((): AppointmentChartData[] => {
    let appointmentsBooked = 0;
    let completed = 0;

    leads.forEach((lead: Lead) => {
      const leadData = lead as Lead & Record<string, unknown>;
      const rawStatus = (
        leadData.next_action_status ||
        leadData.task_status ||
        leadData.taskStatus ||
        ""
      ).toString().trim().toLowerCase();

      if (
        rawStatus === "todo" ||
        rawStatus === "to do" ||
        rawStatus === "to-do" ||
        rawStatus === "to_do" ||
        rawStatus === "pending"
      ) {
        appointmentsBooked += 1;
      }

      if (rawStatus === "done" || rawStatus === "completed") {
        completed += 1;
      }
    });

    const noShows = mockData.overview.appointmentsPerformance.find(
      (item) => item.status === "No-shows"
    )?.value ?? 0;

    const cancelled = mockData.overview.appointmentsPerformance.find(
      (item) => item.status === "Cancelled"
    )?.value ?? 0;

    return [
      { status: "Appointments Booked", value: appointmentsBooked, color: "#daddf0" },
      { status: "Completed", value: completed, color: "#daddf0" },
      { status: "No-shows", value: noShows, color: "#7d859d" },
      { status: "Cancelled", value: cancelled, color: "#daddf0" },
    ];
  }, [leads]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
        <CircularProgress size={36} sx={{ color: "#7d859d" }} />
      </Box>
    );
  }

  return (
    <Box sx={chartStyles.container}>
      <Box sx={{ ...chartStyles.chartWrapper, position: "relative" }}>
        <Box
          sx={{
            position: "absolute",
            left: 6,
            top: "50%",
            transform: "translateY(-50%) rotate(-90deg)",
            transformOrigin: "left center",
            color: "#b2b9c7",
            fontSize: 11,
            zIndex: 1,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          No. of Appointments
        </Box>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            margin={{ top: 22, right: 30, left: 10, bottom: 16 }} 
            barSize={30}
          >
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e9edf3" />
            <XAxis 
              dataKey="status" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "#5f687a" }}
              label={{ value: "Campaigns", position: "insideBottom", offset: -2, fill: "#b2b9c7", fontSize: 12 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              domain={[0, 50]}
              ticks={[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50]}
              tick={{ fontSize: 11, fill: "#5f687a" }}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: "transparent" }} 
            />
            <Bar 
              dataKey="value" 
              radius={[6, 6, 0, 0]}
              onMouseEnter={(_, index) => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {data.map((_entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={index === 2 || hoveredIndex === index ? "#7d859d" : (_entry.color || "#daddf0")} 
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