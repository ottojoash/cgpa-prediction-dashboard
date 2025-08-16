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
  components: {
    MuiPaper: { styleOverrides: { root: { border: "1px solid #2a2f3a" } } },
    MuiTextField: { defaultProps: { size: "small", variant: "outlined" } },
    MuiMenuItem: { styleOverrides: { root: { fontSize: 14 } } },
  },
  typography: {
    fontFamily: `"Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial`,
    h4: { fontWeight: 700 },
    h6: { fontWeight: 600, letterSpacing: 0.2 },
  },
});

export default theme;
