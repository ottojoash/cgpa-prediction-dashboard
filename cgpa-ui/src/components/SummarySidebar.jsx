// src/components/SummarySidebar.jsx
import React, { useMemo, useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Chip,
  Stack,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/**
 * Friendly value formatting for common coded fields
 */
const formatValue = (key, value) => {
  if (value === null || typeof value === "undefined" || value === "")
    return "—";

  switch (key) {
    case "gender":
      // 1 = Male, 0 = Female (your model)
      return value === 1 ? "Male" : value === 0 ? "Female" : value;

    case "marital_status":
      // 0 Single, 1 Married, 2 Other
      return value === 0
        ? "Single"
        : value === 1
        ? "Married"
        : value === 2
        ? "Other"
        : value;

    case "general_paper":
      return Number(value) === 1 ? "Passed" : "Not passed";

    case "is_national":
      return Number(value) === 1 ? "National" : "International";

    case "level": {
      // Sidebar displays the same mapping used in InstitutionalForm (level stored 0‑based)
      const UI_LEVEL_LABELS = {
        1: "Certificate / Diploma",
        2: "Bachelor’s",
        3: "Master’s",
        4: "PhD",
        5: "Short Courses",
        6: "Postgraduate Diploma",
        7: "University Bridging Year",
        8: "Unknown",
      };
      const uiVal = Number(value) + 1;
      return UI_LEVEL_LABELS[uiVal] || `Level ${uiVal}`;
    }

    default:
      return value;
  }
};

/**
 * Small row with tighter spacing and soft alternating background
 */
const Row = ({ label, value, muted = false }) => (
  <ListItem
    dense
    sx={{
      py: 0.5,
      px: 1,
      borderRadius: 1,
      "&:nth-of-type(odd)": { backgroundColor: "action.hover" },
    }}
  >
    <ListItemText
      primary={
        <Typography
          variant="caption"
          color={muted ? "text.disabled" : "text.secondary"}
          sx={{ textTransform: "none" }}
        >
          {label}
        </Typography>
      }
      secondary={
        <Typography variant="body2" sx={{ mt: 0.25 }}>
          {value}
        </Typography>
      }
    />
  </ListItem>
);

const ControlledSection = ({
  id,
  title,
  subtitle,
  expandedId,
  setExpandedId,
  children,
}) => {
  const expanded = expandedId === id;
  return (
    <Accordion
      disableGutters
      elevation={0}
      expanded={expanded}
      onChange={(_, isExp) => setExpandedId(isExp ? id : null)}
      sx={{ boxShadow: "none" }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="overline" sx={{ letterSpacing: 0.6 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Chip size="small" label={subtitle} variant="outlined" />
          ) : null}
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>{children}</AccordionDetails>
    </Accordion>
  );
};

const SummarySidebar = ({ data }) => {
  // --- Field groups (split raw vs derived for clarity) ---
  const demogRaw = [
    "marital_status",
    "gender",
    "age_at_entry",
    "year_of_entry_code",
  ];

  const olevelRaw = [
    "uce_year_code",
    "olevel_subjects",
    "uce_distinctions",
    "uce_credits",
  ];
  const olevelFeat = [
    "average_olevel_grade",
    "count_weak_grades_olevel",
    "std_dev_olevel_grade",
  ];

  const alevelRaw = ["uace_year_code", "general_paper"];
  const alevelFeat = [
    "alevel_average_grade_weight",
    "alevel_std_dev_grade_weight",
    "alevel_dominant_grade_weight",
    "alevel_count_weak_grades",
    "high_school_performance_variance",
    "high_school_performance_stability_index",
  ];

  const instRaw = ["level", "campus_id_code", "program_id_code", "is_national"];

  // --- Friendly field labels (left column) ---
  const LABEL = {
    // Demographics
    marital_status: "Marital status",
    gender: "Gender",
    age_at_entry: "Age at entry",
    year_of_entry_code: "Year of entry",

    // O‑Level raw
    uce_year_code: "UCE year",
    olevel_subjects: "O‑Level subjects (count)",
    uce_distinctions: "Distinctions (D1–D2 / A)",
    uce_credits: "Credits (C3–C6 / B/C)",

    // O‑Level features
    average_olevel_grade: "Avg O‑Level grade",
    count_weak_grades_olevel: "Weak grades (≥7)",
    std_dev_olevel_grade: "Std dev (O‑Level)",

    // A‑Level raw
    uace_year_code: "UACE year",
    general_paper: "General Paper",

    // A‑Level features
    alevel_average_grade_weight: "Avg grade weight",
    alevel_std_dev_grade_weight: "Std dev (A‑Level)",
    alevel_dominant_grade_weight: "Dominant grade weight",
    alevel_count_weak_grades: "Weak grades (D/E/F)",
    high_school_performance_variance: "HS performance variance",
    high_school_performance_stability_index: "HS stability index",

    // Institutional
    level: "Academic level",
    campus_id_code: "Campus (code)",
    program_id_code: "Program (code)",
    is_national: "Nationality",
  };

  // --- Profile completeness (simple: how many from the “important” subset are filled) ---
  const importantFields = [...demogRaw, ...olevelRaw, ...alevelRaw, ...instRaw];
  const { filledCount, totalCount } = useMemo(() => {
    let filled = 0;
    for (const k of importantFields) {
      const v = data?.[k];
      if (!(v === "" || v === null || typeof v === "undefined")) filled += 1;
    }
    return { filledCount: filled, totalCount: importantFields.length };
  }, [data]);
  const percent = Math.round((filledCount / totalCount) * 100);

  // --- Single‑expand accordion control ---
  const SECTION_ORDER = [
    "demographics",
    "olevel_raw",
    "olevel_feat",
    "alevel_raw",
    "alevel_feat",
    "institutional",
  ];
  const [expandedId, setExpandedId] = useState(SECTION_ORDER[0]);

  // Safety: if expandedId somehow becomes unknown (e.g., future edits), reset to first
  useEffect(() => {
    if (!SECTION_ORDER.includes(expandedId)) {
      setExpandedId(SECTION_ORDER[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedId]);

  return (
    <Paper
      sx={{
        p: 2,
        position: "sticky",
        top: 16,
        maxHeight: "calc(100vh - 32px)",
        overflow: "auto",
        borderRadius: 2,
        background:
          "linear-gradient(180deg, rgba(145,158,171,0.10) 0%, rgba(145,158,171,0.05) 100%)",
      }}
    >
      {/* Header + Progress */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 600 }}>
          Quick Review
        </Typography>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Profile completeness
          </Typography>
          <Chip
            size="small"
            label={`${filledCount}/${totalCount}`}
            variant="outlined"
          />
        </Stack>
        <LinearProgress
          variant="determinate"
          value={percent}
          sx={{
            height: 8,
            borderRadius: 999,
            "& .MuiLinearProgress-bar": { borderRadius: 999 },
          }}
        />
      </Box>

      <Divider sx={{ my: 1.5 }} />

      {/* Demographics */}
      <ControlledSection
        id="demographics"
        title="Demographics"
        expandedId={expandedId}
        setExpandedId={setExpandedId}
      >
        <List dense disablePadding>
          {demogRaw.map((k) => (
            <Row
              key={k}
              label={LABEL[k] || k}
              value={formatValue(k, data?.[k])}
            />
          ))}
        </List>
      </ControlledSection>

      <Divider sx={{ my: 1 }} />

      {/* O‑Level */}
      <ControlledSection
        id="olevel_raw"
        title="O‑Level"
        subtitle="Raw inputs"
        expandedId={expandedId}
        setExpandedId={setExpandedId}
      >
        <List dense disablePadding>
          {olevelRaw.map((k) => (
            <Row
              key={k}
              label={LABEL[k] || k}
              value={formatValue(k, data?.[k])}
            />
          ))}
        </List>
      </ControlledSection>

      <ControlledSection
        id="olevel_feat"
        title="O‑Level (Derived features)"
        expandedId={expandedId}
        setExpandedId={setExpandedId}
      >
        <List dense disablePadding>
          {olevelFeat.map((k) => (
            <Row
              key={k}
              label={LABEL[k] || k}
              value={formatValue(k, data?.[k])}
              muted
            />
          ))}
        </List>
      </ControlledSection>

      <Divider sx={{ my: 1 }} />

      {/* A‑Level */}
      <ControlledSection
        id="alevel_raw"
        title="A‑Level"
        subtitle="Raw inputs"
        expandedId={expandedId}
        setExpandedId={setExpandedId}
      >
        <List dense disablePadding>
          {alevelRaw.map((k) => (
            <Row
              key={k}
              label={LABEL[k] || k}
              value={formatValue(k, data?.[k])}
            />
          ))}
        </List>
      </ControlledSection>

      <ControlledSection
        id="alevel_feat"
        title="A‑Level (Derived features)"
        expandedId={expandedId}
        setExpandedId={setExpandedId}
      >
        <List dense disablePadding>
          {alevelFeat.map((k) => (
            <Row
              key={k}
              label={LABEL[k] || k}
              value={formatValue(k, data?.[k])}
              muted
            />
          ))}
        </List>
      </ControlledSection>

      <Divider sx={{ my: 1 }} />

      {/* Institutional */}
      <ControlledSection
        id="institutional"
        title="Institutional"
        expandedId={expandedId}
        setExpandedId={setExpandedId}
      >
        <List dense disablePadding>
          {instRaw.map((k) => (
            <Row
              key={k}
              label={LABEL[k] || k}
              value={formatValue(k, data?.[k])}
            />
          ))}
        </List>
      </ControlledSection>
    </Paper>
  );
};

export default SummarySidebar;
