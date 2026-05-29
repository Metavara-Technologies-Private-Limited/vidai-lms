import { Box, Typography, CircularProgress } from "@mui/material";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { Lead as ApiLead } from "../../services/leads.api";
import { selectPipelines } from "../../store/pipelineSlice";
import { chartStyles } from "../../styles/dashboard/SourcePerformanceChart.style";
import type { TimeRange } from "./TimeRangeSelector";
import { getTimeRangeBounds, isDateWithinBounds } from "./timeRange.utils";
import { selectLeads, selectLeadsLoading } from "../../store/leadSlice";
import {
  getActivePipelineStages,
  resolveLeadStage,
} from "./pipelineStage.utils";

interface LeadPipelineFunnelProps {
  timeRange: TimeRange;
}

type FunnelStage = {
  stage: string;
  key: string;
};

const POSITION_COLORS = [
  "#7e879d",
  "#8a92a8",
  "#9ba3b5",
  "#b8bdcc",
  "#d1d4de",
  "#eceef4",
  "#f2f4f8",
  "#f6f7fb",
];

const getStageLabelLines = (label: string): string[] => {
  const compact = label.trim();
  if (!compact) return [""];

  // Keep this as one token to preserve the familiar funnel wording.
  if (compact.toLowerCase() === "follow-ups") return ["Follow-Ups"];

  const parts = compact.split(/\s+/).filter(Boolean);
  return parts.length > 0 ? parts : [compact];
};

const LeadPipelineFunnel = ({ timeRange }: LeadPipelineFunnelProps) => {
  const leads = useSelector(selectLeads) as ApiLead[] | undefined;
  const loading = useSelector(selectLeadsLoading);
  const pipelines = useSelector(selectPipelines);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const sourceLeads = useMemo(() => leads ?? [], [leads]);
  const pipelineStages = useMemo(
    () => getActivePipelineStages(pipelines),
    [pipelines],
  );

  const stages = useMemo<FunnelStage[]>(
    () =>
      pipelineStages.map((stage) => ({
        key: stage.id,
        stage: stage.stage_name,
      })),
    [pipelineStages],
  );

  const data = useMemo(() => {
    const countsByStage: Record<string, number> = {};
    const bounds = getTimeRangeBounds(timeRange);

    for (const stage of stages) countsByStage[stage.key] = 0;

    for (const lead of sourceLeads) {
      if (lead?.is_active === false) continue;

      const rawDate = lead.modified_at || lead.created_at;
      if (!rawDate) continue;

      const leadDate = new Date(rawDate);
      if (Number.isNaN(leadDate.getTime())) continue;

      // Safe guard: only filter by date when bounds exists
      if (bounds && !isDateWithinBounds(leadDate, bounds)) continue;

      const matchedStage = resolveLeadStage(lead, pipelineStages);
      if (!matchedStage) continue;
      countsByStage[matchedStage.id] =
        (countsByStage[matchedStage.id] ?? 0) + 1;
    }

    // Sort by value descending (highest count first, leftmost)
    return stages
      .map((item) => ({
        ...item,
        value: countsByStage[item.key] ?? 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [pipelineStages, sourceLeads, stages, timeRange]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
        }}
      >
        <CircularProgress size={40} sx={{ color: "#7d859d" }} />
      </Box>
    );
  }

  if (stages.length === 0) {
    return (
      <Box sx={chartStyles.container}>
        <Box
          sx={{
            width: "100%",
            minHeight: 260,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No active sales pipeline stages configured.
          </Typography>
        </Box>
      </Box>
    );
  }

  const segmentCount = Math.max(data.length, 1);
  const totalWidth = 624;
  const startX = 52;
  const segmentWidth = totalWidth / segmentCount;

  const topStart = 58;
  const topEnd = 146;
  const bottomStart = 304;
  const bottomEnd = 235;

  const yAt = (index: number, from: number, to: number) =>
    from + ((to - from) * index) / segmentCount;

  const colorAt = (index: number) =>
    POSITION_COLORS[Math.min(index, POSITION_COLORS.length - 1)];

  return (
    <Box sx={chartStyles.container}>
      <Box
        sx={{
          width: "100%",
          height: 500,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <svg width="760" height="380" viewBox="0 0 760 380">
          <defs>
            {/* 3D Shading Gradients */}
            {data.map((_, index) => (
              <linearGradient
                key={`grad-${index}`}
                id={`grad-${index}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop
                  offset="0%"
                  style={{ stopColor: colorAt(index), stopOpacity: 1 }}
                />
                <stop
                  offset="50%"
                  style={{ stopColor: colorAt(index), stopOpacity: 0.85 }}
                />
                <stop
                  offset="100%"
                  style={{ stopColor: colorAt(index), stopOpacity: 1 }}
                />
              </linearGradient>
            ))}
            <filter
              id="bubbleShadow"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="2.5"
                floodOpacity="0.18"
              />
            </filter>
          </defs>

          {data.map((item, index) => {
            const x = startX + index * segmentWidth;

            const y1 = yAt(index, topStart, topEnd);
            const y2 = yAt(index, bottomStart, bottomEnd);
            const ny1 = yAt(index + 1, topStart, topEnd);
            const ny2 = yAt(index + 1, bottomStart, bottomEnd);

            const isHovered = hoveredIndex === index;
            const stageLines = getStageLabelLines(item.stage);
            const lineHeight = 12;
            const firstLineOffset = -((stageLines.length - 1) * lineHeight) / 2;

            return (
              <g
                key={item.key}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: "pointer" }}
              >
                <path
                  d={`M ${x} ${y1} L ${x + segmentWidth} ${ny1} L ${x + segmentWidth} ${ny2} L ${x} ${y2} Z`}
                  fill={`url(#grad-${index})`}
                  stroke="rgba(255,255,255,0.34)"
                  strokeWidth="1"
                  style={{
                    transition: "all 0.25s ease",
                    filter: isHovered ? "brightness(1.08)" : "none",
                  }}
                />

                <text
                  x={x + segmentWidth / 2}
                  y="182"
                  fill={
                    index > Math.floor(segmentCount / 2) ? "#6f778d" : "white"
                  }
                  fontSize="11"
                  fontWeight="500"
                  textAnchor="middle"
                  transform={`rotate(-90, ${x + segmentWidth / 2}, 182)`}
                  style={{ pointerEvents: "none", opacity: 0.9 }}
                >
                  {stageLines.map((line, lineIndex) => (
                    <tspan
                      key={`${item.key}-line-${lineIndex}`}
                      x={x + segmentWidth / 2}
                      dy={lineIndex === 0 ? firstLineOffset : lineHeight}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>

                {isHovered && (
                  <g
                    transform={`translate(${x + segmentWidth / 2 - 47}, 136)`}
                    style={{ pointerEvents: "none" }}
                  >
                    <rect
                      width="94"
                      height="58"
                      rx="12"
                      fill="#f7f7f8"
                      filter="url(#bubbleShadow)"
                    />
                    <path d="M 43 58 L 47 66 L 51 58 Z" fill="#f7f7f8" />
                    <text
                      x="47"
                      y="23"
                      textAnchor="middle"
                      fontSize="18"
                      fontWeight="600"
                      fill="#333842"
                    >
                      {item.value}
                    </text>
                    <text
                      x="47"
                      y="44"
                      textAnchor="middle"
                      fontSize="11"
                      fill="#969ba8"
                    >
                      ({item.stage.toLowerCase()})
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        <Typography
          variant="caption"
          sx={{ mt: 2, color: "#9ea6ad", letterSpacing: 0.5 }}
        >
          Leads Status Funnel Representation
        </Typography>
      </Box>
    </Box>
  );
};

export default LeadPipelineFunnel;
