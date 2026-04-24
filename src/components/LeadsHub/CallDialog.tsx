import * as React from "react";
import {
  Dialog,
  Box,
  Typography,
  Avatar,
  IconButton,
  Stack,
  useTheme,
  useMediaQuery,
  Slide,
} from "@mui/material";

import MicOffOutlinedIcon from "@mui/icons-material/MicOffOutlined";
import DialpadOutlinedIcon from "@mui/icons-material/DialpadOutlined";
import VolumeUpOutlinedIcon from "@mui/icons-material/VolumeUpOutlined";
import CallEndIcon from "@mui/icons-material/CallEnd";
import RemoveIcon from "@mui/icons-material/Remove";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";

interface Props {
  open: boolean;
  onClose: () => void;
  name: string;
  ringingAudioUrl?: string;
}

const CallDialog: React.FC<Props> = ({
  open,
  onClose,
  name,
  ringingAudioUrl,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [minimized, setMinimized] = React.useState(false);
  const [fullScreen, setFullScreen] = React.useState(false);
  const [callState, setCallState] = React.useState<"ringing" | "inCall">(
    "ringing",
  );
  const [timer, setTimer] = React.useState(0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Ringing
  React.useEffect(() => {
    if (open && callState === "ringing") {
      const audio = new Audio(
        ringingAudioUrl ||
          "https://actions.google.com/sounds/v1/alarms/phone_ring.ogg",
      );
      audio.loop = true;
      audio.play().catch(() => {});
      audioRef.current = audio;
    }
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [open, callState, ringingAudioUrl]);

  // Auto answer after 3 seconds
  React.useEffect(() => {
    if (open && callState === "ringing") {
      const t = setTimeout(() => {
        audioRef.current?.pause();
        setCallState("inCall");
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [open, callState]);

  // Timer
  React.useEffect(() => {
    let i: number;
    if (callState === "inCall") {
      i = window.setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(i);
  }, [callState]);

  const format = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(
      2,
      "0",
    )}`;

  const handleEnd = () => {
    audioRef.current?.pause();
    setTimer(0);
    setCallState("ringing");
    setMinimized(false);
    onClose();
  };

  return (
    <>
      {/* CENTERED FOOTER MINI BAR */}
      {minimized && (
        <Box
          sx={{
            position: "fixed",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)", // center horizontally
            zIndex: 2000,
          }}
        >
          <Box
            onClick={() => setMinimized(false)}
            sx={{
              width: 260,
              height: 64,
              borderRadius: "16px",
              bgcolor: "#2E2E2E",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              px: 2,
              gap: 1.5,
              cursor: "pointer",
              boxShadow: "0 10px 30px rgba(0,0,0,.35)",
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: "#7C6AED" }}>{name[0]}</Avatar>
              <Box>
                <Typography fontSize={13} fontWeight={600}>
                  {name}
                </Typography>
                <Typography fontSize={11} color="#B0B0B0">
                  {format(timer)}
                </Typography>
              </Box>
            </Stack>

            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleEnd();
              }}
              sx={{ color: "#fff" }}
            >
              <CallEndIcon />
            </IconButton>
          </Box>
        </Box>
      )}

      {/* MAIN DIALOG */}
      <Dialog
        open={open && !minimized}
        fullScreen={fullScreen || isMobile}
        TransitionComponent={Slide}
        onClose={handleEnd}
        PaperProps={{
          sx: {
            width: fullScreen ? "100vw" : 420,
            height: fullScreen ? "100vh" : 520,
            borderRadius: fullScreen ? 0 : "24px",
            p: 3,
            textAlign: "center",
            bgcolor: "#fff",
            boxShadow: "0 20px 60px rgba(0,0,0,.35)",
          },
        }}
      >
        {/* HEADER */}
        {callState === "inCall" && (
          <Box display="flex" justifyContent="flex-end" gap={1}>
            <IconButton size="small" onClick={() => setMinimized(true)}>
              <RemoveIcon />
            </IconButton>
            <IconButton size="small" onClick={() => setFullScreen((p) => !p)}>
              <OpenInFullIcon />
            </IconButton>
          </Box>
        )}

        {/* AVATAR */}
        <Box mt={3}>
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              mx: "auto",
              mb: 2,
              background:
                "radial-gradient(circle, rgba(124,106,237,0.25) 60%, transparent 61%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation:
                callState === "ringing" ? "pulse 1.5s infinite" : "none",
            }}
          >
            <Avatar
              sx={{
                width: 72,
                height: 72,
                bgcolor: "#F1EEFF",
                color: "#7C6AED",
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              {name[0]}
            </Avatar>
          </Box>

          <Typography fontWeight={700} fontSize={18}>
            {name}
          </Typography>
          <Typography color="text.secondary" fontSize={13}>
            {callState === "ringing" ? "Calling..." : format(timer)}
          </Typography>
        </Box>

        {/* CONTROLS */}
        {callState === "inCall" && (
          <Stack direction="row" justifyContent="center" spacing={3} mt={6}>
            {[
              MicOffOutlinedIcon,
              DialpadOutlinedIcon,
              VolumeUpOutlinedIcon,
            ].map((Icon, i) => (
              <IconButton
                key={i}
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: i === 2 ? "#EEF2FF" : "#F5F5F5",
                  color: i === 2 ? "#4F46E5" : "#555",
                }}
              >
                <Icon fontSize="large" />
              </IconButton>
            ))}
          </Stack>
        )}

        {/* END */}
        <Box mt={6}>
          <IconButton
            onClick={handleEnd}
            sx={{
              bgcolor: "#FEE2E2",
              color: "#DC2626",
              width: 72,
              height: 72,
              "&:hover": { bgcolor: "#FECACA" },
            }}
          >
            <CallEndIcon fontSize="large" />
          </IconButton>
        </Box>

        <style>
          {`
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(124,106,237,.6); }
              70% { box-shadow: 0 0 0 18px rgba(124,106,237,0); }
              100% { box-shadow: 0 0 0 0 rgba(124,106,237,0); }
            }
          `}
        </style>
      </Dialog>
    </>
  );
};

export default CallDialog;
