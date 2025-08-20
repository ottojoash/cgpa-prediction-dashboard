// src/components/DemographicsForm.jsx
import React, { useMemo } from "react";
import {
  Grid,
  TextField,
  MenuItem,
  Typography,
  InputAdornment,
  Tooltip,
  IconButton,
  Paper,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ClearIcon from "@mui/icons-material/Clear";

/**
 * CONFIG:
 * - DATASET_MIN_YEAR: lower bound for "Year of Entry" (tweak if your dataset starts later)
 * - YEAR_FUTURE_BUFFER: allow selecting up to N years beyond the current calendar year
 *   (often 1 is helpful for upcoming intakes)
 */
const DATASET_MIN_YEAR = 2000;
const YEAR_FUTURE_BUFFER = 1;

// Small helper: coerce to number or empty string (so TextField remains controlled)
const numOrEmpty = (v) =>
  v === "" || v === null || typeof v === "undefined" ? "" : Number(v);

const DemographicsForm = ({ data, onChange, touched = {} }) => {
  const currentYear = new Date().getFullYear();
  const maxYear = currentYear + YEAR_FUTURE_BUFFER;

  // Build a descending list of years (easier to pick recent entries)
  const yearOptions = useMemo(() => {
    const start = Math.max(1900, DATASET_MIN_YEAR); // hard guard
    const end = Math.max(start, maxYear);
    const years = [];
    for (let y = end; y >= start; y--) years.push(y);
    return years;
  }, [maxYear]);

  // Reasonable bounds for "Age at Entry" (adjust if you prefer)
  const MIN_AGE = 14;
  const MAX_AGE = 70;

  const field = (name) => ({
    value:
      name === "gender" ||
      name === "marital_status" ||
      name === "year_of_entry_code" ||
      name === "age_at_entry"
        ? numOrEmpty(data[name])
        : data[name] ?? "",
    error:
      touched[name] &&
      (data[name] === "" ||
        data[name] === null ||
        typeof data[name] === "undefined"),
    helperText:
      touched[name] &&
      (data[name] === "" ||
        data[name] === null ||
        typeof data[name] === "undefined")
        ? "Required"
        : " ",
  });

  const handleNumber = (key) => (e) => {
    const raw = e.target.value;
    // Allow the user to clear the field (empty string)
    if (raw === "") return onChange(key, "");
    const parsed = Number(raw);
    onChange(key, Number.isFinite(parsed) ? parsed : "");
  };

  const clear = (key) => () => onChange(key, "");

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 1,
          bgcolor: "background.paper",
          borderColor: "divider",
        }}
      >
        <Typography variant="body2" color="text.secondary" gutterBottom margin={2}>
          We use these details for prediction and reporting. They won’t restrict
          your program options.
          <br />
        </Typography>

        <Grid container spacing={2}>
          {/* Marital Status: 0=Single, 1=Married, 2=Other */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Marital Status"
              placeholder="Select marital status"
              inputProps={{ "aria-label": "Marital Status" }}
              value={numOrEmpty(data.marital_status)}
              onChange={(e) =>
                onChange("marital_status", Number(e.target.value))
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {data.marital_status !== "" &&
                      data.marital_status !== null &&
                      typeof data.marital_status !== "undefined" && (
                        <IconButton
                          aria-label="Clear marital status"
                          size="small"
                          onClick={clear("marital_status")}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )}
                    <Tooltip title="Used for aggregated insights only.">
                      <InfoOutlinedIcon fontSize="small" color="action" />
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value={0}>Single</MenuItem>
              <MenuItem value={1}>Married</MenuItem>
              <MenuItem value={2}>Other</MenuItem>
            </TextField>
          </Grid>

          {/* Gender: 1=Male, 0=Female (matches notebook encoding) */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              required
              label="Gender"
              placeholder="Select gender"
              inputProps={{ "aria-label": "Gender" }}
              {...field("gender")}
              onChange={(e) => onChange("gender", Number(e.target.value))}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {data.gender !== "" &&
                      data.gender !== null &&
                      typeof data.gender !== "undefined" && (
                        <IconButton
                          aria-label="Clear gender"
                          size="small"
                          onClick={clear("gender")}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )}
                    <Tooltip title="Encoding: Male=1, Female=0 (as used in the model).">
                      <InfoOutlinedIcon fontSize="small" color="action" />
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value={1}>Male</MenuItem>
              <MenuItem value={0}>Female</MenuItem>
            </TextField>
          </Grid>

          {/* Age at Entry (number with guardrails) */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              type="number"
              label="Age at Entry"
              placeholder={`e.g., 20 (min ${MIN_AGE}, max ${MAX_AGE})`}
              inputProps={{
                "aria-label": "Age at Entry",
                min: MIN_AGE,
                max: MAX_AGE,
                step: 1,
                inputMode: "numeric",
              }}
              {...field("age_at_entry")}
              onChange={handleNumber("age_at_entry")}
              helperText={
                field("age_at_entry").error
                  ? field("age_at_entry").helperText
                  : `Allowed range: ${MIN_AGE}–${MAX_AGE}`
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {data.age_at_entry !== "" &&
                      data.age_at_entry !== null &&
                      typeof data.age_at_entry !== "undefined" && (
                        <IconButton
                          aria-label="Clear age"
                          size="small"
                          onClick={clear("age_at_entry")}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )}
                    <Tooltip title="Age when you joined the program.">
                      <InfoOutlinedIcon fontSize="small" color="action" />
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Year of Entry (select, constrained) */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              required
              label="Year of Entry"
              placeholder="Select year"
              inputProps={{ "aria-label": "Year of Entry" }}
              {...field("year_of_entry_code")}
              onChange={handleNumber("year_of_entry_code")}
              helperText={
                field("year_of_entry_code").error
                  ? field("year_of_entry_code").helperText
                  : `Choose between ${DATASET_MIN_YEAR} and ${maxYear}`
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {data.year_of_entry_code !== "" &&
                      data.year_of_entry_code !== null &&
                      typeof data.year_of_entry_code !== "undefined" && (
                        <IconButton
                          aria-label="Clear year"
                          size="small"
                          onClick={clear("year_of_entry_code")}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )}
                    <Tooltip title="Year you joined the university (not graduation year).">
                      <InfoOutlinedIcon fontSize="small" color="action" />
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            >
              {yearOptions.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
              {yearOptions.length === 0 && (
                <MenuItem disabled value="">
                  No years available
                </MenuItem>
              )}
            </TextField>
          </Grid>
        </Grid>
      </Paper>
    </>
  );
};

export default DemographicsForm;
