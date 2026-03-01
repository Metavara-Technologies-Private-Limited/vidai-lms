/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { Box, Menu, MenuItem, Typography } from "@mui/material";
import { EMOJI_LIST } from "./LeadsTable.types";

// ====================== Emoji Picker ======================
interface EmojiPickerProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ anchorEl, onClose, onSelect }) => (
  <Menu
    anchorEl={anchorEl}
    open={Boolean(anchorEl)}
    onClose={onClose}
    PaperProps={{
      sx: { borderRadius: "12px", p: 1, boxShadow: "0 8px 30px rgba(0,0,0,0.15)", width: 220 },
    }}
  >
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.25 }}>
      {EMOJI_LIST.map((emoji) => (
        <Box
          key={emoji}
          onClick={() => { onSelect(emoji); onClose(); }}
          sx={{
            width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px", cursor: "pointer", borderRadius: "6px",
            "&:hover": { bgcolor: "#F1F5F9" }, transition: "background 0.1s",
          }}
        >
          {emoji}
        </Box>
      ))}
    </Box>
  </Menu>
);

// ====================== Format Menu ======================
interface FormatMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onFormat: (type: string) => void;
}

export const FormatMenu: React.FC<FormatMenuProps> = ({ anchorEl, onClose, onFormat }) => (
  <Menu
    anchorEl={anchorEl}
    open={Boolean(anchorEl)}
    onClose={onClose}
    PaperProps={{ sx: { borderRadius: "10px", boxShadow: "0 8px 30px rgba(0,0,0,0.15)", minWidth: 160 } }}
  >
    {[
      { label: "Bold",          shortcut: "Ctrl+B" },
      { label: "Italic",        shortcut: "Ctrl+I" },
      { label: "Underline",     shortcut: "Ctrl+U" },
      { label: "Strikethrough", shortcut: "" },
      { label: "Bullet list",   shortcut: "" },
      { label: "Numbered list", shortcut: "" },
      { label: "Quote",         shortcut: "" },
      { label: "Code",          shortcut: "" },
    ].map(({ label, shortcut }) => (
      <MenuItem
        key={label}
        onClick={() => { onFormat(label); onClose(); }}
        sx={{ fontSize: "13px", py: 1, display: "flex", justifyContent: "space-between", gap: 2 }}
      >
        <span>{label}</span>
        {shortcut && <Typography fontSize="11px" color="text.secondary">{shortcut}</Typography>}
      </MenuItem>
    ))}
  </Menu>
);

// ====================== More Menu ======================
interface MoreMenuProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onAction: (action: string) => void;
}

export const MoreMenu: React.FC<MoreMenuProps> = ({ anchorEl, onClose, onAction }) => (
  <Menu
    anchorEl={anchorEl}
    open={Boolean(anchorEl)}
    onClose={onClose}
    PaperProps={{ sx: { borderRadius: "10px", boxShadow: "0 8px 30px rgba(0,0,0,0.15)", minWidth: 180 } }}
  >
    {["Insert signature", "Insert divider", "Insert table", "Clear formatting"].map((action) => (
      <MenuItem
        key={action}
        onClick={() => { onAction(action); onClose(); }}
        sx={{ fontSize: "13px", py: 1 }}
      >
        {action}
      </MenuItem>
    ))}
  </Menu>
);