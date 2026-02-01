import { createTheme } from "@mui/material/styles";
import type {} from "@mui/x-date-pickers/themeAugmentation";
const theme = createTheme({
  palette: {
    primary: {
      main: "#D86650",
      light: "#5eead4",
      dark: "#0d9488",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#ea580c",
      light: "#fb923c",
      dark: "#c2410c",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
    },
    info: {
      main: "#3b82f6",
      light: "#60a5fa",
      dark: "#2563eb",
    },
    background: {
      default: "#F0F0F0",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#232323",
      secondary: "#9E9E9E",
    },
    grey: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
    },
  },
  typography: {
    fontFamily:
      "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",

    h1: {
      fontSize: "4rem",
      lineHeight: 1.45,
      fontWeight: 700,
    },
    h2: {
      fontSize: "3rem",
      lineHeight: 1.45,
      fontWeight: 700,
    },
    h3: {
      fontSize: "2.5rem",
      lineHeight: 1.45,
      fontWeight: 700,
    },
    h4: {
      fontSize: "2rem",
      lineHeight: 1.45,
      fontWeight: 700,
    },
    h5: {
      fontSize: "1.5rem",
      lineHeight: 1.45,
      fontWeight: 700,
    },
    h6: {
      fontSize: "1.125rem",
      lineHeight: 1.45,
      fontWeight: 700,
    },
    subtitle1: {
      fontSize: "1rem",
      lineHeight: 1.45,
      fontWeight: 400,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.45,
      fontWeight: 400,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.45,
      fontWeight: 400,
    },
    caption: {
      fontSize: "0.75rem",
      lineHeight: 1.45,
      fontWeight: 400,
    },
    button: {
      fontWeight: 500,
      textTransform: "none",
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    "none",
    "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          borderRadius: 8,
          padding: "8px 16px",
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },
        contained: {
          "&:hover": {
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          },
        },
        containedPrimary: {
          "&:hover": {
            backgroundColor: "#ea580c",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            "& fieldset": { borderColor: "#d1d5db" },
            "&:hover fieldset": { borderColor: "#9ca3af" },
            "&.Mui-focused fieldset": { borderColor: "#ea580c" },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow:
            "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          borderRadius: 12,
          border: "1px solid #e5e7eb",
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: "#ea580c",
          height: 3,
          borderRadius: "3px 3px 0 0",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          fontSize: "0.875rem",
          color: "#111827",
          "&:hover": { color: "#ea580c" },
          "&.Mui-selected": { color: "#ea580c", fontWeight: 600 },
        },
      },
    },
    MuiPickersDay: {
      styleOverrides: {
        root: {
          /* normal selected */
          "&.Mui-selected": {
            backgroundColor: "#505050",
            color: "#ffffff",
          },

          /* 🔥 FIX: selected + hover */
          "&.Mui-selected:hover": {
            backgroundColor: "#232323",
          },

          /* hover on non-selected days (optional but safe) */
          "&:hover": {
            backgroundColor: "#f3f4f6",
          },
        },
      },
    },

    MuiClockNumber: {
      styleOverrides: {
        root: {
          /* selected time */
          "&.Mui-selected": {
            backgroundColor: "#828282",
            color: "#ffffff",
          },

          /* 🔥 hover on selected time */
          "&.Mui-selected:hover": {
            backgroundColor: "#232323",
          },

          /* hover on normal time */
          "&:hover": {
            backgroundColor: "#f3f4f6",
          },
        },
      },
    },

    MuiPickersToolbarButton: {
      styleOverrides: {
        root: {
          "&.Mui-selected": { backgroundColor: "#828282", color: "#ffffff" },
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          "& .MuiButton-root": {
            color: "#828282",
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 500 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 12 },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          border: "1px solid #e5e7eb",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: "2px 8px",
          "&:hover": { backgroundColor: "#f3f4f6" },
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          top: 8,
          right: 8,
          minWidth: 18,
          height: 18,
          padding: "0 6px",
          fontSize: "0.75rem",
          fontWeight: 600,
          borderRadius: 999,
          border: "2px solid #ffffff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        },
      },
    },
  },
});

export default theme;
