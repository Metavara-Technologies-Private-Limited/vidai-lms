export const timeRangeSelectorStyles = {
  container: {
    display: "flex",
    gap: "4px",
    padding: "8px",
    backgroundColor: "#FAFAFA",
    borderRadius: "20 !important",
    overflow: "hidden",
  },

  button: (active: boolean) => ({
    textTransform: "none",
    minHeight: "26px",
    borderRadius:"10 !important",
    padding: "4px 12px",
    fontSize: "13px",
    fontWeight: 600,

    backgroundColor: active ? "#FFFFFF" : "transparent",
    color: active ? "#E17E61" : "#6B7280",

    boxShadow: active ? "0 1px 4px rgba(0,0,0,0.06)" : "none",

    "&:hover": {
      backgroundColor: active ? "#FFFFFF" : "transparent",
    },
  }),
};
