// src/components/ResultsPanel.jsx
import React, { useMemo } from "react";
import {
  Box,
  Paper,
  Grid,
  Typography,
  Chip,
  Divider,
  LinearProgress,
  Button,
  Tooltip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DownloadIcon from "@mui/icons-material/Download";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

/**
 * Props:
 *  - result: API response object
 *  - payload: the submitted numeric payload (castPayload)
 */
export default function ResultsPanel({ result, payload }) {
  const cgpa = result?.predicted_cgpa ?? null;
  const band = result?.performance_band ?? "—";
  const globalImp = Array.isArray(result?.global_importance)
    ? result.global_importance
    : [];
  const shapValues = Array.isArray(result?.shap?.values)
    ? result.shap.values
    : [];
  const expected = result?.shap?.expected_value ?? null;
  const comparisons = Array.isArray(result?.comparisons)
    ? result.comparisons
    : [];
  const guidance = Array.isArray(result?.guidance) ? result.guidance : [];

  // SHAP: top 8 by absolute contribution
  const topShap = useMemo(() => {
    const sorted = [...shapValues].sort(
      (a, b) => Math.abs(b.shap) - Math.abs(a.shap)
    );
    return sorted.slice(0, 8).map((d) => ({ ...d, abs: Math.abs(d.shap) }));
  }, [shapValues]);

  // Compute model output from expected + contributions (sanity line)
  const shapSanity = useMemo(() => {
    if (expected == null || shapValues.length === 0 || cgpa == null)
      return null;
    const sum = shapValues.reduce(
      (s, d) => s + (Number.isFinite(d.shap) ? d.shap : 0),
      0
    );
    return {
      expected,
      contributions: sum,
      expectedPlusContrib: expected + sum,
      modelOutput: cgpa,
      delta: expected + sum - cgpa,
    };
  }, [expected, shapValues, cgpa]);

  const programShap = shapValues.find((d) => d.feature === "program_id_code");
  const campusShap = shapValues.find((d) => d.feature === "campus_id_code");

  const fmt2 = (v) =>
    v == null || Number.isNaN(v) ? "—" : Number(v).toFixed(2);

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify({ payload, result }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    a.download = `cgpa_prediction_${ts}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Grid container spacing={2}>
      {/* Left: headline + interpretability summary */}
      <Grid item xs={12} lg={12}>
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Prediction Overview
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={12}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: "action.hover" }}>
                <Typography variant="body2" color="text.secondary">
                  Predicted CGPA
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {fmt2(cgpa)}
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mt: 1 }}
                >
                  <Chip
                    size="small"
                    color="success"
                    variant="outlined"
                    label={band}
                  />
                  {expected != null && (
                    <Tooltip title="Model baseline (expected value) from SHAP">
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`Baseline: ${fmt2(expected)}`}
                      />
                    </Tooltip>
                  )}
                </Stack>
                <Box sx={{ mt: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, Math.max(0, (cgpa / 5) * 100))}
                    sx={{ height: 8, borderRadius: 999 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    0.0 — 5.0 scale
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={12}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: "action.hover" }}>
                <Typography variant="body2" color="text.secondary">
                  Program & Campus effect (local)
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mt: 0.5, flexWrap: "wrap" }}
                >
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`Program: ${payload?.program_id_code ?? "—"}`}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`Campus: ${payload?.campus_id_code ?? "—"}`}
                  />
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 1 }}
                >
                  SHAP contribution ≈ how this feature pushed your CGPA up/down
                  versus the baseline.
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip
                    size="small"
                    color={
                      (programShap?.shap ?? 0) >= 0 ? "success" : "warning"
                    }
                    label={`Program Δ: ${fmt2(programShap?.shap)}`}
                  />
                  <Chip
                    size="small"
                    color={(campusShap?.shap ?? 0) >= 0 ? "success" : "warning"}
                    label={`Campus Δ: ${fmt2(campusShap?.shap)}`}
                  />
                </Stack>
              </Box>
            </Grid>
          </Grid>

          {shapSanity && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1.5 }}
            >
              Sanity: baseline {fmt2(shapSanity.expected)} + contributions{" "}
              {fmt2(shapSanity.contributions)} ≈{" "}
              {fmt2(shapSanity.expectedPlusContrib)} (model{" "}
              {fmt2(shapSanity.modelOutput)}).
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              bgcolor: "background.paper",
              borderColor: "divider",
            }}
          >
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Insights
            </Typography>
            <Divider sx={{ mb: 1 }} />

            {guidance.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No tailored guidance available.
              </Typography>
            ) : (
              <List dense disablePadding>
                {guidance.map((g, i) => (
                  <ListItem
                    key={i}
                    sx={{
                      alignItems: "flex-start",
                      py: 0.5,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, mt: "2px" }}>
                      <TipsAndUpdatesIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primaryTypographyProps={{ variant: "body2" }}
                      primary={g}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Paper>

        {/* Raw response (collapsible) */}
        <Accordion sx={{ mt: 2 }} defaultExpanded={false}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Raw Response</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <pre style={{ margin: 0, maxHeight: 300, overflow: "auto" }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </AccordionDetails>
        </Accordion>
        <Accordion sx={{ mt: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">
              Submitted Payload (numeric)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <pre style={{ margin: 0, maxHeight: 300, overflow: "auto" }}>
              {JSON.stringify(payload, null, 2)}
            </pre>
          </AccordionDetails>
        </Accordion>
        <Box sx={{ mt: 2 }}>
          <Button
            startIcon={<DownloadIcon />}
            onClick={downloadJSON}
            variant="outlined"
          >
            Download full JSON
          </Button>
        </Box>
      </Grid>

      {/* Right: charts */}
      <Grid item xs={12} lg={12}>
        {/* Global importance */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Global Feature Importance (model-wide)
          </Typography>
          {globalImp.length > 0 ? (
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  margin={{ top: 8, right: 24, left: 8, bottom: 55 }}
                  data={[...globalImp].sort(
                    (a, b) => b.importance - a.importance
                  )}
                >
                  <XAxis
                    dataKey="feature"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <RTooltip formatter={(v) => Number(v).toFixed(3)} />
                  <Bar dataKey="importance">
                    {globalImp.map((_, idx) => (
                      <Cell key={idx} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Not available.
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            Importance is normalized; higher bars = stronger average influence
            across students.
          </Typography>
        </Paper>

        {/* Local top SHAP contributors */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Your Top Contributors (SHAP, ± effect)
          </Typography>
          {topShap.length > 0 ? (
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...topShap].reverse()}>
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="feature" width={120} />
                  <RTooltip
                    formatter={(v, n, item) =>
                      `${item.payload.shap.toFixed(
                        3
                      )} (|Δ| ${item.payload.abs.toFixed(3)})`
                    }
                  />
                  <Bar dataKey="shap">
                    {topShap.map((d, idx) => (
                      <Cell
                        key={idx}
                        fill={d.shap >= 0 ? "#29b77b" : "#ff7f66"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Not available.
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            Positive bars push CGPA up from the baseline; negatives pull it
            down.
          </Typography>
        </Paper>
      </Grid>

      {/* Optional: cohort comparisons table, if you later enable it */}
      {comparisons?.length > 0 && (
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Cohort Comparison (feature by feature)
            </Typography>
            <Box sx={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {[
                      "Feature",
                      "Yours",
                      "Mean",
                      "P25",
                      "P50",
                      "P75",
                      "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "6px 8px",
                          borderBottom: "1px solid rgba(255,255,255,0.12)",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisons.slice(0, 50).map((r, i) => (
                    <tr key={i}>
                      <td style={{ padding: "6px 8px" }}>{r.feature}</td>
                      <td style={{ padding: "6px 8px" }}>
                        {fmt2(r.student_value)}
                      </td>
                      <td style={{ padding: "6px 8px" }}>{fmt2(r.mean)}</td>
                      <td style={{ padding: "6px 8px" }}>{fmt2(r.p25)}</td>
                      <td style={{ padding: "6px 8px" }}>{fmt2(r.p50)}</td>
                      <td style={{ padding: "6px 8px" }}>{fmt2(r.p75)}</td>
                      <td style={{ padding: "6px 8px" }}>{r.status ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1 }}
            >
              Comparisons use training‑set summaries from{" "}
              <code>metadata.json</code>.
            </Typography>
          </Paper>
        </Grid>
      )}
    </Grid>
  );
}
