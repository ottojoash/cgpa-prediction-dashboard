import React from "react";
import { TextField, Grid } from "@mui/material";

const InstitutionalForm = ({ data, onChange }) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          label="Campus ID Code"
          value={data.campus_id_code}
          onChange={(e) => onChange("campus_id_code", e.target.value)}
          fullWidth
          variant="outlined"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Program ID Code"
          value={data.program_id_code}
          onChange={(e) => onChange("program_id_code", e.target.value)}
          fullWidth
          variant="outlined"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Curriculum ID Code"
          value={data.curriculum_id_code}
          onChange={(e) => onChange("curriculum_id_code", e.target.value)}
          fullWidth
          variant="outlined"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="High School Performance Variance"
          value={data.high_school_performance_variance}
          onChange={(e) => onChange("high_school_performance_variance", e.target.value)}
          fullWidth
          variant="outlined"
          type="number"
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="High School Performance Stability Index"
          value={data.high_school_performance_stability_index}
          onChange={(e) => onChange("high_school_performance_stability_index", e.target.value)}
          fullWidth
          variant="outlined"
          type="number"
        />
      </Grid>
    </Grid>
  );
};

export default InstitutionalForm;