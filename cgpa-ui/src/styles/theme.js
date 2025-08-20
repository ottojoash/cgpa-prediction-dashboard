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

    /**
     * Make Selects play nicely with endAdornment (Clear / Info icons)
     * 1) Add base extra space on the right so text never runs under icons
     * 2) When the input has an endAdornment, add even more space
     * 3) Move the default caret (▼) left accordingly
     */
    MuiSelect: {
      styleOverrides: {
        select: {
          // Base extra space (even without adornment)
          paddingRight: 48, // ≈ theme.spacing(6)
        },
        icon: {
          right: 40, // keep the caret left of your adornment area
          pointerEvents: "auto", // still clickable to open
        },
      },
    },

    // Slightly tighten the space between value and endAdornment
    MuiInputAdornment: {
      styleOverrides: {
        root: {
          "&.MuiInputAdornment-positionEnd": {
            marginLeft: 4,
          },
        },
      },
    },

    /**
     * "Adorned-aware" spacing for Outlined inputs that are selects
     * Targets the common case where you render <TextField select ... InputProps={{ endAdornment: ... }}>
     */
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          // When there is an endAdornment, push the select text + caret further left
          "&.MuiInputBase-adornedEnd .MuiSelect-select": {
            paddingRight: 88, // more room so clear/info never overlap text
          },
          "&.MuiInputBase-adornedEnd .MuiSelect-icon": {
            right: 64, // move caret further left to avoid overlapping the adornment
          },
        },
        input: {
          // keep native input text from sliding under icons in some browsers
          paddingRight: 8,
        },
      },
    },
  },
});

export default theme;
