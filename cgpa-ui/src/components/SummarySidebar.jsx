// src/components/SummarySidebar.jsx
import React from "react";
import {
  Paper,
  List,
  ListItem,
  ListItemText,
  Typography,
  Divider,
} from "@mui/material";

const Row = ({ label, value }) => (
  <ListItem dense sx={{ py: 0.5 }}>
    <ListItemText
      primary={
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      }
      secondary={<Typography variant="body1">{value ?? "—"}</Typography>}
    />
  </ListItem>
);

const SummarySidebar = ({ data }) => {
  const demog = [
    "level",
    "marital_status",
    "gender",
    "age_at_entry",
    "year_of_entry_code",
  ];
  const olevel = [
    "uce_year_code",
    "olevel_subjects",
    "uce_distinctions",
    "uce_credits",
    "average_olevel_grade",
    "count_weak_grades_olevel",
    "std_dev_olevel_grade",
  ];
  const alevel = [
    "uace_year_code",
    "general_paper",
    "alevel_average_grade_weight",
    "alevel_total_grade_weight",
    "alevel_std_dev_grade_weight",
    "alevel_dominant_grade_weight",
    "alevel_count_weak_grades",
    "high_school_performance_variance",
    "high_school_performance_stability_index",
  ];
  const inst = ["campus_id_code", "program_id_code", "curriculum_id_code"];

  return (
    <Paper
      sx={{
        p: 2,
        position: "sticky",
        top: 16,
        maxHeight: "calc(100vh - 32px)",
        overflow: "auto",
      }}
    >
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Quick Review
      </Typography>
      <List dense>
        <Typography variant="overline">Demographics</Typography>
        {demog.map((k) => (
          <Row key={k} label={k} value={data[k]} />
        ))}
        <Divider sx={{ my: 1.5 }} />
        <Typography variant="overline">O-Level</Typography>
        {olevel.map((k) => (
          <Row key={k} label={k} value={data[k]} />
        ))}
        <Divider sx={{ my: 1.5 }} />
        <Typography variant="overline">A-Level</Typography>
        {alevel.map((k) => (
          <Row key={k} label={k} value={data[k]} />
        ))}
        <Divider sx={{ my: 1.5 }} />
        <Typography variant="overline">Institutional</Typography>
        {inst.map((k) => (
          <Row key={k} label={k} value={data[k]} />
        ))}
      </List>
    </Paper>
  );
};

export default SummarySidebar;
