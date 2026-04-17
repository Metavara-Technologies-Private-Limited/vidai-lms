// Referrals.tsx — uses Redux (referralSlice) instead of local hook

import { useEffect, useRef } from "react";
import { Box, Card, Typography, CircularProgress, Tooltip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../store";
import {
  loadDashboardCounts,
  selectCounts,
  selectCountsLoading,
  selectCountsError,
} from "../store/referralSlice";
import { selectClinic } from "../store/clinicSlice";

// Icons
import Referral_HR from "../assets/icons/Referral_HR.svg";
import Referral_Practo from "../assets/icons/Referral_Practo.svg";
import Referral_Doctor from "../assets/icons/Referral_Doc.svg";
import Referral_Zoya from "../assets/icons/Referral_Zoya.svg";
import Referral_Insurance from "../assets/icons/Referral_Insurance.svg";
import Referral_Daignostic from "../assets/icons/Referral_Daignostic.svg";

// dbKey must exactly match ReferralDepartment.name stored in your DB
const CARDS = [
  {
    title: "Doctors",
    dbKey: "Doctors",
    route: "/referrals/doctors",
    icon: Referral_Doctor,
    dotColor: "#5392F2",
    bg: "linear-gradient(to top, #ffffff 0%, #ffffff 55%, rgba(83,146,242,0.18) 140%)",
  },
  {
    title: "Corporate HR",
    dbKey: "Corporate HR",
    route: "/referrals/corporate",
    icon: Referral_HR,
    dotColor: "#47B35F",
    bg: "linear-gradient(to top, #ffffff 0%, #ffffff 55%, rgba(71,179,95,0.18) 140%)",
  },
  {
    title: "Insurance Partners",
    dbKey: "Insurance Partners",
    route: "/referrals/insurance",
    icon: Referral_Insurance,
    dotColor: "#ECB456",
    bg: "linear-gradient(to top, #ffffff 0%, #ffffff 55%, rgba(236,189,86,0.18) 140%)",
  },
  {
    title: "Diagnostic Labs",
    dbKey: "Diagnostic Labs",
    route: "/referrals/diagnostic",
    icon: Referral_Daignostic,
    dotColor: "#F25B5B",
    bg: "linear-gradient(to top, #ffffff 0%, #ffffff 55%, rgba(242,91,91,0.18) 140%)",
  },
  {
    title: "Zoya",
    dbKey: "Zoya",
    route: "/referrals/zoya",
    icon: Referral_Zoya,
    dotColor: "#835DEF",
    bg: "linear-gradient(to top, #ffffff 0%, #ffffff 55%, rgba(131,93,239,0.18) 140%)",
  },
  {
    title: "Practo",
    dbKey: "Practo",
    route: "/referrals/practo",
    icon: Referral_Practo,
    dotColor: "#2D6BF0",
    bg: "linear-gradient(to top, #ffffff 0%, #ffffff 55%, rgba(45,107,240,0.18) 140%)",
  },
];

const Referrals = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const selectedClinic = useSelector(selectClinic);

  const counts  = useSelector(selectCounts);
  const loading = useSelector(selectCountsLoading);
  const error   = useSelector(selectCountsError);

  const clinicId = selectedClinic?.id ?? Number(localStorage.getItem("clinic_id") ?? 1);

  // Track last fetched clinic to prevent infinite fetches
  const lastFetchedClinicRef = useRef<number | null>(null);

  // Fetch on mount or when clinic changes
  useEffect(() => {
    // Only fetch if we haven't already fetched this clinic
    if (lastFetchedClinicRef.current !== clinicId) {
      lastFetchedClinicRef.current = clinicId;
      dispatch(loadDashboardCounts(clinicId));
    }
  }, [dispatch, clinicId]);

  return (
    <Box sx={{ p: 1, width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          Referral Management
        </Typography>

        {loading && <CircularProgress size={14} thickness={5} />}

        {error && (
          <Tooltip title={`Could not load counts: ${error}`} arrow>
            <Typography fontSize={12} color="error.main" sx={{ cursor: "help" }}>
              ⚠ failed to load
            </Typography>
          </Tooltip>
        )}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1.5 }}>
        {CARDS.map((card) => (
          <Card
            key={card.title}
            onClick={() => navigate(card.route)}
            sx={{
              p: 2,
              borderRadius: "12px",
              background: card.bg,
              boxShadow: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "center",
              border: "1px solid #f0f0f0",
              transition: "transform 0.2s, box-shadow 0.2s",
              cursor: "pointer",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0px 4px 12px rgba(0,0,0,0.07)",
              },
            }}
          >
            <Box
              component="img"
              src={card.icon}
              alt={card.title}
              sx={{ width: 38, height: 38, mb: 1, objectFit: "contain" }}
            />

            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
              <Typography fontSize={15} fontWeight={700}>
                {card.title}
              </Typography>

              {loading ? (
                <CircularProgress size={11} thickness={5} sx={{ ml: 0.5, color: card.dotColor }} />
              ) : (
                <Typography fontSize={13} color="text.secondary">
                  ({counts[card.dbKey] ?? 0})
                </Typography>
              )}
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default Referrals;