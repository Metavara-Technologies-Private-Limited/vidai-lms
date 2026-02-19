import { useState } from "react";
import {
  Box,
  Paper,
  Stack,
  TextField,
  Typography,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogContent,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CloseIcon from "@mui/icons-material/Close";

type ChatMessage = {
  text?: string;
  sender?: "me" | "system";
  date?: string;
};

export default function LeadsConversation() {
  const [activeChat, setActiveChat] = useState(1);

  // ================= CHAT STATE =================
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { date: "SUN, 4 JAN" },
    {
      text: "Hello, We’re following up on your recent enquiry with our clinic. We wanted to check if you had a chance to review the information shared earlier.",
      sender: "system",
    },
    {
      text: "This is a gentle reminder regarding your enquiry with our fertility team. We’re available whenever you’re ready.",
      sender: "system",
    },
  ]);

  // ================= MENU =================
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  // ================= GROUP NAME EDIT =================
  const [editOpen, setEditOpen] = useState(false);
  const [groupNames, setGroupNames] = useState<string[]>([
    "Untitled 6 - 09/01 (5)",
    "Untitled 5 - 08/01 (7)",
    "New Leads from Facebook",
    "Untitled 4 - 07/01 (3)",
    "Untitled 3 - 05/01 (6)",
    "Untitled 2 - 03/01 (4)",
    "Untitled1 - 02/01 (5)",
  ]);
  const [groupName, setGroupName] = useState(groupNames[0]);

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages((prev) => [...prev, { text: message, sender: "me" }]);
    setMessage("");
  };

  const handleSaveName = () => {
    const updated = [...groupNames];
    updated[activeChat - 1] = groupName;
    setGroupNames(updated);
    setEditOpen(false);
  };

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        height: "78vh",
        background: "#f8f9fd",
        p: 2,
      }}
    >
      {/* ================= LEFT SIDEBAR ================= */}
      <Paper
        sx={{
          width: 360,
          p: 2,
          borderRadius: "20px",
          border: "1px solid #f1f1f1",
        }}
      >
        <Typography fontWeight={700} mb={2}>
          All Broadcasts (7)
        </Typography>

        {/* SEARCH + SORT */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          {/* Search input */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search by group name"
            sx={{
              background: "#fff",
              "& .MuiOutlinedInput-root": {
                borderRadius: "14px",
                height: 44,
              },
              "& fieldset": { borderColor: "#e5e7eb" },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#9aa0b4", fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Sort / Filter button */}
          <IconButton
            sx={{
              width: 44,
              height: 44,
              borderRadius: "14px",
              border: "1px solid #e5e7eb",
              background: "#fff",
            }}
          >
            <Box
              component="span"
              sx={{
                fontSize: 18,
                fontWeight: 600,
                color: "#6b7280",
              }}
            >
              ⇅
            </Box>
          </IconButton>
        </Box>

        {groupNames.map((name, i) => {
          const active = i + 1 === activeChat;

          return (
            <Box
              key={i}
              onClick={() => {
                setActiveChat(i + 1);
                setGroupName(groupNames[i]);
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                mb: 1,
                borderRadius: "14px",
                border: active ? "1px solid #ff9c6b" : "1px solid transparent",
                boxShadow: active ? "0 4px 12px rgba(255,140,90,0.25)" : "none",
                cursor: "pointer",
                background: "#fff",
              }}
            >
              <Avatar
                sx={{
                  width: 42,
                  height: 42,
                  fontSize: 14,
                  fontWeight: 700,
                  bgcolor: active ? "#7b61ff" : "#ede9fe",
                  color: active ? "#fff" : "#7b61ff",
                }}
              >
                {name.startsWith("New") ? "NL" : "UN"}
              </Avatar>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  minWidth: 0,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontSize={13} fontWeight={600} noWrap>
                    {name}
                  </Typography>
                  <Typography fontSize={12} color="#8b8fa3" noWrap>
                    Hello, We’re following up on your rece...
                  </Typography>
                </Box>

                {active && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAnchorEl(e.currentTarget);
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>
          );
        })}
      </Paper>

      {/* ================= RIGHT CHAT ================= */}
      <Paper
        sx={{
          flex: 1,
          borderRadius: "20px",
          border: "1px solid #eee",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ p: 2, borderBottom: "1px solid #f4f5f9" }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: "#7b61ff" }}>UN</Avatar>
            <Box>
              <Typography fontWeight={600}>
                {groupNames[activeChat - 1]}
              </Typography>
              <Typography fontSize={12} color="#8b8fa3">
                John Smith, Alex Johnson, Emily Carter
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box sx={{ flex: 1, p: 2, overflowY: "auto" }}>
          {messages.map((msg, i) =>
            msg.date ? (
              <Typography
                key={i}
                sx={{
                  textAlign: "center",
                  color: "#9aa0b4",
                  fontSize: 12,
                  my: 2,
                }}
              >
                {msg.date}
              </Typography>
            ) : (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  justifyContent:
                    msg.sender === "me" ? "flex-end" : "flex-start",
                  mb: 1.5,
                }}
              >
                <Box
                  sx={{
                    background: msg.sender === "me" ? "#2f2f2f" : "#f5f3ff",
                    color: msg.sender === "me" ? "#fff" : "#2b2b2b",
                    px: 2,
                    py: 1.2,
                    borderRadius:
                      msg.sender === "me"
                        ? "14px 14px 4px 14px"
                        : "14px 14px 14px 4px",
                    maxWidth: "70%",
                    fontSize: 14,
                  }}
                >
                  {msg.text}
                </Box>
              </Box>
            ),
          )}
        </Box>

        {/* INPUT + PLUS + SEND */}
        {/* Input */}
        <Box sx={{ p: 2, borderTop: "1px solid #f1f2f6" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              background: "#f6f7fb",
              borderRadius: "18px",
              px: 2,
              gap: 1,
            }}
          >
            {/* TEXT INPUT */}
            <TextField
              fullWidth
              placeholder="Write message here..."
              variant="standard"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              InputProps={{ disableUnderline: true }}
            />

            {/* ICON GROUP – SIDE BY SIDE */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {/* PLUS ICON */}
              <IconButton sx={{ background: "#eef0f5" }}>
                <Box component="span" sx={{ fontSize: 26, fontWeight: 600 }}>
                  +
                </Box>
              </IconButton>

              {/* SEND ICON */}
              <IconButton
                onClick={handleSend}
                sx={{
                  background: "#2f2f2f",
                  color: "#fff",
                }}
              >
                <SendRoundedIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setEditOpen(true)}>✏️ Edit</MenuItem>
        <MenuItem sx={{ color: "#ff4d4f" }}>🗑 Delete</MenuItem>
      </Menu>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogContent sx={{ p: 4, width: 420 }}>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography fontWeight={700}>Edit Group name</Typography>
            <IconButton onClick={() => setEditOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <TextField
            fullWidth
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <Box display="flex" gap={2} mt={3}>
            <Box
              onClick={() => setEditOpen(false)}
              sx={{
                flex: 1,
                p: 1.5,
                textAlign: "center",
                border: "1px solid #ddd",
                borderRadius: "14px",
                cursor: "pointer",
              }}
            >
              Cancel
            </Box>
            <Box
              onClick={handleSaveName}
              sx={{
                flex: 1,
                p: 1.5,
                textAlign: "center",
                background: "#2f2f2f",
                color: "#fff",
                borderRadius: "14px",
                cursor: "pointer",
              }}
            >
              Save
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
