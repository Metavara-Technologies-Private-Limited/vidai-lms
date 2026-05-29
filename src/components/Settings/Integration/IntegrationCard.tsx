import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import CloseIcon from "@mui/icons-material/Close";
import { Card, Box, Typography, Button, Chip, IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";

import ConnectedLogo from "../../../assets/icons/Connected-Logo.svg";
import NotConnectedLogo from "../../../assets/icons/Not-Connected-Logo.svg";

import type { IntegrationCardProps } from "../../../types/Settings.types";
import { styles } from "../../../styles/Settings/Integration.styles";
import { integrationApi } from "../../../services/integration.api";
import { selectClinic } from "../../../store/clinicSlice";
import { useSelector } from "react-redux";

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
  const connected = isConnected;
  const navigate = useNavigate();
  const selectedClinic = useSelector(selectClinic);
  const clinicId =
    selectedClinic?.id ?? Number(localStorage.getItem("clinic_id") ?? 1);
  const [googleAdsDialogOpen, setGoogleAdsDialogOpen] = useState(false);
  const [googleCustomerId, setGoogleCustomerId] = useState("");

  const handleConnect = () => {
    if (!canManage) return;

    if (name === "LinkedIn") {
      integrationApi.connectLinkedIn(clinicId);
      return;
    }

    if (name === "Facebook" || name === "Instagram") {
      integrationApi.connectFacebook(clinicId);
      return;
    }

    if (name === "Google Ads") {
      setGoogleCustomerId("");
      setGoogleAdsDialogOpen(true);
      return;
    }

    if (name === "Google Calendar") {
      integrationApi.connectGoogle(clinicId);
      return;
    }
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

  const handleGoogleAdsConfirm = () => {
    const cleanId = googleCustomerId.replace(/[-\s]/g, "");
    if (!cleanId) return;
    integrationApi.connectGoogle(clinicId, cleanId);
    setGoogleAdsDialogOpen(false);
    setGoogleCustomerId("");
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
          title={
            !canManage ? "No permission to manage integrations" : undefined
          }
        >
          {connected ? "Disconnect" : "Connect"}
        </Button>
      </Box>

      <Dialog
        open={googleAdsDialogOpen}
        onClose={() => setGoogleAdsDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: 700,
            fontSize: "1rem",
            pb: 1,
          }}
        >
          Connect Google Ads
          <IconButton
            size="small"
            onClick={() => setGoogleAdsDialogOpen(false)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1, display: "block" }}
          >
            Enter your Google Ads Customer ID (numbers only, no dashes)
          </Typography>
          <TextField
            autoFocus
            fullWidth
            size="small"
            value={googleCustomerId}
            onChange={(e) => setGoogleCustomerId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleGoogleAdsConfirm();
            }}
            placeholder="9696553396"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
          <Box
            sx={{
              mt: 1.5,
              p: 1.25,
              bgcolor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: 11, color: "#94A3B8", mb: 0.25 }}>
                Example ID
              </Typography>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#1E293B",
                  letterSpacing: "0.5px",
                  fontFamily: "monospace",
                }}
              >
                9696553396
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setGoogleCustomerId("9696553396");
              }}
              sx={{
                fontSize: 11,
                borderRadius: 1.5,
                borderColor: "#CBD5E1",
                color: "#475569",
                textTransform: "none",
                minWidth: "auto",
                px: 1.5,
                "&:hover": { bgcolor: "#F1F5F9", borderColor: "#94A3B8" },
              }}
            >
              Use example
            </Button>
          </Box>
          <Typography sx={{ fontSize: 11, color: "#94A3B8", mt: 1 }}>
            Find your Customer ID in Google Ads → top-right corner, shown as
            XXX-XXX-XXXX
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setGoogleAdsDialogOpen(false)}
            sx={{
              flex: 1,
              borderRadius: 1,
              color: "#232323",
              borderColor: "#232323",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleGoogleAdsConfirm}
            disabled={!googleCustomerId.trim()}
            sx={{
              flex: 1,
              borderRadius: 1,
              bgcolor: "#1F2937",
              "&:hover": { bgcolor: "#111827" },
              "&.Mui-disabled": { bgcolor: "#E5E7EB", color: "#9CA3AF" },
            }}
          >
            Connect
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default IntegrationCard;
