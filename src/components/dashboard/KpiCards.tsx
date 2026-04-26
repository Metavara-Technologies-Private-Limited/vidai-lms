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
  | "contractSigned";

type LocalKpiCardData = {
  id: KpiCardId;
  label: string;
  value: number;
  breakdown?: Array<{ label: string; value: number }>;
};

type ExtendedKpiCounts = LiveKpiCounts & {
  cycleConversion: number;
  negotiation: number;
  proposalSent: number;
  contractSigned: number;
  registered: number;
  treatment: number;
};

/* KPI → ICON MAP */
const KPI_ICONS: Record<KpiCardId, string> = {
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

const getCardStyle = (id: KpiCardId) => {
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
      return {};
  }
};

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
  const pipelineStages = useMemo(
    () => getActivePipelineStages(pipelines),
    [pipelines],
  );
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

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

    const activeLeadCount = filteredLeads.reduce(
      (count, lead) => (lead?.is_active === false ? count : count + 1),
      0,
    );

    if (filteredLeads.length === 0 || pipelineStages.length === 0) {
      return {
        totalLeads: activeLeadCount,
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

    const stageCounts = buildStageCountMap(filteredLeads, pipelineStages);

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
      totalLeads: activeLeadCount,
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
  }, [pipelineStages, sourceLeads, timeRange]);

  const stageNameSet = useMemo(
    () =>
      new Set(
        pipelineStages.map((stage) => normalizeStageName(stage.stage_name)),
      ),
    [pipelineStages],
  );

  const dynamicKpis = useMemo<LocalKpiCardData[]>(() => {
    const hasStage = (statusKey: string) => {
      const candidates = getEquivalentStatusKeys(statusKey);
      for (const candidate of candidates) {
        if (stageNameSet.has(candidate)) return true;
      }
      return false;
    };

    const cards: LocalKpiCardData[] = [
      { id: "totalLeads", label: "Total Leads", value: counts.totalLeads },
    ];

    if (hasStage("new")) {
      cards.push({
        id: "newLeads",
        label: "New Leads",
        value: counts.newLeads,
      });
    }

    if (hasStage("appointment")) {
      cards.push({
        id: "appointments",
        label: "Appointments",
        value: counts.appointments,
      });
    }

    cards.push({
      id: "followUps",
      label: "Follow Ups",
      value: counts.followUps,
    });

    if (hasStage("negotiation")) {
      cards.push({
        id: "negotiation",
        label: "Negotiation",
        value: counts.negotiation,
      });
    }

    if (hasStage("proposal-sent")) {
      cards.push({
        id: "proposalSent",
        label: "Proposal Sent",
        value: counts.proposalSent,
      });
    }

    if (hasStage("contract-signed")) {
      cards.push({
        id: "contractSigned",
        label: "Contract Signed",
        value: counts.contractSigned,
      });
    }

    if (hasStage("cycle-conversion")) {
      cards.push({
        id: "cycleConversion",
        label: "Cycle Conversion",
        value: counts.cycleConversion,
      });
    }

    if (
      hasStage("converted") ||
      hasStage("cycle-conversion") ||
      hasStage("contract-signed")
    ) {
      const breakdown: Array<{ label: string; value: number }> = [];
      if (hasStage("converted")) {
        breakdown.push({ label: "Converted", value: counts.registered });
      }
      if (hasStage("cycle-conversion")) {
        breakdown.push({ label: "Cycle", value: counts.treatment });
      }
      if (hasStage("contract-signed")) {
        breakdown.push({ label: "Signed", value: counts.contractSigned });
      }

      cards.push({
        id: "totalConverted",
        label: "Total Converted",
        value: counts.totalConverted,
        breakdown,
      });
    }

    if (hasStage("lost")) {
      cards.push({
        id: "lostLeads",
        label: "Lost Leads",
        value: counts.lostLeads,
      });
    }

    return cards;
  }, [counts, stageNameSet]);

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

          return (
            <Card
              key={item.id}
              sx={[
                kpiCardsStyles.cardBase,
                getCardStyle(item.id),
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
                  src={KPI_ICONS[item.id]}
                  alt={item.label}
                  sx={kpiCardsStyles.icon}
                />
              </Box>

              {item.id === "totalConverted" ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    width: "100%",
                    mt: 1,
                  }}
                >
                  <Box>
                    <Typography sx={kpiCardsStyles.label}>
                      {item.label}
                    </Typography>
                    <Typography sx={kpiCardsStyles.value}>
                      {formatCount(item.value)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 3 }}>
                    {item.breakdown?.map((b) => (
                      <Box key={b.label}>
                        <Typography sx={kpiCardsStyles.breakdownLabel}>
                          {b.label}
                        </Typography>
                        <Typography sx={kpiCardsStyles.breakdownValue}>
                          {formatCount(b.value)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : (
                <>
                  <Typography sx={kpiCardsStyles.label}>
                    {item.label}
                  </Typography>
                  <Typography sx={kpiCardsStyles.value}>
                    {formatCount(item.value)}
                  </Typography>
                </>
              )}
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
