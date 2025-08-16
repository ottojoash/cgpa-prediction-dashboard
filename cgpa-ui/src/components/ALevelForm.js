import React from "react";
import { TextField, Grid } from "@mui/material";

const ALevelForm = ({ data, onChange }) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          label="A-Level Average Grade Weight"
          variant="outlined"
          fullWidth
          value={data.alevel_average_grade_weight}
          onChange={(e) => onChange("alevel_average_grade_weight", e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="A-Level Total Grade Weight"
          variant="outlined"
          fullWidth
          value={data.alevel_total_grade_weight}
          onChange={(e) => onChange("alevel_total_grade_weight", e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="A-Level Standard Deviation Grade Weight"
          variant="outlined"
          fullWidth
          value={data.alevel_std_dev_grade_weight}
          onChange={(e) => onChange("alevel_std_dev_grade_weight", e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="A-Level Dominant Grade Weight"
          variant="outlined"
          fullWidth
          value={data.alevel_dominant_grade_weight}
          onChange={(e) => onChange("alevel_dominant_grade_weight", e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="A-Level Count of Weak Grades"
          variant="outlined"
          fullWidth
          value={data.alevel_count_weak_grades}
          onChange={(e) => onChange("alevel_count_weak_grades", e.target.value)}
        />
      </Grid>
    </Grid>
  );
};

export default ALevelForm;