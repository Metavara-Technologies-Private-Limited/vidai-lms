import { Box, Typography, CircularProgress } from "@mui/material";
import { useState, useEffect, useMemo } from "react";
// ✅ Integration Imports
import { LeadAPI } from "../../services/leads.api";
import type { Lead } from "../../types/leads.types";
import { chartStyles } from "../../styles/dashboard/SourcePerformanceChart.style";

const LeadPipelineFunnel = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // ✅ Fetch dynamic data from your LeadAPI
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await LeadAPI.list();
        // Since list() returns http.get<Lead[]>, access data directly
        setLeads(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Funnel API Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  // ✅ Process leads into the specific SVG stages matching your Status types
  const data = useMemo(() => {
    // These keys match your export type Status = "New" | "Appointment" | "Follow-Ups" | "Converted" | "Lost" | "Cycle Conversion"
    const stages = [
      { stage: 'New Leads', key: 'New', color: '#7d859d' },
      { stage: 'Appointments', key: 'Appointment', color: '#8e97ae' },
      { stage: 'Follow-Ups', key: 'Follow-Ups', color: '#a3abc1' },
      { stage: 'Converted Leads', key: 'Converted', color: '#b8bdd4' },
      { stage: 'Cycle Conversion', key: 'Cycle Conversion', color: '#daddf0' },
      { stage: 'Lost Leads', key: 'Lost', color: '#eceff8' }
    ];

    return stages.map(item => {
      // ✅ Filtering based on lead.status from your backend data
      const count = leads.filter(l => l.status === item.key).length;

      return {
        ...item,
        value: count || 0
      };
    });
  }, [leads]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress size={40} sx={{ color: '#7d859d' }} />
      </Box>
    );
  }

  return (
    <Box sx={chartStyles.container}>
      <Box sx={{ 
        width: "100%", height: 500, display: "flex", 
        flexDirection: "column", alignItems: "center", 
        justifyContent: "center", overflow: "hidden" 
      }}>
        {/* SVG Funnel Design matching your visual requirements */}
        <svg width="750" height="380" viewBox="0 0 750 380">
          <defs>
            {/* 3D Shading Gradients */}
            {data.map((item, index) => (
              <linearGradient key={`grad-${index}`} id={`grad-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: item.color, stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: item.color, stopOpacity: 0.85 }} />
                <stop offset="100%" style={{ stopColor: item.color, stopOpacity: 1 }} />
              </linearGradient>
            ))}
            <filter id="bubbleShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>

          {data.map((item, index) => {
            const segmentWidth = 110;
            const x = index * segmentWidth + 40;
            const taper = 14; 
            const y1 = 40 + index * taper;
            const y2 = 340 - index * taper;
            const ny1 = 40 + (index + 1) * taper;
            const ny2 = 340 - (index + 1) * taper;

            const isHovered = hoveredIndex === index;

            return (
              <g 
                key={item.stage}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* 3D Tapered Path based on tapering math */}
                <path
                  d={`M ${x} ${y1} L ${x + segmentWidth} ${ny1} L ${x + segmentWidth} ${ny2} L ${x} ${y2} Z`}
                  fill={`url(#grad-${index})`}
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="1"
                  style={{ transition: 'all 0.3s ease', filter: isHovered ? 'brightness(1.1)' : 'none' }}
                />
                
                {/* Vertical Stage Label - Color flips to dark for lighter end stages */}
                <text
                  x={x + segmentWidth / 2} y="190" fill={index > 3 ? "#7d859d" : "white"}
                  fontSize="11" fontWeight="500" textAnchor="middle"
                  transform={`rotate(-90, ${x + segmentWidth / 2}, 190)`}
                  style={{ pointerEvents: 'none', opacity: 0.9 }}
                >
                  {item.stage}
                </text>

                {/* Interactive Data Bubble showing REAL Backend count */}
                {isHovered && (
                  <g transform={`translate(${x + (segmentWidth / 2) - 40}, 155)`} style={{ pointerEvents: 'none' }}>
                    <rect width="80" height="50" rx="12" fill="white" filter="url(#bubbleShadow)" />
                    <path d="M 35 50 L 40 58 L 45 50 Z" fill="white" />
                    <text x="40" y="24" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333">
                      {item.value}
                    </text>
                    <text x="40" y="40" textAnchor="middle" fontSize="10" fill="#7d859d">
                      ({item.stage})
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        <Typography variant="caption" sx={{ mt: 2, color: "#9ea6ad", letterSpacing: 0.5 }}>
          Leads Status Funnel Representation
        </Typography>
      </Box>
    </Box>
  );
};

export default LeadPipelineFunnel;