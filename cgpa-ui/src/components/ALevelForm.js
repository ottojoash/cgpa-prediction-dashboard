// src/components/ALevelForm.jsx
import React, { useMemo, useEffect, useState } from "react";
import {
  Grid,
  TextField,
  Typography,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
  LinearProgress,
  InputAdornment,
  Button,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ClearIcon from "@mui/icons-material/Clear";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

// ---- Config ----
const MAX_SUBJECTS = 5; // typical UACE max
const MIN_SUBJECTS = 3; // typical principal min for scoring
const MIN_YEAR = 2005; // sensible lower bound for UI
const CURRENT_YEAR = new Date().getFullYear();

// Grading systems
// NOTE: We compute "grade weights" because your backend's extractAlevelFeatures()
// operates on numeric weights, e.g., weak if weight <= 3, distinction if >= 5.
const GRADE_WEIGHT_TABLES = {
  18: { A: 6, B: 5, C: 4, D: 3, E: 2, O: 1, F: 0 }, // classic “/18” system
  25: { A: 9, B: 8, C: 7, D: 6, E: 5, O: 1, F: 0 }, // intermediate “/25” (capped)
  60: { A: 20, B: 15, C: 10, D: 5, E: 2, O: 1, F: 0 }, // modern “/60” style weights
};

const GRADE_OPTIONS = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
  { value: "E", label: "E" },
  { value: "O", label: "O (Subsidiary)" },
  { value: "F", label: "F (Fail)" },
];

const years = Array.from(
  { length: Math.max(0, CURRENT_YEAR - MIN_YEAR + 1) },
  (_, i) => MIN_YEAR + i
);

// ---- Helpers ----
const mean = (arr) =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
const stddev = (arr, avg) => {
  if (!arr.length) return 0;
  const variance =
    arr.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / arr.length;
  return Math.sqrt(variance);
};
const round = (n, dp = 2) => (Number.isFinite(n) ? Number(n.toFixed(dp)) : n);
const dominant = (arr) => {
  const freq = new Map();
  arr.forEach((v) => freq.set(v, (freq.get(v) || 0) + 1));
  let best = 0;
  let bestCount = -1;
  for (const [val, count] of freq.entries()) {
    if (count > bestCount) {
      best = val;
      bestCount = count;
    }
  }
  return best;
};

// Convert grades → weights for the chosen system
const toWeights = (grades, systemKey) => {
  const table = GRADE_WEIGHT_TABLES[systemKey] || GRADE_WEIGHT_TABLES["60"];
  return grades.map((g) => table[g] ?? 0);
};

// ---- Component ----
const ALevelForm = ({ data, onChange, touched = {} }) => {
  // Local UI state for raw, user-friendly inputs
  const [gradingSystem, setGradingSystem] = useState("60"); // "18" | "25" | "60"
  const [subjects, setSubjects] = useState(
    Array.isArray(data._uace_subject_grades)
      ? data._uace_subject_grades
      : ["", "", ""]
  ); // store as letter grades (A–E, O, F)

  // Ensure we expose raw subjects back up if you ever want to use them
  useEffect(() => {
    if (onChange) onChange("_uace_subject_grades", subjects);
  }, [subjects, onChange]);

  // Derived numbers
  const cleanSubjects = useMemo(
    () => subjects.filter((g) => typeof g === "string" && g.length > 0),
    [subjects]
  );

  const weights = useMemo(
    () => toWeights(cleanSubjects, gradingSystem),
    [cleanSubjects, gradingSystem]
  );

  const total = useMemo(() => weights.reduce((a, b) => a + b, 0), [weights]);
  const avg = useMemo(() => mean(weights), [weights]);
  const sd = useMemo(() => stddev(weights, avg), [weights, avg]);
  const dom = useMemo(() => dominant(weights), [weights]);

  // Backend-compatible definition:
  //   distinctions: weight >= 5
  //   weak grades : weight <= 3
  const countDistinctions = useMemo(
    () => weights.filter((w) => w >= 5).length,
    [weights]
  );
  const countWeak = useMemo(
    () => weights.filter((w) => w <= 3).length,
    [weights]
  );

  // Push computed features to parent model fields (keeps your original names)
  useEffect(() => {
    onChange?.("alevel_total_grade_weight", total);
    onChange?.("alevel_average_grade_weight", round(avg, 2));
    onChange?.("alevel_std_dev_grade_weight", round(sd, 3));
    onChange?.("alevel_dominant_grade_weight", dom);
    onChange?.("alevel_count_weak_grades", countWeak);

    // Optional extras (you use these in backend extraction)
    onChange?.("alevel_num_subjects", cleanSubjects.length);
    onChange?.("alevel_count_distinctions", countDistinctions);
  }, [
    total,
    avg,
    sd,
    dom,
    countWeak,
    countDistinctions,
    cleanSubjects.length,
    onChange,
  ]);

  // Progress for user feedback
  const progress = Math.min(
    100,
    Math.round((cleanSubjects.length / MAX_SUBJECTS) * 100)
  );

  // Field helpers
  const req = (name) => ({
    value: data[name] ?? "",
    error:
      touched[name] &&
      (data[name] === "" ||
        data[name] === null ||
        typeof data[name] === "undefined"),
    helperText:
      touched[name] &&
      (data[name] === "" ||
        data[name] === null ||
        typeof data[name] === "undefined")
        ? "Required"
        : " ",
  });

  // Handlers
  const setSubject = (idx, val) => {
    setSubjects((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const addSubject = () => {
    if (subjects.length < MAX_SUBJECTS) setSubjects((s) => [...s, ""]);
  };

  const removeSubject = (idx) => {
    setSubjects((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearSubjects = () => setSubjects(["", "", ""]);

  return (
    <div style={{ marginTop: "2rem" }}>
      <Typography variant="h6" gutterBottom>
        🎓 A‑Level (UACE) Results
      </Typography>

      <Typography variant="body2" color="text.secondary" gutterBottom>
        Enter your <strong>principal subject grades</strong> (A–E, O, F). You
        can add up to {MAX_SUBJECTS} subjects. The form automatically computes
        totals and averages for the selected grading system.
      </Typography>

      {/* Grading system selector */}
      <Grid container spacing={2} alignItems="center" sx={{ mb: 1 }}>
        <Grid item xs={12} sm="auto">
          <Typography variant="subtitle2">Grading System</Typography>
        </Grid>
        <Grid item xs={12} sm="auto">
          <ToggleButtonGroup
            value={gradingSystem}
            exclusive
            onChange={(_, val) => val && setGradingSystem(val)}
            size="small"
          >
            <ToggleButton value="18">Old (max 18)</ToggleButton>
            <ToggleButton value="25">Legacy (max 25)</ToggleButton>
            <ToggleButton value="60">Modern (max 60)</ToggleButton>
          </ToggleButtonGroup>
        </Grid>
        <Grid item xs>
          <Tooltip
            title="We convert letter grades to numeric weights to match the model.
Distinction=weight ≥ 5, Weak=weight ≤ 3 (aligned to backend logic)."
          >
            <InfoOutlinedIcon fontSize="small" color="action" />
          </Tooltip>
        </Grid>
      </Grid>

      {/* Year + GP */}
      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label="UACE Year"
            required
            {...req("uace_year_code")}
            onChange={(e) => onChange("uace_year_code", Number(e.target.value))}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Year when you sat UACE">
                    <InfoOutlinedIcon fontSize="small" color="action" />
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          >
            {years.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label="General Paper (Pass?)"
            value={data.general_paper ?? ""}
            onChange={(e) => onChange("general_paper", Number(e.target.value))}
            helperText="GP doesn’t affect principal totals but may be required by some programs."
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="GP/Subsidiaries are considered for eligibility; not added to principal points here.">
                    <InfoOutlinedIcon fontSize="small" color="action" />
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value={1}>Pass</MenuItem>
            <MenuItem value={0}>Fail / Not Taken</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      {/* Subjects */}
      <Grid container spacing={2}>
        {subjects.map((g, idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <TextField
              select
              fullWidth
              label={`Subject ${idx + 1} Grade`}
              value={g}
              onChange={(e) => setSubject(idx, e.target.value)}
              required={idx < MIN_SUBJECTS}
              helperText={idx < MIN_SUBJECTS ? "Required" : "Optional"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {subjects.length > MIN_SUBJECTS && (
                      <Tooltip title="Remove subject">
                        <IconButton
                          size="small"
                          onClick={() => removeSubject(idx)}
                          aria-label={`Remove subject ${idx + 1}`}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </InputAdornment>
                ),
              }}
            >
              {GRADE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        ))}

        {/* Actions */}
        <Grid
          item
          xs={12}
          sx={{ display: "flex", gap: 1, alignItems: "center" }}
        >
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addSubject}
            disabled={subjects.length >= MAX_SUBJECTS}
          >
            Add subject
          </Button>
          <Button
            variant="text"
            startIcon={<ClearIcon />}
            onClick={clearSubjects}
          >
            Clear all
          </Button>

          <div style={{ flex: 1 }} />

          {/* Progress */}
          <div style={{ minWidth: 220 }}>
            <Typography variant="caption" color="text.secondary">
              Subjects: {cleanSubjects.length}/{MAX_SUBJECTS}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ mt: 0.5, height: 8, borderRadius: 4 }}
            />
          </div>
        </Grid>
      </Grid>

      {/* Live computed summary */}
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Total Grade Weight"
            value={total}
            fullWidth
            InputProps={{ readOnly: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Average Grade Weight"
            value={round(avg, 2)}
            fullWidth
            InputProps={{ readOnly: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Std. Dev. Grade Weight"
            value={round(sd, 3)}
            fullWidth
            InputProps={{ readOnly: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Dominant Grade Weight"
            value={dom}
            fullWidth
            InputProps={{ readOnly: true }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Distinctions (weight ≥ 5)"
            value={countDistinctions}
            fullWidth
            InputProps={{ readOnly: true }}
            helperText="Count of A/B (and D if using /60 with weight ≥ 5)."
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Weak Grades (weight ≤ 3)"
            value={countWeak}
            fullWidth
            InputProps={{ readOnly: true }}
            helperText="e.g., E/O/F depending on system."
          />
        </Grid>
      </Grid>
    </div>
  );
};

export default ALevelForm;
