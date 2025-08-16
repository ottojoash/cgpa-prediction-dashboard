// src/components/SectionCard.jsx
import React from "react";
import { Paper, Typography, Box } from "@mui/material";

const SectionCard = ({ title, subtitle, children, actions }) => (
  <Paper sx={{ p: 3, mb: 3 }}>
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6">{title}</Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
    <Box>{children}</Box>
    {actions && <Box sx={{ mt: 2 }}>{actions}</Box>}
  </Paper>
);

export default SectionCard;
