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
import type { Theme, SystemStyleObject } from "@mui/system";

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

// Array of available icons for random assignment
// Exclude TotalLeadsIcon (the 'three person' icon) from dynamic stage icons
const RANDOM_STAGE_ICONS = [
  NewLeadsIcon,
  AppointmentsIcon,
  FollowUpsIcon,
  TotalConvertedIcon,
  LostLeadsIcon,
];

// Exclude totalLeads style from dynamic stage styles
const RANDOM_STAGE_STYLES = [
  kpiCardsStyles.newLeads,
  kpiCardsStyles.appointments,
  kpiCardsStyles.followUps,
  kpiCardsStyles.totalConverted,
  kpiCardsStyles.lostLeads,
];
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
  | "contractSigned";

type LocalKpiCardData = {
  id: KpiCardId;
  label: string;
  value: number;
  breakdown?: Array<{ label: string; value: number }>;
};

type DynamicKpiCardData = LocalKpiCardData & { icon: string; cardStyle: SystemStyleObject<Theme> };

type ExtendedKpiCounts = LiveKpiCounts & {
  cycleConversion: number;
  negotiation: number;
  proposalSent: number;
  contractSigned: number;
  registered: number;
  treatment: number;
};

/* KPI → ICON MAP */


const formatCount = (value: number) =>
  new Intl.NumberFormat("en-IN").format(value || 0);

const equivalentStatuses: Record<string, string[]> = {
  new: ["new"],
  contacted: ["contacted"],
  "follow-ups": [
    "follow-ups",
    "follow-up",
    "followup",
    "follow-up-leads",
    "follow-up-lead",
    "follow-up-lead-stage",
    "follow-up-stage",
    "contacted",
  ],
  converted: ["converted", "converted-lead", "converted-leads"],
  lost: ["lost", "lost-lead", "lost-leads", "closed", "closed-lost"],
  "cycle-conversion": ["cycle-conversion", "cycleconversion"],
  appointment: ["appointment", "appointments"],
  negotiation: ["negotiation", "negotiating"],
  "proposal-sent": ["proposal-sent", "proposal"],
  "contract-signed": ["contract-signed", "contractsigned", "contract"],
};

const getEquivalentStatusKeys = (statusKey: string): Set<string> => {
  const normalized = normalizeStageName(statusKey);
  return new Set(equivalentStatuses[normalized] ?? [normalized]);
};

const stageMatchesStatusKey = (
  stageName: string,
  statusKey: string,
): boolean => {
  const normalizedStage = normalizeStageName(stageName);
  return getEquivalentStatusKeys(statusKey).has(normalizedStage);
};

interface KpiCardsProps {
  timeRange: TimeRange;
}

const KpiCards = ({ timeRange }: KpiCardsProps) => {
  const leads = useSelector(selectLeads);
  const pipelines = useSelector(selectPipelines);
  const sourceLeads = useMemo<Lead[]>(
    () => (Array.isArray(leads) ? (leads as Lead[]) : []),
    [leads],
  );
  const defaultPipeline = useMemo(() => {
    const backendDefault =
      pipelines.find((pipeline) => pipeline.is_default) ??
      pipelines.find((pipeline) => pipeline.is_active) ??
      null;
    if (backendDefault) return backendDefault;

    const storedDefaultPipelineId =
      typeof window !== "undefined"
        ? localStorage.getItem("leads_default_pipeline_id")
        : null;
    if (!storedDefaultPipelineId) return null;

    return (
      pipelines.find(
        (pipeline) => String(pipeline.id) === String(storedDefaultPipelineId),
      ) ?? null
    );
  }, [pipelines]);
  const pipelineStages = useMemo(
    () => {
      if (!defaultPipeline) return [];
      // sort ASCENDING by stage_order to match the pipeline stages view
      const stages = getActivePipelineStages([defaultPipeline]);
      return [...stages].sort((a, b) => {
        const aOrder = typeof a.stage_order === 'number' ? a.stage_order : 0;
        const bOrder = typeof b.stage_order === 'number' ? b.stage_order : 0;
        return aOrder - bOrder;
      });
    },
    [defaultPipeline],
  );
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const filteredLeads = useMemo<Lead[]>(() => {
    const bounds = getTimeRangeBounds(timeRange);
    const isAllTime = timeRange === "all";
    return sourceLeads.filter((lead) => {
      if (lead?.is_active === false) return false;
      if (isAllTime) return true;
      const rawDate = lead.modified_at || lead.created_at;
      if (!rawDate) return false;
      const leadDate = new Date(rawDate);
      if (Number.isNaN(leadDate.getTime())) return false;
      if (bounds && !isDateWithinBounds(leadDate, bounds)) return false;
      return true;
    });
  }, [sourceLeads, timeRange]);

  // Shared stage count map — computed once, used by both counts and dynamicKpis
  const stageCounts = useMemo(
    () => buildStageCountMap(filteredLeads, pipelineStages),
    [filteredLeads, pipelineStages],
  );

  const counts = useMemo<ExtendedKpiCounts>(() => {
    // totalLeads = ALL active leads regardless of time range
    const totalLeads = sourceLeads.filter((l) => l.is_active !== false).length;

    if (filteredLeads.length === 0 || pipelineStages.length === 0) {
      return {
        totalLeads,
        newLeads: 0,
        appointments: 0,
        followUps: 0,
        cycleConversion: 0,
        totalConverted: 0,
        lostLeads: 0,
        registered: 0,
        treatment: 0,
        negotiation: 0,
        proposalSent: 0,
        contractSigned: 0,
      };
    }

    const sumCountsByStatusKey = (statusKey: string): number =>
      pipelineStages.reduce((total, stage) => {
        if (!stageMatchesStatusKey(stage.stage_name, statusKey)) return total;
        return total + (stageCounts[stage.id] ?? 0);
      }, 0);

    const newLeads = sumCountsByStatusKey("new");
    const appointments = sumCountsByStatusKey("appointment");
    const followUps = sumCountsByStatusKey("follow-ups");
    const cycleConversion = sumCountsByStatusKey("cycle-conversion");
    const converted = sumCountsByStatusKey("converted");
    const lostLeads = sumCountsByStatusKey("lost");
    const negotiation = sumCountsByStatusKey("negotiation");
    const proposalSent = sumCountsByStatusKey("proposal-sent");
    const contractSigned = sumCountsByStatusKey("contract-signed");

    const totalConverted = converted + cycleConversion + contractSigned;

    return {
      totalLeads,
      newLeads,
      appointments,
      followUps,
      cycleConversion,
      totalConverted,
      lostLeads,
      registered: converted,
      treatment: cycleConversion,
      negotiation,
      proposalSent,
      contractSigned,
    };
  }, [pipelineStages, filteredLeads, stageCounts, sourceLeads]);

  // Fully dynamic: show a KPI card for every pipeline stage with a random icon
  const dynamicKpis = useMemo<DynamicKpiCardData[]>(() => {
    // Always show total leads first
    const cards: DynamicKpiCardData[] = [
      { id: "totalLeads", label: "Total Leads", value: counts.totalLeads, icon: TotalLeadsIcon, cardStyle: kpiCardsStyles.totalLeads },
    ];

    // Sort stages by stage_order before rendering
    const sortedStages = [...pipelineStages].sort((a, b) => {
      const aOrder = typeof a.stage_order === 'number' ? a.stage_order : 0;
      const bOrder = typeof b.stage_order === 'number' ? b.stage_order : 0;
      return aOrder - bOrder;
    });
    sortedStages.forEach((stage, idx) => {
      const icon = RANDOM_STAGE_ICONS[idx % RANDOM_STAGE_ICONS.length];
      const cardStyle = RANDOM_STAGE_STYLES[idx % RANDOM_STAGE_STYLES.length];
      cards.push({
        id: normalizeStageName(stage.stage_name) as KpiCardId,
        label: stage.stage_name,
        value: stageCounts[stage.id] || 0,
        icon,
        cardStyle,
      });
    });

    return cards;
  }, [counts, pipelineStages, stageCounts]);

  const checkScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 10);
      const isAtEnd = scrollLeft >= scrollWidth - clientWidth - 10;
      setShowRightArrow(!isAtEnd && scrollWidth > clientWidth);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("resize", checkScroll);
    return () => {
      window.removeEventListener("resize", checkScroll);
    };
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
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            bgcolor: "white",
            boxShadow: "0px 2px 8px rgba(0,0,0,0.2)",
            width: 36,
            height: 36,
            border: "1px solid #e0e0e0",
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
            display: "flex",
            gap: 1.5,
            overflowX: "auto",
            flexWrap: "nowrap",
            width: "100%",
            pb: 1,
            scrollbarWidth: "thin",
            "&::-webkit-scrollbar": { height: "5px" },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#daddf0",
              borderRadius: "10px",
            },
          },
        ]}
      >
        {dynamicKpis.map((item) => {
          const cardWidth = isSmallScreen
            ? item.id === "totalConverted"
              ? 240
              : 148
            : item.id === "totalConverted"
              ? 280
              : 170;

          // Ensure cardStyle is always a plain object, not undefined or array
          return (
            <Card
              key={item.id}
              sx={[
                kpiCardsStyles.cardBase,
                item.cardStyle,
                {
                  flexShrink: 0,
                  width: cardWidth,
                  minWidth: cardWidth,
                  height: isSmallScreen ? 112 : 120,
                  p: isSmallScreen ? 1.25 : 1.5,
                },
              ]}
            >
              <Box sx={kpiCardsStyles.iconWrapper}>
                <Box
                  component="img"
                  src={item.icon}
                  alt={item.label}
                  sx={kpiCardsStyles.icon}
                />
              </Box>

              <Typography sx={kpiCardsStyles.label}>
                {item.label}
              </Typography>
              <Typography sx={kpiCardsStyles.value}>
                {formatCount(item.value)}
              </Typography>
            </Card>
          );
        })}
      </Box>

      {!isSmallScreen && showRightArrow && (
        <IconButton
          onClick={handleScrollRight}
          sx={{
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            bgcolor: "white",
            boxShadow: "0px 2px 8px rgba(0,0,0,0.2)",
            width: 36,
            height: 36,
            border: "1px solid #e0e0e0",
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
