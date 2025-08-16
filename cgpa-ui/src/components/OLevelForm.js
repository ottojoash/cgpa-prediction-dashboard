// src/components/OLevelForm.jsx
import React from "react";
import { Grid, TextField, MenuItem, Typography } from "@mui/material";
const uceYears = Array.from({ length: 25 }, (_, i) => 2005 + i);

const OLevelForm = ({ data, onChange, touched = {} }) => {
  const req = (name) => ({
    value: data[name] ?? "",
    error: touched[name] && (data[name] === "" || data[name] === null),
    helperText:
      touched[name] && (data[name] === "" || data[name] === null)
        ? "Required"
        : " ",
  });

  const fields = [
    ["average_olevel_grade", "Average O-Level Grade", true],
    ["best_sum_out_of_six", "Best Sum of 6", true],
    ["best_sum_out_of_eight", "Best Sum of 8", true],
    ["best_sum_out_of_ten", "Best Sum of 10", true],
    ["count_weak_grades_olevel", "Count of Weak Grades", true],
    ["highest_olevel_grade", "Highest Grade", true],
    ["lowest_olevel_grade", "Lowest Grade", true],
    ["std_dev_olevel_grade", "Std Dev of Grades", true],
  ];

  return (
    <>
      <Typography variant="h6" gutterBottom>
        📘 O-Level Academic Details
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label="UCE Year"
            required
            {...req("uce_year_code")}
            value={data.uce_year_code || ""}
            onChange={(e) => onChange("uce_year_code", Number(e.target.value))}
          >
            {uceYears.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="UCE Credits"
            type="number"
            required
            {...req("uce_credits")}
            onChange={(e) => onChange("uce_credits", Number(e.target.value))}
          />
        </Grid>
        {fields.map(([field, label]) => (
          <Grid item xs={12} sm={6} key={field}>
            <TextField
              fullWidth
              label={label}
              type="number"
              required
              {...req(field)}
              onChange={(e) => onChange(field, parseFloat(e.target.value))}
            />
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default OLevelForm;
