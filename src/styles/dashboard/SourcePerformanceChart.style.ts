import { type SxProps, type Theme } from "@mui/material";

export const chartStyles = {
  container: {
    width: "100%",
    height: 500,
    overflowY: "auto",
    pr: 1,
    "&::-webkit-scrollbar": { width: "5px" },
    "&::-webkit-scrollbar-track": { backgroundColor: "transparent" },
    "&::-webkit-scrollbar-thumb": { backgroundColor: "#daddf0", borderRadius: "10px" },
  } as SxProps<Theme>,

  chartWrapper: {
    width: "100%",
    height: 400,
    mt: 2,
  } as SxProps<Theme>,

  tooltipContainer: {
    backgroundColor: "#fff",
    border: "1px solid #f0f0f0",
    borderRadius: "10px",
    padding: "8px 16px",
    boxShadow: "0px 4px 15px rgba(0,0,0,0.08)",
    textAlign: "center",
    position: "relative",
    "&:after": {
      content: '""',
      position: "absolute",
      bottom: "-6px",
      left: "50%",
      transform: "translateX(-50%)",
      borderWidth: "6px 6px 0 6px",
      borderStyle: "solid",
      borderColor: "#fff transparent transparent transparent",
    }
  } as SxProps<Theme>,
};