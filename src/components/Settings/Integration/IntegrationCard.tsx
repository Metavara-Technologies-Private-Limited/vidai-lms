import { useState, useEffect } from "react";
import { Card, Box, Typography, Button } from "@mui/material";

import ConnectedLogo from "../../../assets/icons/Connected-Logo.svg";
import NotConnectedLogo from "../../../assets/icons/Not-Connected-Logo.svg";

import type { IntegrationCardProps } from "../../../types/Settings.types";
import { styles } from "../../../styles/Settings/Integration.styles";
import { integrationApi } from "../../../services/integration.api";

const IntegrationCard = ({
  name,
  description,
  icon,
  headerBgColor,
}: IntegrationCardProps) => {
  const storageKey = `integration_${name}`;
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setConnected(localStorage.getItem(storageKey) === "true");
  }, [storageKey]);

  const handleConnect = () => {
    if (name === "LinkedIn") {
      integrationApi.connectLinkedIn();
      return;
    }

    if (name === "Facebook" || name === "Instagram") {
      integrationApi.connectFacebook();
      return;
    }

    // Demo connect for other platforms
    localStorage.setItem(storageKey, "true");
    setConnected(true);
  };

  const handleDisconnect = () => {
    localStorage.removeItem(storageKey);
    setConnected(false);
  };

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
      </Box>

      {/* Action */}
      <Box sx={styles.buttonWrapper}>
        <Button
          variant="outlined"
          sx={styles.actionButton(connected)}
          onClick={connected ? handleDisconnect : handleConnect}
          startIcon={<Box component="img" src={icon} sx={styles.buttonIcon} />}
        >
          {connected ? "Disconnect" : "Connect"}
        </Button>
      </Box>
    </Card>
  );
};

export default IntegrationCard;