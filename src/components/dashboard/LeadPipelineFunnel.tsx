import { Box, Typography, CircularProgress } from "@mui/material";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { Lead as ApiLead } from "../../services/leads.api";
import { chartStyles } from "../../styles/dashboard/SourcePerformanceChart.style";
import type { TimeRange } from "./TimeRangeSelector";
import { getTimeRangeBounds, isDateWithinBounds } from "./timeRange.utils";
import { selectLeads, selectLeadsLoading } from "../../store/leadSlice";
import {
  APP_TYPE,
  IS_CONTRACTS_APP,
  IS_MEDICAL_APP,
  STATUS_OPTIONS_BY_APP,
} from "../../config/appType";

interface LeadPipelineFunnelProps {
  timeRange: TimeRange;
}

type FunnelStatus =
  | "Converted"
  | "New"
  | "Appointment"
  | "Follow-Ups"
  | "Cycle Conversion"
  | "Lost"
  | "Negotiation"
  | "Proposal Sent"
  | "Contract Signed";

type FunnelStage = {
  stage: string;
  key: FunnelStatus;
};

const MEDICAL_FALLBACK_STAGE_KEYS: FunnelStatus[] = [
  "Converted",
  "New",
  "Appointment",
  "Follow-Ups",
  "Cycle Conversion",
  "Lost",
];

const CONTRACTS_FALLBACK_STAGE_KEYS: FunnelStatus[] = [
  "Converted",
  "New",
  "Follow-Ups",
  "Negotiation",
  "Proposal Sent",
  "Contract Signed",
  "Lost",
];

const STAGE_LABELS: Record<FunnelStatus, string> = {
  Converted: "Converted Leads",
  New: "New Leads",
  Appointment: "Appointments",
  "Follow-Ups": "Follow-Ups",
  "Cycle Conversion": "Cycle Conversion",
  Lost: "Lost Leads",
  Negotiation: "Negotiation",
  "Proposal Sent": "Proposal Sent",
  "Contract Signed": "Contract Signed",
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

const isStatusAllowedByApp = (status: FunnelStatus): boolean => {
  if (!IS_MEDICAL_APP && (status === "Appointment" || status === "Cycle Conversion")) return false;
  if (
    !IS_CONTRACTS_APP &&
    (status === "Negotiation" || status === "Proposal Sent" || status === "Contract Signed")
  ) {
    return false;
  }
  return true;
};

const normalizeLeadStatus = (status?: string | null): FunnelStatus | null => {
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
  if (value === "converted" || value === "converted-lead") return "Converted";
  if (value === "lost" || value === "lost-lead") return "Lost";
  if (value === "cycle-conversion" || value === "cycleconversion") return "Cycle Conversion";

  if (value === "negotiation" || value === "in-negotiation" || value === "under-negotiation") {
    return "Negotiation";
  }
  if (value === "proposal-sent" || value === "proposalsent" || value === "proposal") {
    return "Proposal Sent";
  }
  if (value === "contract-signed" || value === "contractsigned" || value === "signed") {
    return "Contract Signed";
  }

  return null;
};

const getActiveStageKeys = (): FunnelStatus[] => {
  const raw = STATUS_OPTIONS_BY_APP[APP_TYPE] as readonly string[] | undefined;

  const normalized = (raw ?? [])
    .map((s) => normalizeLeadStatus(s))
    .filter((s): s is FunnelStatus => Boolean(s))
    .filter(isStatusAllowedByApp);

  const unique = Array.from(new Set(normalized));
  if (unique.length) return unique;

  return (IS_CONTRACTS_APP ? CONTRACTS_FALLBACK_STAGE_KEYS : MEDICAL_FALLBACK_STAGE_KEYS).filter(
    isStatusAllowedByApp,
  );
};

const LeadPipelineFunnel = ({ timeRange }: LeadPipelineFunnelProps) => {
  const leads = useSelector(selectLeads) as ApiLead[] | undefined;
  const loading = useSelector(selectLeadsLoading);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const sourceLeads = useMemo(() => leads ?? [], [leads]);
  const activeStageKeys = useMemo<FunnelStatus[]>(() => getActiveStageKeys(), []);

  const stages = useMemo<FunnelStage[]>(
    () =>
      activeStageKeys.map((key) => ({
        key,
        stage: STAGE_LABELS[key] ?? key,
      })),
    [activeStageKeys],
  );

  const data = useMemo(() => {
    const countsByStage: Partial<Record<FunnelStatus, number>> = {};
    const bounds = getTimeRangeBounds(timeRange);
    const allowedSet = new Set(activeStageKeys);

    for (const key of activeStageKeys) countsByStage[key] = 0;

    for (const lead of sourceLeads) {
      if (lead?.is_active === false) continue;

      const rawDate = lead.modified_at || lead.created_at;
      if (!rawDate) continue;

      const leadDate = new Date(rawDate);
      if (Number.isNaN(leadDate.getTime())) continue;

      // Safe guard: only filter by date when bounds exists
      if (bounds && !isDateWithinBounds(leadDate, bounds)) continue;

      const normalized = normalizeLeadStatus(
        (lead.lead_status as string | undefined) || (lead as { status?: string }).status,
      );

      if (!normalized || !allowedSet.has(normalized)) continue;
      countsByStage[normalized] = (countsByStage[normalized] ?? 0) + 1;
    }

    if (allowedSet.has("Follow-Ups")) {
      const sourceStages: FunnelStatus[] = IS_MEDICAL_APP
        ? ["New", "Lost", "Cycle Conversion"]
        : IS_CONTRACTS_APP
          ? ["New", "Lost", "Negotiation", "Proposal Sent"]
          : ["New", "Lost"];

      countsByStage["Follow-Ups"] = sourceStages.reduce(
        (total, stageKey) => total + (countsByStage[stageKey] ?? 0),
        0,
      );
    }

    return stages.map((item) => ({
      ...item,
      value: countsByStage[item.key] ?? 0,
    }));
  }, [sourceLeads, timeRange, activeStageKeys, stages]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
        <CircularProgress size={40} sx={{ color: "#7d859d" }} />
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

  const colorAt = (index: number) => POSITION_COLORS[Math.min(index, POSITION_COLORS.length - 1)];

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
            {data.map((_, index) => (
              <linearGradient key={`grad-${index}`} id={`grad-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: colorAt(index), stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: colorAt(index), stopOpacity: 0.85 }} />
                <stop offset="100%" style={{ stopColor: colorAt(index), stopOpacity: 1 }} />
              </linearGradient>
            ))}
            <filter id="bubbleShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodOpacity="0.18" />
            </filter>
          </defs>

          {data.map((item, index) => {
            const x = startX + index * segmentWidth;

            const y1 = yAt(index, topStart, topEnd);
            const y2 = yAt(index, bottomStart, bottomEnd);
            const ny1 = yAt(index + 1, topStart, topEnd);
            const ny2 = yAt(index + 1, bottomStart, bottomEnd);

            const isHovered = hoveredIndex === index;

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
                  fill={index > Math.floor(segmentCount / 2) ? "#6f778d" : "white"}
                  fontSize="11"
                  fontWeight="500"
                  textAnchor="middle"
                  transform={`rotate(-90, ${x + segmentWidth / 2}, 182)`}
                  style={{ pointerEvents: "none", opacity: 0.9 }}
                >
                  {item.stage}
                </text>

                {isHovered && (
                  <g transform={`translate(${x + segmentWidth / 2 - 47}, 136)`} style={{ pointerEvents: "none" }}>
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