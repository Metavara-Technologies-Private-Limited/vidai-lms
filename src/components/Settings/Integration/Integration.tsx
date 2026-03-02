import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";

import Facebook from "../../../assets/icons/Facebook.svg";
import Instagram from "../../../assets/icons/Instagram.svg";
import Linkedin from "../../../assets/icons/Linkedin.svg";
import GoogleAds from "../../../assets/icons/Google_Ads.svg";
import GoogleCalender from "../../../assets/icons/Google_Calender.svg";

import { styles } from "../../../styles/Settings/Integration.styles";
import IntegrationCard from "./IntegrationCard";

const Integration = () => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (params.get("linkedin") === "connected") {
      localStorage.setItem("integration_LinkedIn", "true");
    }

    if (params.get("facebook") === "connected") {
      localStorage.setItem("integration_Facebook", "true");
      localStorage.setItem("integration_Instagram", "true");
    }

    window.history.replaceState({}, document.title, "/settings/integration");
  }, [location]);

  return (
    <Box>
      <Typography sx={styles.pageTitle}>Integration</Typography>

      <Box sx={styles.gridWrapper}>
        <IntegrationCard
          name="Facebook"
          description="For Run campaigns, publish posts"
          icon={Facebook}
          headerBgColor="rgba(45, 107, 240, 0.04)"
        />

        <IntegrationCard
          name="Instagram"
          description="For Run campaigns, publish posts"
          icon={Instagram}
          headerBgColor="rgba(243, 118, 79, 0.06)"
        />

        <IntegrationCard
          name="LinkedIn"
          description="For Publish"
          icon={Linkedin}
          headerBgColor="rgba(61, 128, 179, 0.06)"
        />

        <IntegrationCard
          name="Google Ads"
          description="Google Ads Account"
          icon={GoogleAds}
          headerBgColor="rgba(255, 193, 7, 0.06)"
        />

        <IntegrationCard
          name="Google Calendar"
          description="For appointments, calls, meets.."
          icon={GoogleCalender}
          headerBgColor="rgba(0, 133, 247, 0.04)"
        />
      </Box>
    </Box>
  );
};

export default Integration;
