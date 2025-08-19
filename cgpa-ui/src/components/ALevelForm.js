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
} from "@mui/material";

// ---- Grading systems (ordered as requested) ----
const GRADING = {
  LEGACY_25: "LEGACY_25", // earliest: max 25 (≈ 9/8/7/6/5)
  CLASSIC_18: "CLASSIC_18", // popular classic: max 18 (6/5/4/3/2)
  COMPETENCY_60: "COMPETENCY_60", // current letters; many HEIs map ~ to 20/15/10/5/2
};

const LETTERS = ["A", "B", "C", "D", "E", "O", "F"];

// principal points per letter for each system
const POINTS = {
  [GRADING.LEGACY_25]: { A: 9, B: 8, C: 7, D: 6, E: 5, O: 1, F: 0 },
  [GRADING.CLASSIC_18]: { A: 6, B: 5, C: 4, D: 3, E: 2, O: 1, F: 0 },
  // UNEB reports letters; many universities internally use this spread
  [GRADING.COMPETENCY_60]: { A: 20, B: 15, C: 10, D: 5, E: 2, O: 1, F: 0 },
};

// weak/distinction rules for features (aligns with your extractor)
const isDistinction = (letter) => letter === "A";
const isWeak = (letter) => letter === "D" || letter === "E" || letter === "F"; // ≤ C are strong

// reasonable UACE year range
const CURRENT_YEAR = new Date().getFullYear();
const UACE_YEARS = Array.from({ length: 20 }, (_, i) => CURRENT_YEAR - i); // this year back 20

// Small helper: shallow compare object values and emit only when changed
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
  // ---- Local UI state (never write to parent directly) ----
  const [grading, setGrading] = useState(GRADING.LEGACY_25);
  const [uaceYear, setUaceYear] = useState(
    typeof data.uace_year_code === "number"
      ? data.uace_year_code
      : UACE_YEARS[0]
  );
  const [gpPass, setGpPass] = useState(
    typeof data.general_paper === "number" ? data.general_paper : 1
  );

  // Up to 5 principal subjects – Subject 1..5. Store as letters.
  const [subjects, setSubjects] = useState(
    Array.from({ length: 3 }, () => "A") // start with 3 rows, users can extend to 5 via UI outside if you choose later
  );

  // lock max subjects = 5 as per your note
  const numSubjects = Math.min(5, subjects.filter(Boolean).length);

  // ---- Derived feature calculations (local) ----
  const calc = useMemo(() => {
    const pts = POINTS[grading];
    const letters = subjects.filter(Boolean).slice(0, 5);

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

    const countDist = letters.filter(isDistinction).length;
    const countWeak = letters.filter(isWeak).length;

    // high school metrics (same formula style you used: average of stdevs; here only A‑level available)
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
  }, [grading, subjects]);

  // ---- Emit to parent ONLY when derived values actually change ----
  const lastEmitted = useRef(null);
  useEffect(() => {
    emitIfChanged(
      lastEmitted,
      {
        // raw passthroughs the model expects
        uace_year_code: uaceYear,
        general_paper: gpPass,

        // derived features
        ...calc,
      },
      onChange
    );
  }, [uaceYear, gpPass, calc, onChange]);

  // ---- Field helpers ----
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

  return (
    <div style={{ marginTop: "2rem" }}>
      <Typography variant="h6" gutterBottom>
        🎓 A‑Level (UACE) – Subjects & Grading
      </Typography>

      {/* Grading system switch (ordered: 25 → 18 → Competency) */}
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
          <ToggleButton value={GRADING.LEGACY_25}>Legacy (max 25)</ToggleButton>
          <ToggleButton value={GRADING.CLASSIC_18}>
            Classic (max 18)
          </ToggleButton>
          <ToggleButton value={GRADING.COMPETENCY_60}>
            Competency (letters)
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Grid container spacing={2}>
        {/* Year */}
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
            helperText="Required by many universities."
          >
            <MenuItem value={1}>Passed</MenuItem>
            <MenuItem value={0}>Did not pass</MenuItem>
          </TextField>
        </Grid>

        {/* Subject letter inputs */}
        {Array.from({ length: 5 }).map((_, i) => (
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
              <MenuItem value="">— not used —</MenuItem>
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
                label={`Subjects: ${calc.alevel_num_subjects}`}
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
              selected framework.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}
