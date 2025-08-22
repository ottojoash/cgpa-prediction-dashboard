// src/components/ResultPanel.jsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Tooltip,
  IconButton,
  Collapse,
  Stack,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

// --- helpers ---
const fmt = (n, d = 3) =>
  typeof n === "number" && isFinite(n) ? n.toFixed(d) : String(n ?? "-");

// Make a fixed max for bar widths so visuals are stable
const computeMaxAbs = (arr) =>
  arr.reduce((m, x) => Math.max(m, Math.abs(x || 0)), 0) || 1;

// Simple horizontal bar used for importance and SHAP items
function HBar({ value, maxAbs, color, labelLeft, labelRight }) {
  const pct = Math.min(100, Math.round((Math.abs(value) / maxAbs) * 100));
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {labelLeft && (
        <Typography
          variant="body2"
          sx={{ width: 180, color: "text.secondary", whiteSpace: "nowrap" }}
          title={labelLeft}
        >
          {labelLeft}
        </Typography>
      )}
      <Box
        sx={{ flex: 1, height: 10, bgcolor: "action.hover", borderRadius: 10 }}
      >
        <Box
          sx={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 10,
            bgcolor: color,
          }}
        />
      </Box>
      {labelRight && (
        <Typography variant="caption" sx={{ minWidth: 64, textAlign: "right" }}>
          {labelRight}
        </Typography>
      )}
    </Box>
  );
}

export default function ResultPanel({ result, payload }) {
  const [showRaw, setShowRaw] = useState(false);

  // ----- derived for display -----
  const cgpa = result?.predicted_cgpa;
  const band = result?.performance_band;

  // Global importance: already normalized in backend (sum ~ 1)
  const globalImp = Array.isArray(result?.global_importance)
    ? result.global_importance
    : [];

  // Local SHAP: pick the top +/- contributors
  const shapValues = Array.isArray(result?.shap?.values)
    ? result.shap.values
    : [];

  // Sort by absolute magnitude desc
  const shapSorted = useMemo(
    () =>
      [...shapValues].sort(
        (a, b) => Math.abs(b.shap || 0) - Math.abs(a.shap || 0)
      ),
    [shapValues]
  );

  const topLocal = shapSorted.slice(0, 8);
  const shapMaxAbs = computeMaxAbs(topLocal.map((d) => d.shap));

  // Guidance
  const guidance = Array.isArray(result?.guidance) ? result.guidance : [];

  // (Optional) student vs cohort if backend provided it
  const comparisons = Array.isArray(result?.comparisons)
    ? result.comparisons
    : [];

  // ----- UI -----
  return (
    <Stack spacing={2}>
      {/* Summary header */}
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="h6" sx={{ flex: 1 }}>
            Prediction Summary
          </Typography>
          <Chip
            label={`CGPA: ${fmt(cgpa, 3)}`}
            color="success"
            sx={{ fontWeight: 700 }}
          />
          <Chip
            label={band || "-"}
            variant="outlined"
            sx={{
              fontWeight: 600,
              borderColor: "primary.main",
              color: "primary.main",
            }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          This score is produced by the trained model using your supplied
          features. Below we show what globally matters most (across the cohort)
          and what contributed locally for this student (SHAP).
        </Typography>
      </Paper>

      {/* Local explanation (SHAP) */}
      {topLocal.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" gutterBottom>
            Why this prediction (local drivers)
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 1 }}
          >
            Positive bars push CGPA up; negative bars pull it down (relative to
            the model’s baseline).
          </Typography>

          <Stack spacing={1.2}>
            {topLocal.map((d) => (
              <HBar
                key={d.feature}
                value={d.shap}
                maxAbs={shapMaxAbs}
                color={d.shap >= 0 ? "success.main" : "error.main"}
                labelLeft={d.feature}
                labelRight={`${d.shap >= 0 ? "+" : ""}${fmt(d.shap, 3)}`}
              />
            ))}
          </Stack>

          {typeof result?.shap?.expected_value === "number" && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1 }}
            >
              Model baseline (expected value):{" "}
              {fmt(result.shap.expected_value, 3)}
              &nbsp;→&nbsp; baseline + ΣSHAP ≈ predicted CGPA.
            </Typography>
          )}
        </Paper>
      )}

      {/* Global feature importance */}
      {globalImp.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" gutterBottom>
            What the model cares about (global importance)
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 1 }}
          >
            From training data (e.g., permutation importance or model
            importances). Values sum ≈ 1.
          </Typography>

          <Stack spacing={1.2}>
            {globalImp.map((g) => (
              <HBar
                key={g.feature}
                value={g.importance}
                maxAbs={1}
                color="primary.main"
                labelLeft={g.feature}
                labelRight={fmt(g.importance, 3)}
              />
            ))}
          </Stack>
        </Paper>
      )}

      {/* Guidance */}
      {guidance.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" gutterBottom>
            Guidance
          </Typography>
          <Stack component="ul" sx={{ pl: 3, my: 0 }} spacing={0.5}>
            {guidance.map((t, i) => (
              <Typography key={i} component="li" variant="body2">
                {t}
              </Typography>
            ))}
          </Stack>
        </Paper>
      )}

      {/* (Optional) Student vs cohort comparisons if provided */}
      {comparisons.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" gutterBottom>
            Student vs Cohort (selected features)
          </Typography>
          <Grid container spacing={1}>
            {comparisons.slice(0, 8).map((c) => (
              <Grid item xs={12} md={6} key={c.feature}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {c.feature}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      alignItems: "center",
                      mt: 0.5,
                    }}
                  >
                    <Chip
                      size="small"
                      label={`you: ${fmt(c.student_value, 3)}`}
                    />
                    {typeof c.p50 === "number" && (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`median: ${fmt(c.p50, 3)}`}
                      />
                    )}
                    {c.status && (
                      <Chip
                        size="small"
                        color={
                          c.status === "above average"
                            ? "success"
                            : c.status === "below average"
                            ? "warning"
                            : "default"
                        }
                        label={c.status}
                      />
                    )}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Raw response + payload */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="subtitle1" sx={{ flex: 1 }}>
            Technical details (raw JSON)
          </Typography>
          <Tooltip title="Copy JSON">
            <IconButton
              size="small"
              onClick={() => {
                const raw = JSON.stringify({ payload, result }, null, 2);
                navigator.clipboard?.writeText(raw);
              }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={() => setShowRaw((s) => !s)}>
            {showRaw ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        <Collapse in={showRaw} unmountOnExit>
          <Box
            component="pre"
            sx={{
              mt: 1,
              p: 2,
              borderRadius: 1,
              bgcolor: "background.default",
              border: "1px solid",
              borderColor: "divider",
              overflow: "auto",
              maxHeight: 360,
            }}
          >
            {JSON.stringify({ payload, result }, null, 2)}
          </Box>
        </Collapse>
      </Paper>

      {/* (nice touch) confidence/proximity cue if SHAP provided */}
      {topLocal.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 1 }}
          >
            Contribution balance (absolute SHAP magnitude across top factors)
          </Typography>
          <LinearProgress
            variant="determinate"
            value={Math.min(
              100,
              Math.round(
                (topLocal
                  .map((d) => Math.abs(d.shap || 0))
                  .reduce((a, b) => a + b, 0) /
                  (shapMaxAbs * topLocal.length || 1)) *
                  100
              )
            )}
          />
        </Paper>
      )}
    </Stack>
  );
}
