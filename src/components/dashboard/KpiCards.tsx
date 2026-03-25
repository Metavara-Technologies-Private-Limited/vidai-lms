import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";

import TotalLeadsIcon from "../../assets/icons/TotalLeads.svg";
import NewLeadsIcon from "../../assets/icons/NewLeads.svg";
import AppointmentsIcon from "../../assets/icons/Appointments.svg";
import FollowUpsIcon from "../../assets/icons/FollowUps.svg";
import TotalConvertedIcon from "../../assets/icons/TotalConverted.svg";
import LostLeadsIcon from "../../assets/icons/LostLeads.svg";

import { IS_MEDICAL_APP, IS_CONTRACTS_APP } from "../../config/appType";
import { kpiCardsStyles } from "../../styles/dashboard/KpiCards.styles";
import { selectLeads } from "../../store/leadSlice";
import { LEAD_STATUS } from "../../utils/constants";
import type { LiveKpiCounts } from "../../types/dashboard.types";
import type { Lead } from "../../services/leads.api";

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

const normalizeLeadStatus = (status?: string | null): string => {
  if (!status) return "";

  const value = status.toLowerCase().trim().replace(/[_\s]+/g, "-");

  if (value === "new" || value === "new-lead" || value === "new-leads") {
    return LEAD_STATUS.NEW.toLowerCase();
  }
  if (value === "appointment" || value === "appointments") {
    return LEAD_STATUS.APPOINTMENT.toLowerCase();
  }
  if (
    value === "follow-up" ||
    value === "follow-ups" ||
    value === "followup" ||
    value === "followups" ||
    value === "follow-up-lead" ||
    value === "follow-up-leads"
  ) {
    return LEAD_STATUS.FOLLOW_UPS.toLowerCase();
  }
  if (value === "converted") return LEAD_STATUS.CONVERTED.toLowerCase();
  if (value === "cycle-conversion" || value === "cycleconversion") {
    return LEAD_STATUS.CYCLE_CONVERSION.toLowerCase();
  }
  if (value === "lost") return LEAD_STATUS.LOST.toLowerCase();

  // Contracts statuses
  if (value === "negotiation" || value === "in-negotiation" || value === "under-negotiation") {
    return "negotiation";
  }
  if (value === "proposal-sent" || value === "proposalsent" || value === "proposal") {
    return "proposal-sent";
  }
  if (value === "contract-signed" || value === "contractsigned" || value === "signed") {
    return "contract-signed";
  }

  return value;
};

const formatCount = (value: number) => new Intl.NumberFormat("en-IN").format(value || 0);

const KpiCards = () => {
  const leads = useSelector(selectLeads);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // ── Live counts derived from Redux store ──
  const counts = useMemo<ExtendedKpiCounts>(() => {
    if (!Array.isArray(leads) || leads.length === 0) {
      return {
        totalLeads: 0,
        newLeads: 0,
        appointments: 0,
        followUps: 0,
        cycleConversion: 0,
        totalConverted: 0,
        negotiation: 0,
        proposalSent: 0,
        contractSigned: 0,
        lostLeads: 0,
        registered: 0,
        treatment: 0,
        negotiation: 0,
        proposalSent: 0,
        contractSigned: 0,
      };
    }

    let totalLeads = 0;
    let newLeads = 0;
    let appointments = 0;
    let followUps = 0;
    let converted = 0;
    let cycleConversion = 0;
    let lostLeads = 0;

    let negotiation = 0;
    let proposalSent = 0;
    let contractSigned = 0;

    for (const lead of leads as Lead[]) {
      if (lead?.is_active === false) continue;

      totalLeads += 1;
      const status = normalizeLeadStatus(
        lead.lead_status || (lead as unknown as { status?: string }).status,
      );

      if (status === LEAD_STATUS.NEW.toLowerCase()) newLeads += 1;
      else if (status === LEAD_STATUS.APPOINTMENT.toLowerCase()) appointments += 1;
      else if (status === LEAD_STATUS.FOLLOW_UPS.toLowerCase()) followUps += 1;
      else if (status === LEAD_STATUS.CONVERTED.toLowerCase()) converted += 1;
      else if (status === LEAD_STATUS.CYCLE_CONVERSION.toLowerCase()) cycleConversion += 1;
      else if (status === LEAD_STATUS.LOST.toLowerCase()) lostLeads += 1;
      else if (status === "negotiation") negotiation += 1;
      else if (status === "proposal-sent") proposalSent += 1;
      else if (status === "contract-signed") contractSigned += 1;
    }

    const totalConverted =
      converted +
      (IS_MEDICAL_APP ? cycleConversion : 0) +
      (IS_CONTRACTS_APP ? contractSigned : 0);

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
  }, [leads]);

  const dynamicKpis = useMemo<LocalKpiCardData[]>(() => {
    const cards: LocalKpiCardData[] = [
      { id: "totalLeads", label: "Total Leads", value: counts.totalLeads },
      { id: "newLeads", label: "New Leads", value: counts.newLeads },
    ];

    // Show "Appointments" card only for medical
    if (IS_MEDICAL_APP) {
      cards.push({ id: "appointments", label: "Appointments", value: counts.appointments });
    }

    // Show contracts-only cards
    if (IS_CONTRACTS_APP) {
      cards.push(
        { id: "negotiation", label: "Negotiation", value: counts.negotiation },
        { id: "proposalSent", label: "Proposal Sent", value: counts.proposalSent },
        { id: "contractSigned", label: "Contract Signed", value: counts.contractSigned },
      );
    }

    cards.push({ id: "followUps", label: "Follow Ups", value: counts.followUps });

    // "Cycle Conversion" — only for medical
    if (IS_MEDICAL_APP) {
      cards.push({
        id: "cycleConversion",
        label: "Cycle Conversion",
        value: counts.cycleConversion,
      });
    }

    cards.push({
      id: "totalConverted",
      label: "Total Converted",
      value: counts.totalConverted,
      breakdown: IS_MEDICAL_APP
        ? [
            { label: "Registered", value: counts.registered },
            { label: "Treatment", value: counts.treatment },
          ]
        : [
            { label: "Proposal Sent", value: counts.proposalSent },
            { label: "Signed", value: counts.contractSigned },
          ],
    });

    cards.push({ id: "lostLeads", label: "Lost Leads", value: counts.lostLeads });

    return cards;
  }, [counts]);

  // ── Scroll arrow visibility ──
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
      {showLeftArrow && (
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
          const cardWidth = item.id === "totalConverted" ? 280 : 170;

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
                },
              ]}
            >
              <Box sx={kpiCardsStyles.iconWrapper}>
                <Box component="img" src={KPI_ICONS[item.id]} alt={item.label} sx={kpiCardsStyles.icon} />
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
                    <Typography sx={kpiCardsStyles.label}>{item.label}</Typography>
                    <Typography sx={kpiCardsStyles.value}>{formatCount(item.value)}</Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 3 }}>
                    {item.breakdown?.map((b) => (
                      <Box key={b.label}>
                        <Typography sx={kpiCardsStyles.breakdownLabel}>{b.label}</Typography>
                        <Typography sx={kpiCardsStyles.breakdownValue}>
                          {formatCount(b.value)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : (
                <>
                  <Typography sx={kpiCardsStyles.label}>{item.label}</Typography>
                  <Typography sx={kpiCardsStyles.value}>{formatCount(item.value)}</Typography>
                </>
              )}
            </Card>
          );
        })}
      </Box>

      {showRightArrow && (
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