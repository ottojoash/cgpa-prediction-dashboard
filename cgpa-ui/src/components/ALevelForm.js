// src/components/ALevelForm.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Grid,
  TextField,
  Typography,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Chip,
  Box,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";

// ---- Grading systems (ordered as requested) ----
const GRADING = {
  LEGACY_25: "LEGACY_25", // earliest: max 25 era (4 principals + GP)
  CLASSIC_18: "CLASSIC_18", // well-known “18-point” era (3 principals + subsidiaries)
  COMPETENCY_60: "COMPETENCY_60", // current competency-based; HEIs often map to 60
};

const LETTERS = ["A", "B", "C", "D", "E", "O", "F"];

// Points per letter for each system (used to compute the features you emit)
const POINTS = {
  [GRADING.LEGACY_25]: { A: 9, B: 8, C: 7, D: 6, E: 5, O: 1, F: 0 },
  [GRADING.CLASSIC_18]: { A: 6, B: 5, C: 4, D: 3, E: 2, O: 1, F: 0 },
  [GRADING.COMPETENCY_60]: { A: 20, B: 15, C: 10, D: 5, E: 2, O: 1, F: 0 },
};

// Distinction/weak rules (align with your extractor: Distinction=A; Weak = D/E/F)
const isDistinction = (letter) => letter === "A";
const isWeak = (letter) => letter === "D" || letter === "E" || letter === "F";

// UACE year options (current year back 20)
const CURRENT_YEAR = new Date().getFullYear();
const UACE_YEARS = Array.from({ length: 20 }, (_, i) => CURRENT_YEAR - i);

// Subject limits per framework (principals only)
const SUBJECT_LIMITS = {
  [GRADING.LEGACY_25]: { min: 4, max: 4 },
  [GRADING.CLASSIC_18]: { min: 3, max: 3 },
  [GRADING.COMPETENCY_60]: { min: 2, max: 3 },
};

// Helper: only emit to parent when values truly changed
function emitIfChanged(prevRef, next, onChange) {
  const prev = prevRef.current || {};
  let changed = false;
  for (const k of Object.keys(next)) {
    if (prev[k] !== next[k]) {
      changed = true;
      break;
    }
  }
  if (changed) {
    prevRef.current = next;
    for (const [k, v] of Object.entries(next)) onChange(k, v);
  }
}

export default function ALevelForm({ data, onChange, touched = {} }) {
  // ---- Local UI state ----
  const [grading, setGrading] = useState(GRADING.LEGACY_25);

  const [uaceYear, setUaceYear] = useState(
    typeof data.uace_year_code === "number"
      ? data.uace_year_code
      : UACE_YEARS[0]
  );

  const [gpPass, setGpPass] = useState(
    typeof data.general_paper === "number" ? data.general_paper : 1
  );

  // Principal subject count – fixed by framework except Competency (2–3 selectable)
  const initialLimits = SUBJECT_LIMITS[grading];
  const [principalCount, setPrincipalCount] = useState(initialLimits.min);

  // Letter grades for principals – keep array length >= 3; we’ll slice when rendering
  const [subjects, setSubjects] = useState(["A", "A", "A"]);

  // Sync principalCount when framework changes (respect limits)
  useEffect(() => {
    const { min, max } = SUBJECT_LIMITS[grading];
    setPrincipalCount((prev) => {
      if (grading === GRADING.COMPETENCY_60) {
        // clamp previous value to 2–3 on switch
        return Math.min(max, Math.max(min, prev));
      }
      // force fixed count for legacy/classic
      return min;
    });
  }, [grading]);

  // Ensure subjects array has enough slots; trim if too many
  useEffect(() => {
    setSubjects((prev) => {
      let next = [...prev];
      if (next.length < principalCount) {
        next = next.concat(
          Array.from({ length: principalCount - next.length }, () => "")
        );
      } else if (next.length > principalCount) {
        next = next.slice(0, principalCount);
      }
      return next;
    });
  }, [principalCount]);

  // ---- Derived calculations (principals only) ----
  const calc = useMemo(() => {
    const pts = POINTS[grading];
    const letters = subjects.slice(0, principalCount).filter((x) => x !== "");

    const weights = letters.map((L) => pts[L] ?? 0);
    const total = weights.reduce((a, b) => a + b, 0);
    const avg = weights.length ? total / weights.length : 0;

    const mean = avg;
    const variance =
      weights.length > 1
        ? weights.reduce((s, x) => s + Math.pow(x - mean, 2), 0) /
          weights.length
        : 0;
    const std = Math.sqrt(variance);

    // dominant (mode) weight
    const freq = new Map();
    for (const w of weights) freq.set(w, (freq.get(w) || 0) + 1);
    const dominant =
      weights.length === 0
        ? 0
        : [...freq.entries()].sort((a, b) =>
            a[1] === b[1] ? b[0] - a[0] : b[1] - a[1]
          )[0][0];

    const countWeak = letters.filter(isWeak).length;

    // Following your variance/stability pattern
    const hsVariance = Number((std || 0).toFixed(3));
    const hsStability = Number(
      (hsVariance > 0 ? 1 / (1 + hsVariance) : 1).toFixed(3)
    );

    return {
      alevel_total_grade_weight: Number(total.toFixed(2)),
      alevel_average_grade_weight: Number(avg.toFixed(2)),
      alevel_std_dev_grade_weight: Number(std.toFixed(3)),
      alevel_dominant_grade_weight: dominant,
      alevel_count_weak_grades: countWeak,
      alevel_num_subjects: letters.length,
      high_school_performance_variance: hsVariance,
      high_school_performance_stability_index: hsStability,
    };
  }, [grading, subjects, principalCount]);

  // ---- Emit to parent model only when changed ----
  const lastEmitted = useRef(null);
  useEffect(() => {
    emitIfChanged(
      lastEmitted,
      {
        uace_year_code: uaceYear,
        general_paper: gpPass,
        ...calc,
      },
      onChange
    );
  }, [uaceYear, gpPass, calc, onChange]);

  // ---- Field helper ----
  const req = (name, value) => ({
    value,
    error:
      touched[name] &&
      (value === "" || value === null || typeof value === "undefined"),
    helperText:
      touched[name] &&
      (value === "" || value === null || typeof value === "undefined")
        ? "Required"
        : " ",
  });

  // UI helpers
  const isCompetency = grading === GRADING.COMPETENCY_60;
  const { min: minSubs, max: maxSubs } = SUBJECT_LIMITS[grading];

  return (
    <div style={{ marginTop: "2rem" }}>
      <Typography variant="h6" gutterBottom>
        🎓 A‑Level (UACE) – Subjects & Grading
      </Typography>

      {/* Framework switch (25 → 18 → Competency) */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Choose the grading framework used when you sat UACE.
        </Typography>
        <ToggleButtonGroup
          exclusive
          value={grading}
          onChange={(_, v) => v && setGrading(v)}
          size="small"
        >
          <ToggleButton value={GRADING.LEGACY_25}>
            Legacy (max 25 Pts)
          </ToggleButton>
          <ToggleButton value={GRADING.CLASSIC_18}>
            Classic (max 18 Pts)
          </ToggleButton>
          <ToggleButton value={GRADING.COMPETENCY_60}>
            Competency Based (max 60 Pts)
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Grading system description */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {grading === GRADING.LEGACY_25 && (
            <>
              <strong>Legacy (Max 25 points):</strong> Typically{" "}
              <strong>4 principal subjects</strong> are offered (letters A–F),
              with General Paper taken separately. For model features we map
              A=9, B=8, C=7, D=6, E=5, O=1, F=0.
            </>
          )}
          {grading === GRADING.CLASSIC_18 && (
            <>
              <strong>Classic (Max 18 points):</strong> Standard era with{" "}
              <strong>3 principal subjects</strong>. Universities aggregate best
              three principals out of 18 (A=6, B=5, C=4, D=3, E=2; O=1, F=0).
              Subsidiaries (GP, Sub-Math/ICT/Bio) are required by policy but not
              included in this model’s principal-weight features.
            </>
          )}
          {grading === GRADING.COMPETENCY_60 && (
            <>
              <strong>Competency‑Based (Current):</strong> Offer{" "}
              <strong>2–3 principal subjects</strong>, with compulsory core
              (e.g., GP, Sub‑ICT). For this model we use a wider internal
              mapping: A≈20, B≈15, C≈10, D≈5, E≈2; O=1, F=0.
            </>
          )}
        </Typography>
      </Box>

      {/* Principal subject count (only adjustable for Competency) */}
      <Box sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center" }}>
        <FormControl size="small" sx={{ width: 240 }}>
          <InputLabel id="principal-count-label">
            Number of principal subjects
          </InputLabel>
          <Select
            labelId="principal-count-label"
            label="Number of principal subjects"
            value={principalCount}
            onChange={(e) => {
              const val = Number(e.target.value);
              // clamp to limits just in case
              const clamped = Math.min(maxSubs, Math.max(minSubs, val));
              setPrincipalCount(clamped);
            }}
            disabled={!isCompetency}
          >
            {Array.from(
              { length: maxSubs - minSubs + 1 },
              (_, i) => minSubs + i
            ).map((n) => (
              <MenuItem key={n} value={n}>
                {n} principal{n > 1 ? "s" : ""}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Chip
          size="small"
          variant="outlined"
          label={
            grading === GRADING.LEGACY_25
              ? "Framework: 4 principals (+GP)"
              : grading === GRADING.CLASSIC_18
              ? "Framework: 3 principals (+subs)"
              : "Framework: 2–3 principals (+core)"
          }
        />
      </Box>

      <Grid container spacing={2}>
        {/* UACE Year */}
        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label="UACE Year"
            {...req("uace_year_code", uaceYear)}
            onChange={(e) => setUaceYear(Number(e.target.value))}
          >
            {UACE_YEARS.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* General Paper */}
        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label="General Paper (Pass?)"
            {...req("general_paper", gpPass)}
            onChange={(e) => setGpPass(Number(e.target.value))}
            helperText="Often required for admission; not part of principal-weight totals."
          >
            <MenuItem value={1}>Passed</MenuItem>
            <MenuItem value={0}>Did not pass</MenuItem>
          </TextField>
        </Grid>

        {/* Principal subject letter inputs (render exactly principalCount) */}
        {Array.from({ length: principalCount }).map((_, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <TextField
              select
              fullWidth
              label={`Subject ${i + 1} (Letter grade)`}
              value={subjects[i] ?? ""}
              onChange={(e) => {
                const next = [...subjects];
                next[i] = e.target.value;
                setSubjects(next);
              }}
            >
              <MenuItem value="">— select —</MenuItem>
              {LETTERS.map((L) => (
                <MenuItem key={L} value={L}>
                  {L}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        ))}

        {/* Read‑only computed features (what the model expects) */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Computed features (sent to the model)
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Chip
                label={`Principals: ${calc.alevel_num_subjects}`}
                size="small"
              />
              <Chip
                label={`Total weight: ${calc.alevel_total_grade_weight}`}
                size="small"
              />
              <Chip
                label={`Average: ${calc.alevel_average_grade_weight}`}
                size="small"
              />
              <Chip
                label={`Std dev: ${calc.alevel_std_dev_grade_weight}`}
                size="small"
              />
              <Chip
                label={`Dominant weight: ${calc.alevel_dominant_grade_weight}`}
                size="small"
              />
              <Chip
                label={`Weak grades: ${calc.alevel_count_weak_grades}`}
                size="small"
              />
              <Chip
                label={`HS variance: ${calc.high_school_performance_variance}`}
                size="small"
              />
              <Chip
                label={`Stability idx: ${calc.high_school_performance_stability_index}`}
                size="small"
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              Distinction = A; Weak = D/E/F. Points per letter depend on the
              selected framework. (Subsidiaries like GP/Sub‑ICT aren’t included
              in these principal‑weight features.)
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}
