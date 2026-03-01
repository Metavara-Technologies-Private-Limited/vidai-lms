import * as React from "react";
import {
  Box,
  Stack,
  Typography,
  Avatar,
  IconButton,
} from "@mui/material";
import ShortcutIcon from "@mui/icons-material/Shortcut";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";

import Facebook from "../../assets/icons/Facebook.svg";
import Instagram from "../../assets/icons/Instagram.svg";
import Linkedin from "../../assets/icons/Linkedin.svg";
import GoogleAds from "../../assets/icons/Google_Ads.svg";
import GoogleCalender from "../../assets/icons/Google_Calender.svg";

import { getDocColor } from "./LeadDetailHelpers";
import type {
  CallMessageProps,
  TimelineItemProps,
  ChatBubbleProps,
  InfoProps,
  DocumentRowProps,
} from "./LeadDetailTypes";

// ====================== CallMessage ======================
export const CallMessage: React.FC<CallMessageProps> = ({ speaker, time, text }) => (
  <Box>
    <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
      <Typography variant="caption" fontWeight={700} color="text.primary">
        {speaker}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {time}
      </Typography>
    </Stack>
    <Typography variant="body2" color="text.secondary">
      {text}
    </Typography>
  </Box>
);

// ====================== TimelineItem ======================
export const TimelineItem: React.FC<TimelineItemProps> = ({
  icon,
  title,
  time,
  isAvatar,
  avatarInitial,
  isLast,
  onClick,
  isClickable,
}) => (
  <Stack direction="row" spacing={2}>
    <Stack alignItems="center">
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          bgcolor: "#F1F5F9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isAvatar ? (
          <Avatar sx={{ width: 20, height: 20, fontSize: "10px" }}>{avatarInitial}</Avatar>
        ) : (
          icon
        )}
      </Box>
      {!isLast && (
        <Box sx={{ width: "2px", flexGrow: 1, bgcolor: "#E2E8F0", my: 0.5 }} />
      )}
    </Stack>
    <Box
      pb={3}
      onClick={onClick}
      sx={{
        cursor: isClickable ? "pointer" : "default",
        "&:hover": isClickable ? { opacity: 0.7 } : {},
      }}
    >
      <Typography variant="body2" fontWeight={600}>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {time}
      </Typography>
    </Box>
  </Stack>
);

// ====================== ChatBubble ======================
export const ChatBubble: React.FC<ChatBubbleProps> = ({ side, text, time }) => (
  <Box sx={{ alignSelf: side === "left" ? "flex-start" : "flex-end", maxWidth: "70%" }}>
    <Box
      sx={{
        p: 1.5,
        borderRadius:
          side === "left" ? "0 12px 12px 12px" : "12px 0 12px 12px",
        bgcolor: side === "left" ? "#FFF" : "#1E293B",
        color: side === "left" ? "text.primary" : "#FFF",
        boxShadow: "0px 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <Typography variant="body2">{text}</Typography>
    </Box>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{
        mt: 0.5,
        display: "block",
        textAlign: side === "right" ? "right" : "left",
      }}
    >
      {time}
    </Typography>
  </Box>
);

// ====================== Sub-source Icon ======================
const getSubSourceIcon = (source?: string): string | null => {
  const key = (source || "").toLowerCase();
  if (key.includes("facebook")) return Facebook as string;
  if (key.includes("instagram")) return Instagram as string;
  if (key.includes("linkedin")) return Linkedin as string;
  if (key.includes("google ads")) return GoogleAds as string;
  if (key.includes("google")) return GoogleCalender as string;
  return null;
};

// ====================== Info ======================
export const Info: React.FC<InfoProps> = ({ label, value, isAvatar }) => (
  <Box sx={{ flex: 1, minWidth: 0 }}>
    <Typography
      variant="caption"
      sx={{
        color: "#9E9E9E",
        fontSize: "12px",
        fontWeight: 500,
        display: "block",
        mb: 0.5,
      }}
    >
      {label}
    </Typography>
    {label === "SUB-SOURCE" ? (
      <Stack direction="row" spacing={1} alignItems="center">
        {getSubSourceIcon(value) && (
          <Box
            component="img"
            src={getSubSourceIcon(value)!}
            alt=""
            sx={{ width: 16, height: 16 }}
          />
        )}
        <Typography sx={{ color: "#232323", fontSize: "14px", fontWeight: 500 }}>
          {value}
        </Typography>
      </Stack>
    ) : isAvatar ? (
      <Stack direction="row" spacing={1} alignItems="center">
        <Avatar sx={{ width: 20, height: 20, fontSize: "10px" }}>
          {value?.charAt(0) || "U"}
        </Avatar>
        <Typography sx={{ color: "#232323", fontSize: "14px", fontWeight: 500 }}>
          {value}
        </Typography>
      </Stack>
    ) : (
      <Typography sx={{ color: "#232323", fontSize: "14px", fontWeight: 500 }}>
        {value}
      </Typography>
    )}
  </Box>
);

// ====================== DocumentRow ======================
export const DocumentRow: React.FC<DocumentRowProps> = ({
  name,
  size,
  url,
  sx = {},
}) => {
  const color = getDocColor(name);
  const ext = (name.split(".").pop() ?? "").toUpperCase();

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={sx}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "8px",
            bgcolor: `${color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <DescriptionOutlinedIcon sx={{ color, fontSize: 18 }} />
        </Box>
        <Box>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              maxWidth: 160,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={name}
          >
            {name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {ext}
            {size ? ` · ${size}` : ""}
          </Typography>
        </Box>
      </Stack>
      <Stack direction="row" spacing={0.5}>
        <IconButton
          size="small"
          onClick={handleDownload}
          disabled={!url}
          title="Download"
        >
          <FileDownloadOutlinedIcon fontSize="inherit" />
        </IconButton>
        <IconButton
          size="small"
          onClick={handleOpen}
          disabled={!url}
          title="Open in new tab"
        >
          <ShortcutIcon sx={{ transform: "rotate(90deg)", fontSize: "14px" }} />
        </IconButton>
      </Stack>
    </Stack>
  );
};