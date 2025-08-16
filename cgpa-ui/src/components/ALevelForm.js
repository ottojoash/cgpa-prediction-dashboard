// src/components/ALevelForm.jsx
import React from "react";
import { Grid, TextField, Typography, MenuItem } from "@mui/material";

const ALevelForm = ({ data, onChange, touched = {} }) => {
  const req = (name) => ({
    value: data[name] ?? "",
    error: touched[name] && (data[name] === "" || data[name] === null),
    helperText:
      touched[name] && (data[name] === "" || data[name] === null)
        ? "Required"
        : " ",
  });

  return (
    <div style={{ marginTop: "2rem" }}>
      <Typography variant="h6" gutterBottom>
        🏫 A-Level (UACE) Information
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="UACE Year Code"
            type="number"
            required
            {...req("uace_year_code")}
            onChange={(e) => onChange("uace_year_code", Number(e.target.value))}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label="General Paper (0 = No, 1 = Yes)"
            required
            {...req("general_paper")}
            onChange={(e) => onChange("general_paper", Number(e.target.value))}
          >
            <MenuItem value={1}>Yes</MenuItem>
            <MenuItem value={0}>No</MenuItem>
          </TextField>
        </Grid>

        {[
          ["alevel_average_grade_weight", "Average Grade Weight"],
          ["alevel_total_grade_weight", "Total Grade Weight"],
          ["alevel_std_dev_grade_weight", "Std. Dev. Grade Weight"],
          ["alevel_dominant_grade_weight", "Dominant Grade Weight"],
          ["alevel_count_weak_grades", "Count of Weak Grades"],
          [
            "high_school_performance_variance",
            "High School Performance Variance",
          ],
          [
            "high_school_performance_stability_index",
            "Performance Stability Index",
          ],
        ].map(([k, label]) => (
          <Grid item xs={12} sm={6} key={k}>
            <TextField
              fullWidth
              label={label}
              type="number"
              required
              {...req(k)}
              onChange={(e) => onChange(k, parseFloat(e.target.value))}
            />
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default ALevelForm;
