import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import useMediaQuery from "@mui/material/useMediaQuery";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { useTheme } from "@mui/material/styles";

import TotalLeadsIcon from "../../assets/icons/TotalLeads.svg";
import NewLeadsIcon from "../../assets/icons/NewLeads.svg";
import AppointmentsIcon from "../../assets/icons/Appointments.svg";
import FollowUpsIcon from "../../assets/icons/FollowUps.svg";
import TotalConvertedIcon from "../../assets/icons/TotalConverted.svg";
import LostLeadsIcon from "../../assets/icons/LostLeads.svg";

import { kpiCardsStyles } from "../../styles/dashboard/KpiCards.styles";
import { selectLeads } from "../../store/leadSlice";
import { selectPipelines } from "../../store/pipelineSlice";
import type { LiveKpiCounts } from "../../types/dashboard.types";
import type { Lead } from "../../services/leads.api";
import {
  buildStageCountMap,
  getActivePipelineStages,
  normalizeStageName,
} from "./pipelineStage.utils";
import type { TimeRange } from "./TimeRangeSelector";
import { getTimeRangeBounds, isDateWithinBounds } from "./timeRange.utils";

type KpiCardId =
  | "totalLeads"
  | "newLeads"
  | "appointments"
  | "followUps"
  | "cycleConversion"
  | "totalConverted"
  | "lostLeads"
  | "negotiation"
  | "proposalSent"
  | "contractSigned"
  | string; // Support dynamic stage IDs

type LocalKpiCardData = {
  id: KpiCardId;
  label: string;
  value: number;
  breakdown?: Array<{ label: string; value: number }>;
  stageColor?: string;
  stageName?: string;
  isDynamicStage?: boolean;
};

type ExtendedKpiCounts = LiveKpiCounts & {
  cycleConversion: number;
  negotiation: number;
  proposalSent: number;
  contractSigned: number;
  registered: number;
  treatment: number;
  [key: string]: number; // Support dynamic stage counts
};

/* KPI → ICON MAP */
const KPI_ICONS: Record<string, string> = {
  totalLeads: TotalLeadsIcon,
  newLeads: NewLeadsIcon,
  appointments: AppointmentsIcon,
  followUps: FollowUpsIcon,
  cycleConversion: TotalConvertedIcon,
  totalConverted: TotalConvertedIcon,
  lostLeads: LostLeadsIcon,
  negotiation: FollowUpsIcon,
  proposalSent: AppointmentsIcon,
  contractSigned: TotalConvertedIcon,
};

const getIconForStage = (stageName: string): string => {
  const normalized = normalizeStageName(stageName);
  if (KPI_ICONS[normalized]) return KPI_ICONS[normalized];

  // Infer icon based on stage name keywords
  if (normalized.includes("appointment") || normalized.includes("demo"))
    return AppointmentsIcon;
  if (normalized.includes("follow") || normalized.includes("qualified"))
    return FollowUpsIcon;
  if (
    normalized.includes("contract") ||
    normalized.includes("signed") ||
    normalized.includes("won")
  )
    return TotalConvertedIcon;
  if (normalized.includes("lost") || normalized.includes("closed"))
    return LostLeadsIcon;

  // Default icon
  return NewLeadsIcon;
};

const getCardStyleForStage = (stageColor?: string): Record<string, unknown> => {
  if (stageColor) {
    return {
      background: `linear-gradient(135deg, ${stageColor}22 0%, ${stageColor}11 100%)`,
      borderLeft: `4px solid ${stageColor}`,
    };
  }
  return kpiCardsStyles.newLeads;
};

const getCardStyle = (id: KpiCardId, stageColor?: string) => {
  switch (id) {
    case "totalLeads":
      return kpiCardsStyles.totalLeads;
    case "newLeads":
      return kpiCardsStyles.newLeads;
    case "appointments":
      return kpiCardsStyles.appointments;
    case "followUps":
      return kpiCardsStyles.followUps;
    case "cycleConversion":
      return kpiCardsStyles.totalConverted;
    case "totalConverted":
      return kpiCardsStyles.totalConverted;
    case "lostLeads":
      return kpiCardsStyles.lostLeads;
    case "negotiation":
      return kpiCardsStyles.followUps;
    case "proposalSent":
      return kpiCardsStyles.appointments;
    case "contractSigned":
      return kpiCardsStyles.totalConverted;
    default:
      return getCardStyleForStage(stageColor);
  }
};

const formatCount = (value: number) =>
  new Intl.NumberFormat("en-IN").format(value || 0);




interface KpiCardsProps {
  timeRange: TimeRange;
}

// ... keep all imports and helper functions (getIconForStage, getCardStyle, etc.) exactly as they are

const KpiCards = ({ timeRange }: KpiCardsProps) => {
  const leads = useSelector(selectLeads);
  const pipelines = useSelector(selectPipelines);
  const sourceLeads = useMemo<Lead[]>(
    () => (Array.isArray(leads) ? (leads as Lead[]) : []),
    [leads],
  );
  const pipelineStages = useMemo(
    () => getActivePipelineStages(pipelines),
    [pipelines],
  );
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Keep the counts calculation as is to ensure data integrity
  const counts = useMemo<ExtendedKpiCounts>(() => {
    const bounds = getTimeRangeBounds(timeRange);
    const filteredLeads = sourceLeads.filter((lead) => {
      if (lead?.is_active === false) return false;
      const rawDate = lead.modified_at || lead.created_at;
      if (!rawDate) return false;
      const leadDate = new Date(rawDate);
      if (Number.isNaN(leadDate.getTime())) return false;
      if (bounds && !isDateWithinBounds(leadDate, bounds)) return false;
      return true;
    });


    if (filteredLeads.length === 0 || pipelineStages.length === 0) {
      // Fill all required keys for ExtendedKpiCounts
      const emptyCounts: ExtendedKpiCounts = {
        totalLeads: 0,
        newLeads: 0,
        appointments: 0,
        followUps: 0,
        cycleConversion: 0,
        totalConverted: 0,
        lostLeads: 0,
        negotiation: 0,
        proposalSent: 0,
        contractSigned: 0,
        registered: 0,
        treatment: 0,
      };
      pipelineStages.forEach((stage) => { emptyCounts[String(stage.id)] = 0; });
      return emptyCounts;
    }

    const stageCounts = buildStageCountMap(filteredLeads, pipelineStages);
    const dynamicCounts: Record<string, number> = {};
    pipelineStages.forEach((stage) => {
      dynamicCounts[stage.id] = stageCounts[stage.id] ?? 0;
    });

    return {
      totalLeads: filteredLeads.length,
      ...dynamicCounts,
    } as ExtendedKpiCounts;
  }, [pipelineStages, sourceLeads, timeRange]);

  // REDUCED LOGIC: Only Total Leads + Dynamic Pipeline Stages
  const dynamicKpis = useMemo<LocalKpiCardData[]>(() => {
    // 1. Start with Total Leads
    const cards: LocalKpiCardData[] = [
      { id: "totalLeads", label: "Total Leads", value: counts.totalLeads },
    ];

    // 2. Map only the pipeline stages from your sales pipeline
    pipelineStages.forEach((stage) => {
      const stageId = String(stage.id);
      cards.push({
        id: stageId as KpiCardId,
        label: stage.stage_name,
        value: counts[stageId] ?? 0,
        stageColor: stage.stage_color,
        stageName: stage.stage_name,
        isDynamicStage: true,
      });
    });

    return cards;
  }, [counts, pipelineStages]);

  const checkScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 10);
      const isAtEnd = scrollLeft >= scrollWidth - clientWidth - 10;
      setShowRightArrow(!isAtEnd && scrollWidth > clientWidth);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  useEffect(() => {
    const timer = window.setTimeout(checkScroll, 100);
    return () => window.clearTimeout(timer);
  }, [checkScroll, dynamicKpis.length]);

  const handleScrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  };

  const handleScrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 300, behavior: "smooth" });
  };

  return (
    <Box sx={{ position: "relative", width: "100%", px: 1 }}>
      {!isSmallScreen && showLeftArrow && (
        <IconButton
          onClick={handleScrollLeft}
          sx={{
            position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
            zIndex: 10, bgcolor: "white", boxShadow: "0px 2px 8px rgba(0,0,0,0.2)",
            width: 36, height: 36, border: "1px solid #e0e0e0",
            "&:hover": { bgcolor: "#f5f5f5" },
          }}
        >
          <ChevronLeftIcon fontSize="medium" />
        </IconButton>
      )}

      <Box
        ref={scrollContainerRef}
        onScroll={checkScroll}
        sx={[
          kpiCardsStyles.grid,
          {
            display: "flex", gap: 1.5, overflowX: "auto", flexWrap: "nowrap",
            width: "100%", pb: 1, scrollbarWidth: "thin",
            "&::-webkit-scrollbar": { height: "5px" },
            "&::-webkit-scrollbar-thumb": { backgroundColor: "#daddf0", borderRadius: "10px" },
          },
        ]}
      >
        {dynamicKpis.map((item) => {
          // All cards now use the standard width since totalConverted is removed
          const cardWidth = isSmallScreen ? 148 : 170;

          const iconSrc = item.id === "totalLeads" 
            ? TotalLeadsIcon 
            : getIconForStage(item.stageName || item.label);

          return (
            <Card
              key={item.id}
              sx={[
                kpiCardsStyles.cardBase,
                getCardStyle(item.id as KpiCardId, item.stageColor),
                {
                  flexShrink: 0, width: cardWidth, minWidth: cardWidth,
                  height: isSmallScreen ? 112 : 120, p: isSmallScreen ? 1.25 : 1.5,
                },
              ]}
            >
              <Box sx={kpiCardsStyles.iconWrapper}>
                <Box
                  component="img"
                  src={iconSrc}
                  alt={item.label}
                  sx={kpiCardsStyles.icon}
                />
              </Box>
              <Typography sx={kpiCardsStyles.label}>{item.label}</Typography>
              <Typography sx={kpiCardsStyles.value}>{formatCount(item.value)}</Typography>
            </Card>
          );
        })}
      </Box>

      {!isSmallScreen && showRightArrow && (
        <IconButton
          onClick={handleScrollRight}
          sx={{
            position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
            zIndex: 10, bgcolor: "white", boxShadow: "0px 2px 8px rgba(0,0,0,0.2)",
            width: 36, height: 36, border: "1px solid #e0e0e0",
            "&:hover": { bgcolor: "#f5f5f5" },
          }}
        >
          <ChevronRightIcon fontSize="medium" />
        </IconButton>
      )}
    </Box>
  );
};

export default KpiCards;