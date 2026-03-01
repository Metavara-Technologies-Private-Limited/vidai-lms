import { Box, Typography, CircularProgress } from "@mui/material";
import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import type { Lead as ApiLead } from "../../services/leads.api";
import type { Status } from "../../types/leads.types";
import { chartStyles } from "../../styles/dashboard/SourcePerformanceChart.style";
import type { TimeRange } from "./TimeRangeSelector";
import { isWithinTimeRange } from "./timeRange.utils";
import { selectLeads, selectLeadsLoading } from "../../store/leadSlice";

interface LeadPipelineFunnelProps {
  timeRange: TimeRange;
}

const normalizeLeadStatus = (status?: string | null): Status | null => {
  if (!status) return null;

  const value = status.toLowerCase().trim().replace(/[_\s]+/g, "-");

  if (value === "new" || value === "new-lead" || value === "new-leads") return "New";
  if (value === "appointment" || value === "appointments") return "Appointment";
  if (
    value === "follow-up" ||
    value === "follow-ups" ||
    value === "followup" ||
    value === "followups" ||
    value === "follow-up-lead" ||
    value === "follow-up-leads"
  ) {
    return "Follow-Ups";
  }
  if (value === "converted") return "Converted";
  if (value === "lost") return "Lost";
  if (value === "cycle-conversion" || value === "cycleconversion") return "Cycle Conversion";

  return null;
};

const LeadPipelineFunnel = ({ timeRange }: LeadPipelineFunnelProps) => {
  const leads = useSelector(selectLeads) as ApiLead[];
  const loading = useSelector(selectLeadsLoading);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(5);

  // ✅ Process leads into the specific SVG stages matching your Status types
  const data = useMemo(() => {
    // These keys match your status values and visual order in the design
    const stages = [
      { stage: "Converted Leads", key: "Converted" as Status, color: "#7e879d" },
      { stage: "New Leads", key: "New" as Status, color: "#8a92a8" },
      { stage: "Appointments", key: "Appointment" as Status, color: "#9ba3b5" },
      { stage: "Follow-Ups", key: "Follow-Ups" as Status, color: "#b8bdcc" },
      { stage: "Cycle Conversion", key: "Cycle Conversion" as Status, color: "#d1d4de" },
      { stage: "Lost Leads", key: "Lost" as Status, color: "#eceef4" },
    ];

    const filteredLeads = leads.filter(
      (lead) =>
        lead.is_active !== false &&
        isWithinTimeRange(lead.modified_at || lead.created_at, timeRange),
    );

    return stages.map(item => {
      const count = filteredLeads.filter((lead) => {
        const normalized = normalizeLeadStatus(
          (lead.lead_status as string | undefined) || (lead as { status?: string }).status
        );
        return normalized === item.key;
      }).length;

      return {
        ...item,
        value: count || 0,
      };
    });
  }, [leads, timeRange]);

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
        <svg width="760" height="380" viewBox="0 0 760 380">
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
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.18" />
            </filter>
          </defs>

          {data.map((item, index) => {
            const segmentWidth = 104;
            const startX = 52;
            const x = startX + index * segmentWidth;

            const topY = [58, 58, 72, 99, 116, 132, 146];
            const bottomY = [304, 304, 286, 271, 258, 246, 235];

            const y1 = topY[index];
            const y2 = bottomY[index];
            const ny1 = topY[index + 1];
            const ny2 = bottomY[index + 1];

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
                  stroke="rgba(255,255,255,0.34)"
                  strokeWidth="1"
                  style={{ transition: "all 0.25s ease", filter: isHovered ? "brightness(1.08)" : "none" }}
                />
                
                {/* Vertical Stage Label - Color flips to dark for lighter end stages */}
                <text
                  x={x + segmentWidth / 2} y="182" fill={index > 3 ? "#6f778d" : "white"}
                  fontSize="11" fontWeight="500" textAnchor="middle"
                  transform={`rotate(-90, ${x + segmentWidth / 2}, 182)`}
                  style={{ pointerEvents: "none", opacity: 0.9 }}
                >
                  {item.stage}
                </text>

                {/* Interactive Data Bubble showing REAL Backend count */}
                {isHovered && (
                  <g transform={`translate(${x + (segmentWidth / 2) - 47}, 136)`} style={{ pointerEvents: "none" }}>
                    <rect width="94" height="58" rx="12" fill="#f7f7f8" filter="url(#bubbleShadow)" />
                    <path d="M 43 58 L 47 66 L 51 58 Z" fill="#f7f7f8" />
                    <text x="47" y="23" textAnchor="middle" fontSize="18" fontWeight="600" fill="#333842">
                      {item.value}
                    </text>
                    <text x="47" y="44" textAnchor="middle" fontSize="11" fill="#969ba8">
                      ({item.stage.toLowerCase()})
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