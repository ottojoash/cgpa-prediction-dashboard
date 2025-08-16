// src/components/DemographicsForm.jsx
import React from "react";
import { Grid, TextField, MenuItem, Typography } from "@mui/material";

const DemographicsForm = ({ data, onChange, touched = {} }) => {
  const field = (name) => ({
    value: data[name] ?? "",
    onChange: (e) => onChange(name, e.target.value),
    error: touched[name] && (data[name] === "" || data[name] === null),
    helperText:
      touched[name] && (data[name] === "" || data[name] === null)
        ? "Required"
        : " ",
  });

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Demographic Details
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            {...field("age_at_entry")}
            label="Age at Entry"
            type="number"
            fullWidth
            required
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            {...field("gender")}
            label="Gender"
            fullWidth
            required
            onChange={(e) => onChange("gender", Number(e.target.value))}
          >
            <MenuItem value={1}>Male</MenuItem>
            <MenuItem value={0}>Female</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            {...field("level")}
            label="Level"
            fullWidth
            required
            onChange={(e) => onChange("level", Number(e.target.value))}
          >
            <MenuItem value={0}>Certificate</MenuItem>
            <MenuItem value={1}>Diploma</MenuItem>
            <MenuItem value={2}>Undergraduate</MenuItem>
            <MenuItem value={3}>Postgraduate</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            {...field("year_of_entry_code")}
            label="Year of Entry"
            type="number"
            fullWidth
            required
          />
        </Grid>
      </Grid>
    </>
  );
};

export default DemographicsForm;
