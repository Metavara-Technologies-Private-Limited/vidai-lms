// styles/dashboard/SourcePerformanceChart.style.ts

export const chartStyles = {
  container: {
    p: 2,
    bgcolor: "#fff",
    borderRadius: 2,
    height: "100%",
  },

  chartWrapper: {
    width: "100%",
    height: 260,
  },

  tooltipContainer: {
    bgcolor: "#fff",
    borderRadius: 1.5,
    px: 1.5,
    py: 1,
    boxShadow: "0px 4px 12px rgba(0,0,0,0.12)",
  },

  legendDot: (color: string) => ({
    width: 10,
    height: 10,
    borderRadius: "50%",
    bgcolor: color,
  }),

  radioHot: {
    color: "#E57373",
    "&.Mui-checked": {
      color: "#E57373",
    },
  },

  axisTick: {
    fontSize: 11,
    fill: "#666",
  },

};
