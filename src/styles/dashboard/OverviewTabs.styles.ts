import type { SxProps, Theme } from "@mui/material";

export const overviewTabsStyles = {
  container: {
    display: "flex",
    gap: 1,
    flexWrap: "wrap",
  },

  tabButton: (active: boolean): SxProps<Theme> => ({
    textTransform: "none",
    px: 1,
    fontWeight: 600,
    fontSize: 11,
    backgroundColor: active ? "#FFF8F6" : "#fafafa",
    color: active ? "#E17E61" : "#9e9e9e",
    border: active ? "1px solid" : "none",
    borderRadius: "10px",
    borderColor: active ? "#F6D4CA" : "#none",
    "&:hover": {
      backgroundColor: "#FFEFE8",
    },
  }),
};
