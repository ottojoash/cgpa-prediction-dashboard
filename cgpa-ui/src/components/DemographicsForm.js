import React from "react";
import { TextField, Grid } from "@mui/material";

const DemographicsForm = ({ data, onChange }) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Age at Entry"
          variant="outlined"
          fullWidth
          value={data.age_at_entry}
          onChange={(e) => onChange("age_at_entry", e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Gender"
          variant="outlined"
          fullWidth
          value={data.gender}
          onChange={(e) => onChange("gender", e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Level"
          variant="outlined"
          fullWidth
          value={data.level}
          onChange={(e) => onChange("level", e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          label="Year of Entry Code"
          variant="outlined"
          fullWidth
          value={data.year_of_entry_code}
          onChange={(e) => onChange("year_of_entry_code", e.target.value)}
        />
      </Grid>
    </Grid>
  );
};

export default DemographicsForm;