import { Box, Card, Typography } from "@mui/material";

// ######### Referral icons ########
import Referral_HR from "../assets/icons/Referral_HR.svg";
import Referral_Practo from "../assets/icons/Referral_Practo.svg";
import Referral_Doctor from "../assets/icons/Referral_Doc.svg";
import Referral_Zoya from "../assets/icons/Referral_Zoya.svg";
import Referral_Insurance from "../assets/icons/Referral_Insurance.svg";
import Referral_Daignostic from "../assets/icons/Referral_Daignostic.svg";

const referralData = [
  {
    title: "Doctors",
    count: 12,
    icon: Referral_Doctor,
    bg: "linear-gradient(to top, #ffffff 0%, #ffffff 55%, rgba(83,146,242,0.18) 140%)",
  },
  {
    title: "Corporate HR",
    count: 8,
    icon: Referral_HR,
    bg: "linear-gradient(to top, #ffffff 0%, #ffffff 55%, rgba(71,179,95,0.18) 140%)",
  },
  {
    title: "Insurance Partners",
    count: 6,
    icon: Referral_Insurance,
    bg: "linear-gradient(to top, #ffffff 0%, #ffffff 55%, rgba(236,189,86,0.18) 140%)",
  },
  {
    title: "Diagnostic Labs",
    count: 16,
    icon: Referral_Daignostic,
    bg: "linear-gradient(to top, #ffffff 0%, #ffffff 55%, rgba(242,91,91,0.18) 140%)",
  },
  {
    title: "Zoya",
    count: 12,
    icon: Referral_Zoya,
    bg: "linear-gradient(to top, #ffffff 0%, #ffffff 55%, rgba(131,93,239,0.18) 140%)",
  },
  {
    title: "Practo",
    count: 12,
    icon: Referral_Practo,
    bg: "linear-gradient(to top, #ffffff 0%, #ffffff 55%, rgba(45,107,240,0.18) 140%)",
  },
];

const Referrals = () => {
  return (
    <Box sx={{ p: 1, width: "100%" }}>
      {/* Page Title */}
      <Typography variant="h6" fontWeight={700} mb={2}>
        Referral Management
      </Typography>

      {/* CSS Grid — always exactly 4 equal columns */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 1.5,
        }}
      >
        {referralData.map((item, index) => (
          <Card
            key={index}
            sx={{
              p: 2,
              borderRadius: "12px",
              background: item.bg,
              boxShadow: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "center",
              border: "1px solid #f0f0f0",
              transition: "0.2s",
              cursor: "pointer",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0px 4px 12px rgba(0,0,0,0.05)",
              },
            }}
          >
            {/* SVG Icon */}
            <Box
              component="img"
              src={item.icon}
              alt={item.title}
              sx={{ width: 38, height: 38, mb: 1, objectFit: "contain" }}
            />

            {/* Title + Count */}
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
              <Typography fontSize={15} fontWeight={700}>
                {item.title}
              </Typography>
              <Typography fontSize={13} color="text.secondary">
                ({item.count})
              </Typography>
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default Referrals;
