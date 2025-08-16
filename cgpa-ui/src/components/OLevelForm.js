import React from "react";
import { TextField, Grid } from "@mui/material";

const OLevelForm = ({ data, onChange }) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          label="UCE Year Code"
          value={data.uce_year_code}
          onChange={(e) => onChange("uce_year_code", e.target.value)}
          fullWidth
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="UCE Credits"
          value={data.uce_credits}
          onChange={(e) => onChange("uce_credits", e.target.value)}
          fullWidth
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Average O-Level Grade"
          value={data.average_olevel_grade}
          onChange={(e) => onChange("average_olevel_grade", e.target.value)}
          fullWidth
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Best Sum Out of Six"
          value={data.best_sum_out_of_six}
          onChange={(e) => onChange("best_sum_out_of_six", e.target.value)}
          fullWidth
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Best Sum Out of Eight"
          value={data.best_sum_out_of_eight}
          onChange={(e) => onChange("best_sum_out_of_eight", e.target.value)}
          fullWidth
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Best Sum Out of Ten"
          value={data.best_sum_out_of_ten}
          onChange={(e) => onChange("best_sum_out_of_ten", e.target.value)}
          fullWidth
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Count of Weak Grades O-Level"
          value={data.count_weak_grades_olevel}
          onChange={(e) => onChange("count_weak_grades_olevel", e.target.value)}
          fullWidth
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Highest O-Level Grade"
          value={data.highest_olevel_grade}
          onChange={(e) => onChange("highest_olevel_grade", e.target.value)}
          fullWidth
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Lowest O-Level Grade"
          value={data.lowest_olevel_grade}
          onChange={(e) => onChange("lowest_olevel_grade", e.target.value)}
          fullWidth
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Standard Deviation O-Level Grade"
          value={data.std_dev_olevel_grade}
          onChange={(e) => onChange("std_dev_olevel_grade", e.target.value)}
          fullWidth
        />
      </Grid>
    </Grid>
  );
};

export default OLevelForm;