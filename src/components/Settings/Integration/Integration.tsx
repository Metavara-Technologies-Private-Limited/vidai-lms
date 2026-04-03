import { useEffect, useState } from "react";
// import { useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import dayjs from "dayjs";

import Facebook from "../../../assets/icons/Facebook.svg";
import Instagram from "../../../assets/icons/Instagram.svg";
import Linkedin from "../../../assets/icons/Linkedin.svg";
import GoogleAds from "../../../assets/icons/Google_Ads.svg";
import GoogleCalender from "../../../assets/icons/Google_Calender.svg";

import { styles } from "../../../styles/Settings/Integration.styles";
import IntegrationCard from "./IntegrationCard";
import { selectLeads } from "../../../store/leadSlice";
import { integrationApi } from "../../../services/integration.api";

type SocialPlatform = "facebook" | "instagram" | "linkedin" | "google";

type IntegrationMap = Partial<Record<SocialPlatform, boolean>>;

type SocialAccount = {
  platform: SocialPlatform;
  page_name?: string;
  page_id?: string;
};

const Integration = () => {
  // const location = useLocation();
  const [integrations, setIntegrations] = useState<IntegrationMap>({});

  // Pull leads from Redux to show upcoming appointment count on Google Calendar card
  const rawLeads = useSelector(selectLeads) as
    | {
        lead_status?: string;
        status?: string;
        appointment_date?: string;
        is_active?: boolean;
      }[]
    | null;

  const upcomingAppointmentCount = (() => {
    if (!rawLeads) return 0;
    const today = dayjs().startOf("day");
    return rawLeads.filter((lead) => {
      if (lead.is_active === false) return false;
      const status = (lead.lead_status || lead.status || "")
        .toLowerCase()
        .trim()
        .replace(/[_\s]+/g, "-");
      const isAppointment =
        status === "appointment" || status === "appointments";
      if (!isAppointment || !lead.appointment_date) return false;
      const apptDate = dayjs(lead.appointment_date);
      return (
        apptDate.isValid() &&
        !apptDate.startOf("day").isBefore(today)
      );
    }).length;
  })();

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const clinicId = 1;
        const res = await integrationApi.getSocialAccounts(clinicId);

        const map: IntegrationMap = {};

        (res.data as SocialAccount[]).forEach((acc) => {
          map[acc.platform] = true;

          // Instagram comes via Facebook
          if (acc.platform === "facebook") {
            map.instagram = true;
          }
          if (acc.platform === "google") {
            map.google = true;
          }
        });

        setIntegrations(map);
      } catch (err) {
        console.error("Failed to fetch integrations", err);
      }
    };

    fetchIntegrations();
  }, []);

  // useEffect(() => {
  //   const params = new URLSearchParams(location.search);

  //   if (params.get("linkedin") === "connected") {
  //     localStorage.setItem("integration_LinkedIn", "true");
  //   }

  //   if (params.get("facebook") === "connected") {
  //     localStorage.setItem("integration_Facebook", "true");
  //     localStorage.setItem("integration_Instagram", "true");
  //   }

  //   if (params.get("google_calendar") === "connected") {
  //     localStorage.setItem("integration_Google Calendar", "true");
  //   }

  //   window.history.replaceState({}, document.title, "/settings/integration");
  // }, [location]);

  return (
    <Box>
      <Typography sx={styles.pageTitle}>Integration</Typography>

      <Box sx={styles.gridWrapper}>
        <IntegrationCard
          name="Facebook"
          isConnected={!!integrations.facebook}
          description="For Run campaigns, publish posts"
          icon={Facebook}
          headerBgColor="rgba(45, 107, 240, 0.04)"
        />

        <IntegrationCard
          name="Instagram"
          isConnected={!!integrations.instagram}
          description="For Run campaigns, publish posts"
          icon={Instagram}
          headerBgColor="rgba(243, 118, 79, 0.06)"
        />

        <IntegrationCard
          isConnected={!!integrations.linkedin}
          name="LinkedIn"
          description="For Publish"
          icon={Linkedin}
          headerBgColor="rgba(61, 128, 179, 0.06)"
        />

        <IntegrationCard
          isConnected={!!integrations.google}
          name="Google Ads"
          description="Google Ads Account"
          icon={GoogleAds}
          headerBgColor="rgba(255, 193, 7, 0.06)"
        />

        <IntegrationCard
          isConnected={!!integrations.google}
          name="Google Calendar"
          description="For appointments, calls, meets.."
          icon={GoogleCalender}
          headerBgColor="rgba(0, 133, 247, 0.04)"
          upcomingAppointments={upcomingAppointmentCount}
        />
      </Box>
    </Box>
  );
};

export default Integration;