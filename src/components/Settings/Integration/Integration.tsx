import { useEffect, useState } from "react";
// import { useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import { selectUser } from "../../../store/authSlice";
import {
  hasAnySubcategoryActionPermission,
  resolveUserRole,
} from "../../../utils/roleAccess";

import Facebook from "../../../assets/icons/Facebook.svg";
import Instagram from "../../../assets/icons/Instagram.svg";
import Linkedin from "../../../assets/icons/Linkedin.svg";
import GoogleAds from "../../../assets/icons/Google_Ads.svg";
import GoogleCalender from "../../../assets/icons/Google_Calender.svg";

import { styles } from "../../../styles/Settings/Integration.styles";
import IntegrationCard from "./IntegrationCard";
import { selectLeads } from "../../../store/leadSlice";
import { integrationApi } from "../../../services/integration.api";
import { selectClinic } from "../../../store/clinicSlice";

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
  const user = useSelector(selectUser);
  const selectedClinic = useSelector(selectClinic);
  const clinicId =
    selectedClinic?.id ?? Number(localStorage.getItem("clinic_id") ?? 1);
  const authUser = user as unknown as Record<string, unknown> | null;
  const role = resolveUserRole(authUser);
  const permissions = authUser?.permissions;
  const integrationAliases = ["integration", "integrations"];
  const canViewIntegration =
    role === "super_admin" ||
    role === "admin" ||
    hasAnySubcategoryActionPermission(permissions, integrationAliases, "view") ||
    hasAnySubcategoryActionPermission(permissions, integrationAliases, "print");
  const canManageIntegration =
    role === "super_admin" ||
    role === "admin" ||
    hasAnySubcategoryActionPermission(permissions, integrationAliases, "add") ||
    hasAnySubcategoryActionPermission(permissions, integrationAliases, "edit");

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
    if (!canViewIntegration) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIntegrations({});
      return;
    }

    const fetchIntegrations = async () => {
      try {
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
  }, [canViewIntegration, clinicId]);

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

      {!canViewIntegration ? (
        <Typography sx={{ color: "#B45309", mb: 2 }}>
          You do not have permission to view integrations.
        </Typography>
      ) : null}

      <Box sx={styles.gridWrapper}>
        <IntegrationCard
          name="Facebook"
          isConnected={!!integrations.facebook}
          canManage={canManageIntegration}
          description="For Run campaigns, publish posts"
          icon={Facebook}
          headerBgColor="rgba(45, 107, 240, 0.04)"
        />

        <IntegrationCard
          name="Instagram"
          isConnected={!!integrations.instagram}
          canManage={canManageIntegration}
          description="For Run campaigns, publish posts"
          icon={Instagram}
          headerBgColor="rgba(243, 118, 79, 0.06)"
        />

        <IntegrationCard
          isConnected={!!integrations.linkedin}
          canManage={canManageIntegration}
          name="LinkedIn"
          description="For Publish"
          icon={Linkedin}
          headerBgColor="rgba(61, 128, 179, 0.06)"
        />

        <IntegrationCard
          isConnected={!!integrations.google}
          canManage={canManageIntegration}
          name="Google Ads"
          description="Google Ads Account"
          icon={GoogleAds}
          headerBgColor="rgba(255, 193, 7, 0.06)"
        />

        <IntegrationCard
          isConnected={!!integrations.google}
          canManage={canManageIntegration}
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
