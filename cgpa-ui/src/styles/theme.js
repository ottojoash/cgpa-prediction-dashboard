// src/theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#0f1115", paper: "#1a1d24" },
    primary: { main: "#00e0a4" },
    secondary: { main: "#7aa2f7" },
    text: { primary: "#e6e6e6", secondary: "#a8b0bf" },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: `"Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial`,
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600, letterSpacing: 0.2 },
  },
  components: {
    // Existing overrides
    MuiPaper: {
      styleOverrides: { root: { border: "1px solid #2a2f3a" } },
    },
    MuiTextField: {
      defaultProps: { size: "small", variant: "outlined" },
    },
    MuiMenuItem: {
      styleOverrides: { root: { fontSize: 14 } },
    },

    // NEW: ensure TextField select has space for endAdornment icons
    MuiSelect: {
      styleOverrides: {
        select: {
          // Add extra room on the right so text & caret don't collide with custom icons
          paddingRight: 48, // ~ theme.spacing(6)
        },
        icon: {
          // Nudge the default arrow left so it doesn't overlap your endAdornment
          right: 40, // px; adjust if you add multiple icons
        },
      },
    },

    // NEW: slightly tighten end adornment spacing globally
    MuiInputAdornment: {
      styleOverrides: {
        root: {
          "&.MuiInputAdornment-positionEnd": {
            marginLeft: 4,
          },
        },
      },
    },

    // Optional: keep dense/compact inputs tidy inside OutlinedInput
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          // Prevent text from sliding under icons in some browsers
          // when multiple end adornments are present
          paddingRight: 8,
        },
      },
    },
  },
});

export default theme;
