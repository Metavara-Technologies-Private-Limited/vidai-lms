import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import TotalLeadsIcon from "../../assets/icons/TotalLeads.svg";
import NewLeadsIcon from "../../assets/icons/newLeads.svg";
import AppointmentsIcon from "../../assets/icons/appointments.svg";
import FollowUpsIcon from "../../assets/icons/followUps.svg";
import TotalConvertedIcon from "../../assets/icons/totalConverted.svg";
import LostLeadsIcon from "../../assets/icons/lostLeads.svg";

import { kpiCardsStyles } from "../../styles/Dashboard/KpiCards.styles";
import { fetchLeads, selectLeads } from "../../store/leadSlice";
import { LEAD_STATUS } from "../../utils/constants";

/* KPI → ICON MAP */
const KPI_ICONS: Record<string, string> = {
  totalLeads: TotalLeadsIcon,
  newLeads: NewLeadsIcon,
  appointments: AppointmentsIcon,
  followUps: FollowUpsIcon,
  totalConverted: TotalConvertedIcon,
  lostLeads: LostLeadsIcon,
};

const getCardStyle = (id: string) => {
  switch (id) {
    case "totalLeads":      return kpiCardsStyles.totalLeads;
    case "newLeads":        return kpiCardsStyles.newLeads;
    case "appointments":    return kpiCardsStyles.appointments;
    case "followUps":       return kpiCardsStyles.followUps;
    case "totalConverted":  return kpiCardsStyles.totalConverted;
    case "lostLeads":       return kpiCardsStyles.lostLeads;
    default:                return {};
  }
};

const KpiCards = () => {
  const dispatch = useDispatch();
  const leads = useSelector(selectLeads);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // ── Fetch leads on mount if not already loaded ──
  useEffect(() => {
    dispatch(fetchLeads() as any);
  }, [dispatch]);

  // ── Live counts derived from Redux store ──
  // Updates automatically whenever leads change in Redux
  // (e.g. appointment booked, lead converted, new lead added)
  const counts = (() => {
    if (!leads || leads.length === 0) {
      return {
        totalLeads: 0,
        newLeads: 0,
        appointments: 0,
        followUps: 0,
        totalConverted: 0,
        lostLeads: 0,
        registered: 0,
        treatment: 0,
      };
    }

    // Only count active (non-archived) leads
    const activeLeads = leads.filter((l: any) => l.is_active !== false);

    const byStatus = (...statuses: string[]) =>
      activeLeads.filter((l: any) => {
        const s = (l.lead_status || l.status || "").toLowerCase().trim();
        return statuses.some((t) => s === t.toLowerCase());
      }).length;

    return {
      totalLeads:     activeLeads.length,
      newLeads:       byStatus(LEAD_STATUS.NEW),
      appointments:   byStatus(LEAD_STATUS.APPOINTMENT),
      followUps:      byStatus(LEAD_STATUS.FOLLOW_UPS),
      totalConverted: byStatus(LEAD_STATUS.CONVERTED, LEAD_STATUS.CYCLE_CONVERSION),
      lostLeads:      byStatus(LEAD_STATUS.LOST),
      registered:     byStatus(LEAD_STATUS.CONVERTED),        // breakdown: Registered
      treatment:      byStatus(LEAD_STATUS.CYCLE_CONVERSION), // breakdown: Treatment
    };
  })();

  // ── Scroll arrow visibility ──
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 10);
      const isAtEnd = scrollLeft >= scrollWidth - clientWidth - 10;
      setShowRightArrow(!isAtEnd && scrollWidth > clientWidth);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => checkScroll(), 100);
    window.addEventListener("resize", checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const handleScrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  };

  const handleScrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 300, behavior: "smooth" });
  };

  const dynamicKpis = [
    { id: "totalLeads",     label: "Total Leads",     value: counts.totalLeads },
    { id: "newLeads",       label: "New Leads",       value: counts.newLeads },
    { id: "appointments",   label: "Appointments",    value: counts.appointments },
    { id: "followUps",      label: "Follow Ups",      value: counts.followUps },
    {
      id: "totalConverted",
      label: "Total Converted",
      value: counts.totalConverted,
      breakdown: [
        { label: "Registered", value: counts.registered },
        { label: "Treatment",  value: counts.treatment  },
      ],
    },
    { id: "lostLeads", label: "Lost Leads", value: counts.lostLeads },
  ];

  return (
    <Box sx={{ position: "relative", width: "100%", px: 1 }}>
      {showLeftArrow && (
        <IconButton
          onClick={handleScrollLeft}
          sx={{
            position: "absolute", left: 0, top: "50%",
            transform: "translateY(-50%)", zIndex: 10,
            bgcolor: "white", boxShadow: "0px 2px 8px rgba(0,0,0,0.2)",
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
        sx={{
          ...kpiCardsStyles.grid,
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
        }}
      >
        {dynamicKpis.map((item) => (
          <Card
            key={item.id}
            sx={{
              ...kpiCardsStyles.cardBase,
              ...getCardStyle(item.id),
              flexShrink: 0,
              width:    item.id === "totalConverted" ? "280px" : "160px",
              minWidth: item.id === "totalConverted" ? "20px"  : "20px",
            }}
          >
            <Box sx={kpiCardsStyles.iconWrapper}>
              <img
                src={KPI_ICONS[item.id]}
                alt={item.label}
                style={kpiCardsStyles.icon}
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
                  <Typography sx={kpiCardsStyles.label}>{item.label}</Typography>
                  <Typography sx={kpiCardsStyles.value}>{item.value}</Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 3 }}>
                  {item.breakdown?.map((b) => (
                    <Box key={b.label}>
                      <Typography sx={kpiCardsStyles.breakdownLabel}>{b.label}</Typography>
                      <Typography sx={kpiCardsStyles.breakdownValue}>{b.value}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : (
              <>
                <Typography sx={kpiCardsStyles.label}>{item.label}</Typography>
                <Typography sx={kpiCardsStyles.value}>{item.value}</Typography>
              </>
            )}
          </Card>
        ))}
      </Box>

      {showRightArrow && (
        <IconButton
          onClick={handleScrollRight}
          sx={{
            position: "absolute", right: 0, top: "50%",
            transform: "translateY(-50%)", zIndex: 10,
            bgcolor: "white", boxShadow: "0px 2px 8px rgba(0,0,0,0.2)",
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