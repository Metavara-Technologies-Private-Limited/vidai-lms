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
  Button,
  CircularProgress,
} from "@mui/material";

import MicOffOutlinedIcon from "@mui/icons-material/MicOffOutlined";
import MicOutlinedIcon from "@mui/icons-material/MicOutlined";
import DialpadOutlinedIcon from "@mui/icons-material/DialpadOutlined";
import VolumeUpOutlinedIcon from "@mui/icons-material/VolumeUpOutlined";
import CallEndIcon from "@mui/icons-material/CallEnd";
import RemoveIcon from "@mui/icons-material/Remove";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

// ⚠️ Install: npm install @twilio/voice-sdk
type TwilioDevice = any;
type TwilioCall = any;

interface Props {
  open: boolean;
  onClose: () => void;
  name: string;
  toNumber?: string;
  leadUuid?: string;
  agentIdentity?: string;
  ringingAudioUrl?: string;
}

// ── Resolve API base dynamically so it always hits the correct backend ─────
// Priority: VITE_API_BASE_URL env → same origin /api → fallback
const resolveApiBase = (): string => {
  try {
    const env = (import.meta as any).env;
    if (env?.VITE_API_BASE_URL) {
      // Strip trailing slash for consistency
      return env.VITE_API_BASE_URL.replace(/\/$/, "");
    }
  } catch (_) {}
  // Same-origin fallback
  return `${window.location.protocol}//${window.location.host}/api`;
};

const API_BASE = resolveApiBase();

// ── Auth token helper (mirrors leads.api.ts) ───────────────────────────────
const getStoredToken = (): string | null => {
  for (const key of ["auth_token", "access_token", "access", "token"]) {
    const v = localStorage.getItem(key);
    if (v) return v;
  }
  return null;
};

// ── Fetch token with auth header + detailed error ──────────────────────────
const fetchCallToken = async (identity: string): Promise<string> => {
  const url = `${API_BASE}/twilio/browser-call/token/?identity=${encodeURIComponent(identity)}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const authToken = getStoredToken();
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  let resp: Response;
  try {
    resp = await fetch(url, { headers });
  } catch (networkErr: any) {
    throw new Error(
      `Network error — could not reach server. (${networkErr?.message ?? "fetch failed"})`
    );
  }

  if (!resp.ok) {
    // Try to extract a meaningful backend error message
    let detail = "";
    try {
      const body = await resp.json();
      detail =
        body?.detail ||
        body?.message ||
        body?.error ||
        JSON.stringify(body);
    } catch (_) {
      try {
        detail = await resp.text();
      } catch (_2) {}
    }

    const hint =
      resp.status === 500
        ? "Server error — Twilio credentials may not be configured on the backend. Contact your administrator."
        : resp.status === 401 || resp.status === 403
        ? "Unauthorized — please log in again."
        : resp.status === 404
        ? "Token endpoint not found — check backend route /api/twilio/browser-call/token/"
        : detail || `HTTP ${resp.status}`;

    throw new Error(hint);
  }

  const data = await resp.json();

  if (!data?.token) {
    throw new Error(
      'Backend returned OK but no "token" field in response. Check the backend view.'
    );
  }

  return data.token as string;
};

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
    "idle" | "connecting" | "ringing" | "inCall" | "ended" | "error"
  >("idle");
  const [muted, setMuted] = React.useState(false);
  const [timer, setTimer] = React.useState(0);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const deviceRef = React.useRef<TwilioDevice | null>(null);
  const callRef = React.useRef<TwilioCall | null>(null);
  const cancelledRef = React.useRef(false);

  // ─── Ringing audio helpers ────────────────────────────────────────────────
  const playRinging = React.useCallback(() => {
    try {
      const audio = new Audio(
        ringingAudioUrl ||
          "https://actions.google.com/sounds/v1/alarms/phone_alerts_and_rings.ogg"
      );
      audio.loop = true;
      audio.play().catch(() => {});
      audioRef.current = audio;
    } catch (_) {}
  }, [ringingAudioUrl]);

  const stopRinging = React.useCallback(() => {
    try {
      audioRef.current?.pause();
    } catch (_) {}
    audioRef.current = null;
  }, []);

  // ─── Cleanup helper ───────────────────────────────────────────────────────
  const cleanup = React.useCallback(() => {
    stopRinging();
    if (callRef.current) {
      try {
        callRef.current.disconnect();
      } catch (_) {}
      callRef.current = null;
    }
    if (deviceRef.current) {
      try {
        deviceRef.current.destroy();
      } catch (_) {}
      deviceRef.current = null;
    }
  }, [stopRinging]);

  // ─── Main init effect ─────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!open) return;

    cancelledRef.current = false;
    setErrorMsg(null);
    setCallState("connecting");
    setTimer(0);
    setMuted(false);

    // ── Legacy mode: no toNumber → just show ringing UI ──────────────────
    if (!toNumber) {
      setCallState("ringing");
      playRinging();
      const t = setTimeout(() => {
        stopRinging();
        if (!cancelledRef.current) setCallState("inCall");
      }, 3000);
      return () => {
        cancelledRef.current = true;
        clearTimeout(t);
        stopRinging();
      };
    }

    // ── Real Twilio browser call ──────────────────────────────────────────
    const initDevice = async () => {
      try {
        // 1. Fetch access token (with auth header + detailed error)
        const token = await fetchCallToken(agentIdentity);
        if (cancelledRef.current) return;

        // 2. Dynamically import Twilio SDK
        let Device: any;
        try {
          const sdk = await import("@twilio/voice-sdk" as any);
          Device = sdk.Device;
        } catch (_) {
          throw new Error(
            '@twilio/voice-sdk is not installed. Run: npm install @twilio/voice-sdk'
          );
        }
        if (cancelledRef.current) return;

        // 3. Create and register device
        const device: TwilioDevice = new Device(token, {
          logLevel: 1,
          codecPreferences: ["opus", "pcmu"],
        });

        device.on("error", (err: any) => {
          if (!cancelledRef.current) {
            setErrorMsg(err?.message ?? "Twilio device error");
            setCallState("error");
            stopRinging();
          }
        });

        await device.register();
        if (cancelledRef.current) return;

        deviceRef.current = device;

        // 4. Place outbound call
        setCallState("ringing");
        playRinging();

        const call: TwilioCall = await device.connect({
          params: { To: toNumber },
        });
        callRef.current = call;

        call.on("accept", async (c: TwilioCall) => {
          stopRinging();
          if (!cancelledRef.current) setCallState("inCall");

          // Log call to backend (non-fatal)
          if (leadUuid) {
            try {
              const authToken = getStoredToken();
              await fetch(`${API_BASE}/twilio/browser-call/log/`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                },
                body: JSON.stringify({
                  lead_uuid: leadUuid,
                  to_number: toNumber,
                  sid: c.parameters?.CallSid ?? "",
                  status: "initiated",
                  agent_identity: agentIdentity,
                }),
              });
            } catch (_) {}
          }
        });

        call.on("disconnect", () => {
          stopRinging();
          if (!cancelledRef.current) {
            setCallState("ended");
            setTimeout(() => {
              if (!cancelledRef.current) handleEnd();
            }, 1500);
          }
        });

        call.on("cancel", () => {
          stopRinging();
          if (!cancelledRef.current) {
            setCallState("ended");
            setTimeout(() => {
              if (!cancelledRef.current) handleEnd();
            }, 1000);
          }
        });

        call.on("error", (err: Error) => {
          stopRinging();
          if (!cancelledRef.current) {
            setErrorMsg(err?.message ?? "Call error");
            setCallState("error");
          }
        });
      } catch (err: any) {
        if (!cancelledRef.current) {
          setErrorMsg(err?.message ?? "Could not start call");
          setCallState("error");
          stopRinging();
        }
      }
    };

    initDevice();

    return () => {
      cancelledRef.current = true;
      cleanup();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, retryCount]);

  // ─── Call timer ───────────────────────────────────────────────────────────
  React.useEffect(() => {
    let interval: number;
    if (callState === "inCall") {
      interval = window.setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  // ─── Mute toggle ──────────────────────────────────────────────────────────
  const toggleMute = () => {
    if (!callRef.current) return;
    const next = !muted;
    callRef.current.mute(next);
    setMuted(next);
  };

  // ─── End / cleanup ────────────────────────────────────────────────────────
  const handleEnd = React.useCallback(() => {
    cancelledRef.current = true;
    cleanup();
    setTimer(0);
    setMuted(false);
    setCallState("idle");
    setMinimized(false);
    setErrorMsg(null);
    onClose();
  }, [cleanup, onClose]);

  // ─── Retry ────────────────────────────────────────────────────────────────
  const handleRetry = () => {
    cancelledRef.current = false;
    setErrorMsg(null);
    setCallState("connecting");
    setRetryCount((c) => c + 1);
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const format = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const statusLabel = (): string => {
    switch (callState) {
      case "connecting": return "Connecting...";
      case "ringing":    return "Ringing...";
      case "inCall":     return format(timer);
      case "ended":      return "Call ended";
      case "error":      return "Call failed";
      default:           return "";
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── MINIMIZED FOOTER BAR ──────────────────────────────────────────── */}
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
              <Avatar sx={{ bgcolor: "#7C6AED" }}>{name?.[0] ?? "?"}</Avatar>
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

      {/* ── MAIN DIALOG ───────────────────────────────────────────────────── */}
      <Dialog
        open={open && !minimized}
        fullScreen={fullScreen || isMobile}
        TransitionComponent={Slide}
        onClose={handleEnd}
        PaperProps={{
          sx: {
            width: fullScreen ? "100vw" : 420,
            minHeight: fullScreen ? "100vh" : 520,
            borderRadius: fullScreen ? 0 : "24px",
            p: 3,
            textAlign: "center",
            bgcolor: "#fff",
            boxShadow: "0 20px 60px rgba(0,0,0,.35)",
            overflow: "hidden",
          },
        }}
      >
        {/* HEADER CONTROLS */}
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

        {/* AVATAR + PULSE */}
        <Box mt={callState === "inCall" ? 1 : 3}>
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              mx: "auto",
              mb: 2,
              background:
                callState === "error"
                  ? "radial-gradient(circle, rgba(220,38,38,0.15) 60%, transparent 61%)"
                  : "radial-gradient(circle, rgba(124,106,237,0.25) 60%, transparent 61%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation:
                callState === "ringing" ? "pulse 1.5s infinite" : "none",
            }}
          >
            {callState === "connecting" ? (
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  bgcolor: "#F1EEFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CircularProgress size={32} sx={{ color: "#7C6AED" }} />
              </Box>
            ) : callState === "error" ? (
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  bgcolor: "#FEF2F2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <WarningAmberRoundedIcon
                  sx={{ color: "#DC2626", fontSize: 36 }}
                />
              </Box>
            ) : (
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
                {name?.[0] ?? "?"}
              </Avatar>
            )}
          </Box>

          <Typography fontWeight={700} fontSize={18} mb={0.5}>
            {name}
          </Typography>

          {/* Status label */}
          <Typography
            color={callState === "error" ? "error.main" : "text.secondary"}
            fontSize={13}
            fontWeight={callState === "error" ? 600 : 400}
          >
            {statusLabel()}
          </Typography>

          {/* Detailed error message box */}
          {callState === "error" && errorMsg && (
            <Box
              sx={{
                mt: 2,
                mx: "auto",
                maxWidth: 340,
                p: 2,
                bgcolor: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "12px",
                textAlign: "left",
              }}
            >
              <Typography fontSize={12} color="error.main" lineHeight={1.6}>
                {errorMsg}
              </Typography>
            </Box>
          )}

          {/* Retry button on error */}
          {callState === "error" && (
            <Button
              onClick={handleRetry}
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              sx={{
                mt: 2,
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "10px",
                borderColor: "#7C6AED",
                color: "#7C6AED",
                "&:hover": { bgcolor: "#F1EEFF", borderColor: "#5B4ACD" },
              }}
            >
              Retry
            </Button>
          )}
        </Box>

        {/* CALL CONTROLS — active call only */}
        {callState === "inCall" && (
          <Stack direction="row" justifyContent="center" spacing={3} mt={6}>
            <IconButton
              onClick={toggleMute}
              sx={{
                width: 64,
                height: 64,
                bgcolor: muted ? "#FEE2E2" : "#F5F5F5",
                color: muted ? "#DC2626" : "#555",
                transition: "all .2s",
              }}
            >
              {muted ? (
                <MicOffOutlinedIcon fontSize="large" />
              ) : (
                <MicOutlinedIcon fontSize="large" />
              )}
            </IconButton>

            <IconButton
              sx={{ width: 64, height: 64, bgcolor: "#F5F5F5", color: "#555" }}
            >
              <DialpadOutlinedIcon fontSize="large" />
            </IconButton>

            <IconButton
              sx={{ width: 64, height: 64, bgcolor: "#EEF2FF", color: "#4F46E5" }}
            >
              <VolumeUpOutlinedIcon fontSize="large" />
            </IconButton>
          </Stack>
        )}

        {/* END CALL BUTTON */}
        <Box mt={callState === "inCall" ? 6 : callState === "error" ? 3 : 8}>
          <IconButton
            onClick={handleEnd}
            sx={{
              bgcolor: "#FEE2E2",
              color: "#DC2626",
              width: 72,
              height: 72,
              "&:hover": { bgcolor: "#FECACA" },
              transition: "all .2s",
            }}
          >
            <CallEndIcon fontSize="large" />
          </IconButton>
          {callState === "error" && (
            <Typography
              variant="caption"
              display="block"
              mt={1}
              color="text.secondary"
            >
              Close
            </Typography>
          )}
        </Box>

        <style>{`
          @keyframes pulse {
            0%   { box-shadow: 0 0 0 0 rgba(124,106,237,.6); }
            70%  { box-shadow: 0 0 0 18px rgba(124,106,237,0); }
            100% { box-shadow: 0 0 0 0 rgba(124,106,237,0); }
          }
        `}</style>
      </Dialog>
    </>
  );
};

export default CallDialog;