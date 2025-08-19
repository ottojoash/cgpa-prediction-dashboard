// src/components/OLevelForm.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  Grid,
  TextField,
  MenuItem,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  Tooltip,
  IconButton,
  Box,
  Chip,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ClearIcon from "@mui/icons-material/Clear";

const MIN_SUBJECTS = 6;
const MAX_SUBJECTS = 10;

// Build UCE year options dynamically (2005 → next year)
const buildYears = () => {
  const start = 2005;
  const end = new Date().getFullYear() + 1;
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};
const UCE_YEARS = buildYears();

/**
 * Letter grading → numeric representative value
 * (Used only when the user chooses "Letters".)
 * Mapping aligns to the 2024 guidance:
 *   A ≈ {D1,D2} → 2.0
 *   B ≈ {C3,C4} → 4.0
 *   C ≈ {C5,C6} → 6.0
 *   D ≈ {P7,P8} → 7.5
 *   E ≈ {E8}    → 8.5
 *   F ≈ {F9}    → 9.0
 */
const LETTER_TO_NUMERIC = {
  A: 2,
  B: 4,
  C: 6,
  D: 7.5,
  E: 8.5,
  F: 9,
};

const OLevelForm = ({ data, onChange, touched = {} }) => {
  // "numeric" (1–9) is recommended for precise calculations
  const [gradingMode, setGradingMode] = useState("numeric"); // "numeric" | "letters"

  // Keep all bucket counts in local UI state, then we derive features -> push to parent
  const [subjectCount, setSubjectCount] = useState(
    Number.isFinite(Number(data.olevel_subjects))
      ? Number(data.olevel_subjects)
      : ""
  );

  // Numeric 1..9 counts
  const [numCounts, setNumCounts] = useState(
    // default zeros
    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 }
  );

  // Letter counts A..F
  const [letCounts, setLetCounts] = useState({
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    E: 0,
    F: 0,
  });

  // ---------------------------
  // Helpers
  // ---------------------------
  const cleanInt = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  };

  const sumValues = (obj) => Object.values(obj).reduce((a, b) => a + b, 0);

  const numericVectorFromUI = useMemo(() => {
    if (!subjectCount || subjectCount < MIN_SUBJECTS) return [];
    if (gradingMode === "numeric") {
      // expand into grades (e.g., {1:2, 2:1} -> [1,1,2])
      const out = [];
      Object.entries(numCounts).forEach(([g, c]) => {
        const grade = Number(g);
        const count = cleanInt(c);
        for (let i = 0; i < count; i++) out.push(grade);
      });
      return out;
    } else {
      const out = [];
      Object.entries(letCounts).forEach(([L, c]) => {
        const grade = LETTER_TO_NUMERIC[L]; // representative numeric
        const count = cleanInt(c);
        for (let i = 0; i < count; i++) out.push(grade);
      });
      return out;
    }
  }, [gradingMode, numCounts, letCounts, subjectCount]);

  const totalEntered = useMemo(
    () =>
      gradingMode === "numeric" ? sumValues(numCounts) : sumValues(letCounts),
    [gradingMode, numCounts, letCounts]
  );

  // Derived metrics exactly as in your Java logic
  const derived = useMemo(() => {
    const grades = numericVectorFromUI;
    const n = grades.length;

    if (
      !subjectCount ||
      subjectCount < MIN_SUBJECTS ||
      subjectCount > MAX_SUBJECTS ||
      n !== subjectCount
    ) {
      return {
        valid: false,
        uce_distinctions: "",
        uce_credits: "",
        count_weak: "",
        avg: "",
        sd: "",
      };
    }

    // Distinctions: grade <= 2
    const distinctions = grades.filter((g) => g <= 2).length;

    // Credits: grades 3..6 inclusive (covers B & C, and numeric C3..C6)
    const credits = grades.filter((g) => g >= 3 && g <= 6).length;

    // Weak grades: grade >= 6 (C6, 7, 8, 9)
    const weak = grades.filter((g) => g >= 6).length;

    // Average
    const sum = grades.reduce((a, b) => a + b, 0);
    const avg = n ? sum / n : 0;

    // Population standard deviation (same spirit as backend util)
    const variance =
      n > 0 ? grades.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / n : 0;
    const sd = Math.sqrt(variance);

    return {
      valid: true,
      uce_distinctions: distinctions,
      uce_credits: credits,
      count_weak: weak,
      avg: Number(avg.toFixed(2)),
      sd: Number(sd.toFixed(3)),
    };
  }, [numericVectorFromUI, subjectCount]);

  // Push derived values to parent (only when valid)
  useEffect(() => {
    // year always sync as number if possible
    if (data.uce_year_code && !Number.isFinite(Number(data.uce_year_code))) {
      onChange("uce_year_code", "");
    }

    onChange("olevel_subjects", subjectCount || "");

    if (derived.valid) {
      onChange("uce_distinctions", derived.uce_distinctions);
      onChange("uce_credits", derived.uce_credits);
      onChange("count_weak_grades_olevel", derived.count_weak);
      onChange("average_olevel_grade", derived.avg);
      onChange("std_dev_olevel_grade", derived.sd);
    } else {
      onChange("uce_distinctions", "");
      onChange("uce_credits", "");
      onChange("count_weak_grades_olevel", "");
      onChange("average_olevel_grade", "");
      onChange("std_dev_olevel_grade", "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectCount, derived]);

  // ---------------------------
  // Render
  // ---------------------------
  const req = (name) => ({
    value: data[name] ?? "",
    error: touched[name] && (data[name] === "" || data[name] === null),
    helperText:
      touched[name] && (data[name] === "" || data[name] === null)
        ? "Required"
        : " ",
  });

  const subjectCountError =
    subjectCount !== "" &&
    (subjectCount < MIN_SUBJECTS ||
      subjectCount > MAX_SUBJECTS ||
      (totalEntered !== 0 && totalEntered !== Number(subjectCount)));

  const subjectHelper = !subjectCount
    ? `Enter number of subjects (${MIN_SUBJECTS}–${MAX_SUBJECTS})`
    : subjectCountError
    ? totalEntered !== 0 && totalEntered !== Number(subjectCount)
      ? `Your grade counts add up to ${totalEntered}, but subjects = ${subjectCount}`
      : `Subjects must be between ${MIN_SUBJECTS} and ${MAX_SUBJECTS}`
    : `Great! Now enter how many subjects fall in each grade.`;

  return (
    <div style={{ marginTop: "2rem" }}>
      <Typography variant="h6" gutterBottom>
        📘 O‑Level (UCE) Academic Details
      </Typography>

      <Grid container spacing={2}>
        {/* UCE Year */}
        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label="UCE Year"
            required
            {...req("uce_year_code")}
            value={data.uce_year_code ?? ""}
            onChange={(e) => onChange("uce_year_code", Number(e.target.value))}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Year you sat UCE">
                    <InfoOutlinedIcon fontSize="small" color="action" />
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          >
            {UCE_YEARS.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Subjects */}
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Number of UCE Subjects"
            type="number"
            value={subjectCount}
            onChange={(e) =>
              setSubjectCount(parseInt(e.target.value || "0", 10))
            }
            inputProps={{ min: MIN_SUBJECTS, max: MAX_SUBJECTS }}
            required
            error={subjectCountError}
            helperText={subjectHelper}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Most students have 8–10; minimum accepted is 6.">
                    <InfoOutlinedIcon fontSize="small" color="action" />
                  </Tooltip>
                  {subjectCount ? (
                    <IconButton
                      aria-label="Clear subjects"
                      size="small"
                      onClick={() => {
                        setSubjectCount("");
                        setNumCounts({
                          1: 0,
                          2: 0,
                          3: 0,
                          4: 0,
                          5: 0,
                          6: 0,
                          7: 0,
                          8: 0,
                          9: 0,
                        });
                        setLetCounts({ A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 });
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  ) : null}
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Grading mode */}
        <Grid item xs={12}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Typography variant="subtitle2">Grading style:</Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={gradingMode}
              onChange={(_, v) => v && setGradingMode(v)}
            >
              <ToggleButton value="numeric">Numeric (1–9)</ToggleButton>
              <ToggleButton value="letters">Letters (A–F)</ToggleButton>
            </ToggleButtonGroup>
            <Tooltip
              title={
                gradingMode === "numeric"
                  ? "Enter how many subjects scored grade 1, 2, … 9."
                  : "Enter how many subjects scored A, B, C, D, E or F. We use A≈2, B≈4, C≈6, D≈7.5, E≈8.5, F=9 to compute averages."
              }
            >
              <InfoOutlinedIcon fontSize="small" color="action" />
            </Tooltip>
            <Chip
              size="small"
              variant="outlined"
              label={`Entered: ${totalEntered || 0} / ${subjectCount || 0}`}
            />
          </Box>
        </Grid>

        {/* Buckets */}
        {gradingMode === "numeric" ? (
          <>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
              <Grid item xs={12} sm={4} md={3} key={`n-${g}`}>
                <TextField
                  fullWidth
                  label={`Count with Grade ${g}`}
                  type="number"
                  value={numCounts[g]}
                  onChange={(e) =>
                    setNumCounts((s) => ({
                      ...s,
                      [g]: cleanInt(e.target.value),
                    }))
                  }
                  inputProps={{ min: 0 }}
                />
              </Grid>
            ))}
          </>
        ) : (
          <>
            {["A", "B", "C", "D", "E", "F"].map((L) => (
              <Grid item xs={12} sm={4} md={3} key={`l-${L}`}>
                <TextField
                  fullWidth
                  label={`Count with ${L}`}
                  type="number"
                  value={letCounts[L]}
                  onChange={(e) =>
                    setLetCounts((s) => ({
                      ...s,
                      [L]: cleanInt(e.target.value),
                    }))
                  }
                  inputProps={{ min: 0 }}
                  helperText={
                    L === "A"
                      ? "≈ D1 or D2"
                      : L === "B"
                      ? "≈ C3 or C4"
                      : L === "C"
                      ? "≈ C5 or C6"
                      : L === "D"
                      ? "≈ P7 or P8"
                      : L === "E"
                      ? "≈ E8"
                      : "F9"
                  }
                />
              </Grid>
            ))}
          </>
        )}

        {/* Read‑only derived features (these map 1‑to‑1 with your model fields) */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Derived features (auto‑calculated from your entries)
          </Typography>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="UCE Distinctions (≤ D2 / grade ≤ 2)"
            value={data.uce_distinctions ?? ""}
            InputProps={{ readOnly: true }}
            helperText="Calculated from your grade counts"
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="UCE Credits (B–C / grades 3–6)"
            value={data.uce_credits ?? ""}
            InputProps={{ readOnly: true }}
            helperText="Calculated from your grade counts"
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Weak Grades (≥ 6)"
            value={data.count_weak_grades_olevel ?? ""}
            InputProps={{ readOnly: true }}
            helperText="Includes C6, 7, 8, 9"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Average O‑Level Grade"
            value={data.average_olevel_grade ?? ""}
            InputProps={{ readOnly: true }}
            helperText="Rounded to 2 dp"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Std Dev of O‑Level Grades"
            value={data.std_dev_olevel_grade ?? ""}
            InputProps={{ readOnly: true }}
            helperText="Rounded to 3 dp"
          />
        </Grid>
      </Grid>
    </div>
  );
};

export default OLevelForm;
