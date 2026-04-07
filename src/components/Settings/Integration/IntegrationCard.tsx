// import { useState, useEffect } from "react";
import { Card, Box, Typography, Button, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";

import ConnectedLogo from "../../../assets/icons/Connected-Logo.svg";
import NotConnectedLogo from "../../../assets/icons/Not-Connected-Logo.svg";

import type { IntegrationCardProps } from "../../../types/Settings.types";
import { styles } from "../../../styles/Settings/Integration.styles";
import { integrationApi } from "../../../services/integration.api";

// Extend the existing IntegrationCardProps type inline
// (if you prefer, add upcomingAppointments?: number to Settings.types.ts instead)
type ExtendedIntegrationCardProps = IntegrationCardProps & {
  isConnected?: boolean;
  upcomingAppointments?: number;
  canManage?: boolean;
};

const IntegrationCard = ({
  name,
  description,
  icon,
  headerBgColor,
  isConnected = false,
  upcomingAppointments,
  canManage = true,
}: ExtendedIntegrationCardProps) => {
  // const storageKey = `integration_${name}`;
  // const [connected, setConnected] = useState(false);
  const connected = isConnected;
  const navigate = useNavigate();

  // useEffect(() => {
  //   setConnected(localStorage.getItem(storageKey) === "true");
  // }, [storageKey]);

  const handleConnect = () => {
    if (!canManage) return;
    if (name === "LinkedIn") {
      integrationApi.connectLinkedIn();
      return;
    }

    if (name === "Facebook" || name === "Instagram") {
      integrationApi.connectFacebook();
      return;
    }
    if (name === "Google Calendar" || name === "Google Ads") {
      integrationApi.connectGoogle();
      return;
    }

    // Google Calendar and Google Ads — localStorage demo connect.
    // No backend OAuth endpoint exists yet.
    // When backend is ready, add connectGoogleCalendar() to integrationApi
    // and call it here instead.
    // localStorage.setItem(storageKey, "true");
    // setConnected(true);
  };

  const handleDisconnect = async () => {
    if (!canManage) return;
    try {
      if (name === "LinkedIn") {
        await integrationApi.disconnectLinkedIn();
      }

      if (name === "Facebook" || name === "Instagram") {
        await integrationApi.disconnectFacebook();
      }

      if (name === "Google Calendar" || name === "Google Ads") {
        console.log("Google disconnect not implemented");
        return;
      }

      window.location.reload();
    } catch (err) {
      console.error("Disconnect failed", err);
    }
  };

  const isGoogleCalendar = name === "Google Calendar";

  return (
    <Card sx={styles.card}>
      {/* Header */}
      <Box sx={styles.header(headerBgColor)}>
        <Box component="img" src={icon} alt={name} sx={styles.headerIcon} />
        <Box>
          <Typography sx={styles.headerTitle}>{name}</Typography>
          <Typography sx={styles.headerDescription}>{description}</Typography>
        </Box>
      </Box>

      {/* Status */}
      <Box sx={styles.statusWrapper}>
        <Box sx={styles.statusIconWrapper}>
          <Box
            component="img"
            src={connected ? ConnectedLogo : NotConnectedLogo}
            alt="status"
            sx={styles.statusIcon}
          />
        </Box>

        <Typography sx={styles.statusTitle}>
          {connected ? "Connected" : "Not Connected"}
        </Typography>

        <Typography sx={styles.statusDescription}>
          {connected
            ? `Awesome!! your ${name} account is all setup and connected.`
            : `Connect Your ${name} account to get Started.`}
        </Typography>

        {/* Google Calendar connected — show upcoming appointment count */}
        {isGoogleCalendar && connected && (
          <Box
            sx={{
              mt: 1.5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Chip
              icon={
                <CalendarMonthOutlinedIcon
                  sx={{ fontSize: "16px !important" }}
                />
              }
              label={
                upcomingAppointments === 0
                  ? "No upcoming appointments"
                  : `${upcomingAppointments} upcoming appointment${
                      upcomingAppointments !== 1 ? "s" : ""
                    }`
              }
              size="small"
              sx={{
                bgcolor: upcomingAppointments === 0 ? "#F1F5F9" : "#EDE9FE",
                color: upcomingAppointments === 0 ? "#64748B" : "#6D28D9",
                fontWeight: 600,
                fontSize: "12px",
                px: 0.5,
              }}
            />
            <Typography
              sx={{
                fontSize: "11px",
                color: "#94A3B8",
                cursor: "pointer",
                textDecoration: "underline",
                "&:hover": { color: "#475569" },
              }}
              onClick={() => navigate("/leads?tab=calendar")}
            >
              View in Leads Calendar
            </Typography>
          </Box>
        )}
      </Box>

      {/* Action */}
      <Box sx={styles.buttonWrapper}>
        <Button
          variant="outlined"
          sx={styles.actionButton(connected)}
          onClick={connected ? handleDisconnect : handleConnect}
          disabled={!canManage}
          startIcon={<Box component="img" src={icon} sx={styles.buttonIcon} />}
          title={!canManage ? "No permission to manage integrations" : undefined}
        >
          {connected ? "Disconnect" : "Connect"}
        </Button>
      </Box>
    </Card>
  );
};

export default IntegrationCard;