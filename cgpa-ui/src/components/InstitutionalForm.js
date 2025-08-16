// src/components/InstitutionalForm.jsx
import React from "react";
import { Grid, TextField, MenuItem, Typography } from "@mui/material";

const campusOptions = [
  { label: "Main Campus", value: 0 },
  { label: "Kampala Campus", value: 1 },
  { label: "Mbale Campus", value: 2 },
];

const programOptions = [
  { label: "Bachelor of Information Technology", value: 101 },
  { label: "Bachelor of Business Administration", value: 102 },
  { label: "Bachelor of Education", value: 103 },
];

const curriculumOptions = [
  { label: "IT Curriculum 2020", value: 204 },
  { label: "BBA Curriculum 2019", value: 205 },
  { label: "Education Curriculum 2021", value: 206 },
];

function InstitutionalForm({ data, onChange, touched = {} }) {
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
        🏫 Institutional Placement
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label="Campus"
            required
            {...req("campus_id_code")}
            onChange={(e) => onChange("campus_id_code", Number(e.target.value))}
          >
            {campusOptions.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label="Program"
            required
            {...req("program_id_code")}
            onChange={(e) =>
              onChange("program_id_code", Number(e.target.value))
            }
          >
            {programOptions.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label="Curriculum"
            required
            {...req("curriculum_id_code")}
            onChange={(e) =>
              onChange("curriculum_id_code", Number(e.target.value))
            }
          >
            {curriculumOptions.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
    </div>
  );
}

export default InstitutionalForm;
