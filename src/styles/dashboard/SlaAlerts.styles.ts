import type { SxProps, Theme } from "@mui/material";

export const slaAlertsStyles = {
  alertItem: {
    display: "flex",
    gap: 1.5,
    mb: 1.5,
  },

  avatar: (severity: string): SxProps<Theme> => ({
    bgcolor: severity === "high" ? "#FFECEC" : "#FFF7E6",
    color: severity === "high" ? "#FF4D4F" : "#FAAD14",
    width: 36,
    height: 36,
    fontSize: 18,
  }),

  sectionLabel: {
    display: "block",
    mt: 2,
  },
};
