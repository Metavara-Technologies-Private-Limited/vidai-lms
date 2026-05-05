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
import MicOutlinedIcon from "@mui/icons-material/MicOutlined";
import DialpadOutlinedIcon from "@mui/icons-material/DialpadOutlined";
import VolumeUpOutlinedIcon from "@mui/icons-material/VolumeUpOutlined";
import CallEndIcon from "@mui/icons-material/CallEnd";
import RemoveIcon from "@mui/icons-material/Remove";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";

// ⚠️ Install: npm install @twilio/voice-sdk
// Then import in your entry file or here:
// import { Device, Call } from "@twilio/voice-sdk";
// For now using dynamic import to avoid build issues if SDK not yet installed:
type TwilioDevice = any;
type TwilioCall = any;

interface Props {
  open: boolean;
  onClose: () => void;
  name: string;
  toNumber?: string;         // ✅ optional — phone number to dial e.g. "+919876543210"
  leadUuid?: string;         // ✅ optional — lead UUID for logging the call
  agentIdentity?: string;    // optional — agent identity e.g. "agent_42" (defaults to "agent")
  ringingAudioUrl?: string;
}

const API_BASE = "/api"; // adjust if your base path differs

const CallDialog: React.FC<Props> = ({
  open,
  onClose,
  name,
  toNumber = "",
  leadUuid = "",
  agentIdentity = "agent",
  ringingAudioUrl,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [minimized, setMinimized] = React.useState(false);
  const [fullScreen, setFullScreen] = React.useState(false);
  const [callState, setCallState] = React.useState<
    "idle" | "connecting" | "ringing" | "inCall" | "ended"
  >("idle");
  const [muted, setMuted] = React.useState(false);
  const [timer, setTimer] = React.useState(0);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const audioRef    = React.useRef<HTMLAudioElement | null>(null);
  const deviceRef   = React.useRef<TwilioDevice | null>(null);
  const callRef     = React.useRef<TwilioCall | null>(null);

  // ─── 1. Init Twilio Device when dialog opens ───────────────────────────────
  React.useEffect(() => {
    if (!open) return;

    // If no toNumber provided, skip Twilio and just show ringing UI (legacy mode)
    if (!toNumber) {
      setCallState("ringing");
      playRinging();
      const t = setTimeout(() => {
        stopRinging();
        setCallState("inCall");
      }, 3000);
      return () => clearTimeout(t);
    }

    let cancelled = false;

    const initDevice = async () => {
      try {
        setCallState("connecting");
        setErrorMsg(null);

        // Fetch access token from backend
        const resp = await fetch(
          `${API_BASE}/twilio/browser-call/token/?identity=${encodeURIComponent(agentIdentity)}`
        );
        if (!resp.ok) throw new Error("Failed to get call token");
        const { token } = await resp.json();

        // Dynamic import so build doesn't fail if SDK not installed yet
        const { Device } = await import("@twilio/voice-sdk" as any);

        if (cancelled) return;

        const device: TwilioDevice = new Device(token, {
          logLevel: 1,
          codecPreferences: ["opus", "pcmu"],
        });

        await device.register();
        if (cancelled) return;

        deviceRef.current = device;

        // ── 2. Make the outbound call ──────────────────────────────────────
        setCallState("ringing");
        playRinging();

        const call: TwilioCall = await device.connect({
          params: { To: toNumber },
        });

        callRef.current = call;

        call.on("accept", async (c: TwilioCall) => {
          stopRinging();
          setCallState("inCall");

          // Log call to backend once we have a real SID
          if (leadUuid) {
            try {
              await fetch(`${API_BASE}/twilio/browser-call/log/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  lead_uuid: leadUuid,
                  to_number: toNumber,
                  sid: c.parameters?.CallSid ?? "",
                  status: "initiated",
                  agent_identity: agentIdentity,
                }),
              });
            } catch (_) {
              // logging failure is non-fatal
            }
          }
        });

        call.on("disconnect", () => {
          stopRinging();
          setCallState("ended");
          setTimeout(() => {
            handleEnd();
          }, 1500);
        });

        call.on("cancel", () => {
          stopRinging();
          setCallState("ended");
          setTimeout(handleEnd, 1000);
        });

        call.on("error", (err: Error) => {
          stopRinging();
          setErrorMsg(err?.message ?? "Call error");
          setCallState("idle");
        });
      } catch (err: any) {
        if (!cancelled) {
          setErrorMsg(err?.message ?? "Could not start call");
          setCallState("idle");
        }
      }
    };

    initDevice();

    return () => {
      cancelled = true;
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Ringing audio helpers ─────────────────────────────────────────────────
  const playRinging = () => {
    const audio = new Audio(
      ringingAudioUrl ||
        "https://actions.google.com/sounds/v1/alarms/phone_alerts_and_rings.ogg"
    );
    audio.loop = true;
    audio.play().catch(() => {});
    audioRef.current = audio;
  };

  const stopRinging = () => {
    audioRef.current?.pause();
    audioRef.current = null;
  };

  // ─── Call timer ────────────────────────────────────────────────────────────
  React.useEffect(() => {
    let i: number;
    if (callState === "inCall") {
      i = window.setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(i);
  }, [callState]);

  // ─── Mute toggle ───────────────────────────────────────────────────────────
  const toggleMute = () => {
    if (!callRef.current) return;
    const next = !muted;
    callRef.current.mute(next);
    setMuted(next);
  };

  // ─── End / cleanup ─────────────────────────────────────────────────────────
  const handleEnd = () => {
    stopRinging();

    if (callRef.current) {
      try { callRef.current.disconnect(); } catch (_) {}
      callRef.current = null;
    }
    if (deviceRef.current) {
      try { deviceRef.current.destroy(); } catch (_) {}
      deviceRef.current = null;
    }

    setTimer(0);
    setMuted(false);
    setCallState("idle");
    setMinimized(false);
    setErrorMsg(null);
    onClose();
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const format = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const statusLabel = () => {
    if (errorMsg) return `Error: ${errorMsg}`;
    switch (callState) {
      case "connecting": return "Connecting...";
      case "ringing":    return "Ringing...";
      case "inCall":     return format(timer);
      case "ended":      return "Call ended";
      default:           return "";
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── MINIMIZED FOOTER BAR ─────────────────────────────────────────── */}
      {minimized && (
        <Box
          sx={{
            position: "fixed",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
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
            <Stack direction="row" spacing={2} alignItems="center" flex={1}>
              <Avatar sx={{ bgcolor: "#7C6AED" }}>{name[0]}</Avatar>
              <Box>
                <Typography fontSize={13} fontWeight={600}>
                  {name}
                </Typography>
                <Typography fontSize={11} color="#B0B0B0">
                  {statusLabel()}
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

      {/* ── MAIN DIALOG ──────────────────────────────────────────────────── */}
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
        <Box mt={callState === "inCall" ? 1 : 3}>
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
          <Typography
            color={errorMsg ? "error" : "text.secondary"}
            fontSize={13}
          >
            {statusLabel()}
          </Typography>
        </Box>

        {/* CONTROLS — only shown during active call */}
        {callState === "inCall" && (
          <Stack direction="row" justifyContent="center" spacing={3} mt={6}>
            {/* Mute toggle */}
            <IconButton
              onClick={toggleMute}
              sx={{
                width: 64,
                height: 64,
                bgcolor: muted ? "#FEE2E2" : "#F5F5F5",
                color: muted ? "#DC2626" : "#555",
              }}
            >
              {muted ? (
                <MicOffOutlinedIcon fontSize="large" />
              ) : (
                <MicOutlinedIcon fontSize="large" />
              )}
            </IconButton>

            {/* Dialpad (UI only — extend if DTMF needed) */}
            <IconButton
              sx={{ width: 64, height: 64, bgcolor: "#F5F5F5", color: "#555" }}
            >
              <DialpadOutlinedIcon fontSize="large" />
            </IconButton>

            {/* Speaker (UI only) */}
            <IconButton
              sx={{ width: 64, height: 64, bgcolor: "#EEF2FF", color: "#4F46E5" }}
            >
              <VolumeUpOutlinedIcon fontSize="large" />
            </IconButton>
          </Stack>
        )}

        {/* END CALL BUTTON */}
        <Box mt={callState === "inCall" ? 6 : 8}>
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
              0%   { box-shadow: 0 0 0 0 rgba(124,106,237,.6); }
              70%  { box-shadow: 0 0 0 18px rgba(124,106,237,0); }
              100% { box-shadow: 0 0 0 0 rgba(124,106,237,0); }
            }
          `}
        </style>
      </Dialog>
    </>
  );
};

export default CallDialog;