//import type{ SxProps, Theme } from "@mui/material";

export const kpiCardsStyles = {
  grid: {
    display: "grid",
    gridTemplateColumns: {
      xs: "1fr",
      sm: "1fr 1fr",
      md: "repeat(5, 1fr)",
    },
    gap: 2,
    mb: 2,
  },

  card: {
    p: 2,
  },

  label: {
    color: "text.secondary",
  },

  value: {
    fontWeight: 600,
  },
};
