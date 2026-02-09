import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useRef, useState, useEffect } from "react";

import TotalLeadsIcon from "../../assets/icons/TotalLeads.svg";
import NewLeadsIcon from "../../assets/icons/newLeads.svg";
import AppointmentsIcon from "../../assets/icons/appointments.svg";
import FollowUpsIcon from "../../assets/icons/followUps.svg";
import TotalConvertedIcon from "../../assets/icons/totalConverted.svg";
import LostLeadsIcon from "../../assets/icons/lostLeads.svg";

import { mockData } from "./mockData";
import { kpiCardsStyles } from "../../styles/dashboard/KpiCards.styles";

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
    case "totalLeads":
      return kpiCardsStyles.totalLeads;
    case "newLeads":
      return kpiCardsStyles.newLeads;
    case "appointments":
      return kpiCardsStyles.appointments;
    case "followUps":
      return kpiCardsStyles.followUps;
    case "totalConverted":
      return kpiCardsStyles.totalConverted;
    case "lostLeads":
      return kpiCardsStyles.lostLeads;
    default:
      return {};
  }
};

const KpiCards = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  // Check scroll position to show/hide arrows
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      
      // Show left arrow if scrolled right (with small tolerance)
      setShowLeftArrow(scrollLeft > 10);
      
      // Show right arrow if not at the end (with tolerance)
      const isAtEnd = scrollLeft >= scrollWidth - clientWidth - 10;
      setShowRightArrow(!isAtEnd && scrollWidth > clientWidth);
    }
  };

  // Check on mount and when container resizes
  useEffect(() => {
    // Initial check with a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      checkScroll();
    }, 100);
    
    window.addEventListener("resize", checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  // Scroll left
  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -300,
        behavior: "smooth",
      });
    }
  };

  // Scroll right
  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: "smooth",
      });
    }
  };

  return (
<<<<<<< HEAD
    <Box sx={{ position: "relative", width: "100%", px: 3 }}>
      {/* LEFT ARROW */}
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
            "&:hover": {
              bgcolor: "#f5f5f5",
              boxShadow: "0px 4px 12px rgba(0,0,0,0.25)",
            },
=======
    <Box
      sx={{
        ...kpiCardsStyles.grid,
        display: "flex",
        gap: 1.5,
        overflowX: "auto",
        flexWrap: "nowrap",
        width: "100%",
        pb: 1,
        // Custom slim scrollbar to match the design
        "&::-webkit-scrollbar": { height: "5px" },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#daddf0",
          borderRadius: "10px",
        },
      }}
    >
      {mockData.kpis.map((item) => (
        <Card
          key={item.id}
          sx={{
            ...kpiCardsStyles.cardBase,
            ...getCardStyle(item.id),
            flexShrink: 0,
            width: item.id === "totalConverted" ? "calc(50% - 12px)" : "calc(25% - 12px)",
            minWidth: item.id === "totalConverted" ? "20px" : "20px",
>>>>>>> f20e4874b979c17906d33f13291fc627681cb265
          }}
        >
          <ChevronLeftIcon fontSize="medium" />
        </IconButton>
      )}

      {/* SCROLLABLE CONTAINER */}
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
          // Custom slim scrollbar to match the design
          "&::-webkit-scrollbar": { height: "5px" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#daddf0",
            borderRadius: "10px",
          },
        }}
      >
        {mockData.kpis.map((item) => (
          <Card
            key={item.id}
            sx={{
              ...kpiCardsStyles.cardBase,
              ...getCardStyle(item.id),
              flexShrink: 0,
              width: item.id === "totalConverted" ? "calc(50% - 12px)" : "calc(25% - 12px)",
              minWidth: item.id === "totalConverted" ? "20px" : "20px",
            }}
          >
            {/* ICON */}
            <Box sx={kpiCardsStyles.iconWrapper}>
              <img
                src={KPI_ICONS[item.id]}
                alt={item.label}
                style={kpiCardsStyles.icon}
              />
            </Box>

            {/* ===== TOTAL CONVERTED (SPECIAL LAYOUT) ===== */}
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
                {/* LEFT : LABEL + TOTAL */}
                <Box>
                  <Typography sx={kpiCardsStyles.label}>
                    {item.label}
                  </Typography>
                  <Typography sx={kpiCardsStyles.value}>
                    {item.value}
                  </Typography>
                </Box>

                {/* RIGHT : REGISTER / TREATMENT */}
                <Box sx={{ display: "flex", gap: 3 }}>
                  {item.breakdown?.map((b) => (
                    <Box key={b.label}>
                      <Typography sx={kpiCardsStyles.breakdownLabel}>
                        {b.label}
                      </Typography>
                      <Typography sx={kpiCardsStyles.breakdownValue}>
                        {b.value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : (
              /* ===== NORMAL KPI CARDS ===== */
              <>
                <Typography sx={kpiCardsStyles.label}>
                  {item.label}
                </Typography>
                <Typography sx={kpiCardsStyles.value}>
                  {item.value}
                </Typography>
              </>
            )}
          </Card>
        ))}
      </Box>

      {/* RIGHT ARROW */}
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
            "&:hover": {
              bgcolor: "#f5f5f5",
              boxShadow: "0px 4px 12px rgba(0,0,0,0.25)",
            },
          }}
        >
          <ChevronRightIcon fontSize="medium" />
        </IconButton>
      )}
    </Box>
  );
};

export default KpiCards;