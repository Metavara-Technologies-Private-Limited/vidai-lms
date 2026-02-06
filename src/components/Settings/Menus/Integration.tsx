import { useState } from "react";
import { Card, Box, Typography, Button } from "@mui/material";

import Facebook from "../../../assets/icons/Facebook.svg";
import Instagram from "../../../assets/icons/Instagram.svg";
import Linkedin from "../../../assets/icons/Linkedin.svg";
import GoogleAds from "../../../assets/icons/Google_Ads.svg";
import GoogleCalender from "../../../assets/icons/Google_Calender.svg";

import ConnectedLogo from "../../../assets/icons/Connected-Logo.svg";
import NotConnectedLogo from "../../../assets/icons/Not-Connected-Logo.svg";

import type{ IntegrationCardProps } from "../../../types/Integration.types";
import { styles } from "../../../styles/Settings/Integration.styles";

/* ------------------------------------------------------------------ */
/* Reusable Integration Card */
/* ------------------------------------------------------------------ */
const IntegrationCard = ({
  name,
  description,
  icon,
  headerBgColor,
}: IntegrationCardProps) => {
  const [connected, setConnected] = useState(false);

  return (
    <Card sx={styles.card}>
      {/* Header */}
      <Box sx={styles.header(headerBgColor)}>
        <Box component="img" src={icon} alt={name} sx={styles.headerIcon} />
        <Box>
          <Typography sx={styles.headerTitle}>{name}</Typography>
          <Typography sx={styles.headerDescription}>
            {description}
          </Typography>
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
          onClick={() => setConnected(!connected)}
          startIcon={
            <Box component="img" src={icon} sx={styles.buttonIcon} />
          }
        >
          {connected ? "Disconnect" : "Connect"}
        </Button>
      </Box>
    </Card>
  );
};

/* ------------------------------------------------------------------ */
/* Integration Page */
/* ------------------------------------------------------------------ */
const Integration = () => {
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
