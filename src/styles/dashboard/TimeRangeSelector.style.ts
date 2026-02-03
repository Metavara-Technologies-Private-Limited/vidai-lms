import type { SxProps, Theme } from "@mui/material";
export const timeRangeSelectorStyles = {
  container: {
    display: "flex",
    gap: 1,
  },

  button: (active: boolean): SxProps<Theme> => ({
    textTransform: "none",
    borderRadius: "16px",
    px: 2,
    fontWeight: 500,
    backgroundColor: active ? "#FFF1EB" : "transparent",
    color: active ? "#E17e51" : "#6B7280",
    "&:hover": {
      backgroundColor: active ? "#FFF1EB" : "#F3F4F6",
    },
  }),
};
