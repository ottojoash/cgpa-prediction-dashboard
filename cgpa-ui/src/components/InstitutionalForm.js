// src/components/InstitutionalForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Grid,
  TextField,
  MenuItem,
  Typography,
  CircularProgress,
  IconButton,
  InputAdornment,
  Tooltip,
  Chip,
  Box,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SearchIcon from "@mui/icons-material/Search";

// UI labels are 1-based for readability.
// We store 0-based in data.level (for the model), so convert UI->model by subtracting 1,
// and show model->UI by adding 1.
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

function InstitutionalForm({ data, onChange, touched = {} }) {
  const [campusOptions, setCampusOptions] = useState([]);
  const [programRows, setProgramRows] = useState([]); // { campus_id_code, level_code(0-based), program_core_id, program_id_code, program_name }
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // UI-only filter to help users find a program quickly (no API changes)
  const [programFilter, setProgramFilter] = useState("");

  // ---- Small helpers
  const req = (name) => ({
    // keep storing 0-based in data.level for the model
    value:
      name === "level"
        ? typeof data.level === "number"
          ? data.level + 1 // display as 1-based
          : ""
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

  const parseCSV = (text) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const header = lines[0].split(",").map((s) => s.trim());
    return lines.slice(1).map((line) => {
      const cols = line.split(",").map((s) => s.trim());
      const obj = {};
      header.forEach((h, i) => (obj[h] = cols[i]));
      return obj;
    });
  };

  // ---- Load lookups from /public/lookups
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");

    (async () => {
      try {
        // campuses.csv
        const cRes = await fetch("/lookups/campuses.csv");
        if (!cRes.ok) throw new Error("campuses.csv not found");
        const cTxt = await cRes.text();
        const cRows = parseCSV(cTxt);
        const campuses = cRows
          .map((r) => ({
            label: (r.campus_name || "").trim(),
            value: Number(r.campus_id_code),
          }))
          .filter((o) => o.label && o.label !== "" && Number.isFinite(o.value))
          .sort((a, b) => a.label.localeCompare(b.label));

        // programs_by_campus.csv (level_code is 0-based)
        const pRes = await fetch("/lookups/programs_by_campus.csv");
        if (!pRes.ok) throw new Error("programs_by_campus.csv not found");
        const pTxt = await pRes.text();
        const pRows = parseCSV(pTxt)
          .map((r) => ({
            campus_id_code: Number(r.campus_id_code),
            level_code: Number(r.level_code), // 0-based in CSV
            program_core_id: Number(r.program_core_id),
            program_id_code: Number(r.program_id_code),
            program_name: (r.program_name || "").trim(),
          }))
          .filter(
            (r) =>
              r.program_name !== "" &&
              Number.isFinite(r.program_id_code) &&
              Number.isFinite(r.campus_id_code) &&
              Number.isFinite(r.level_code) &&
              Number.isFinite(r.program_core_id)
          );

        if (!cancelled) {
          setCampusOptions(campuses);
          setProgramRows(pRows);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            "We couldn’t load the campus/program lists. Please check that both files exist: /public/lookups/campuses.csv and /public/lookups/programs_by_campus.csv."
          );
          setCampusOptions([]);
          setProgramRows([]);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---- State derivations
  const campusChosen =
    typeof data.campus_id_code !== "undefined" &&
    data.campus_id_code !== "" &&
    data.campus_id_code !== null;

  const levelChosen =
    typeof data.level !== "undefined" &&
    data.level !== "" &&
    data.level !== null &&
    Number.isFinite(Number(data.level));

  // Level options for chosen campus (build from CSV 0-based → map to UI 1-based)
  const levelOptions = useMemo(() => {
    if (!campusChosen) return [];
    const campusId = Number(data.campus_id_code);
    const codes0 = new Set(
      programRows
        .filter((r) => r.campus_id_code === campusId)
        .map((r) => r.level_code)
        .filter((v) => Number.isFinite(v))
    );
    // sort ascending; map to UI labels (1-based)
    const opts = Array.from(codes0)
      .sort((a, b) => a - b)
      .map((code0) => {
        const uiVal = code0 + 1;
        return {
          value: uiVal,
          label: UI_LEVEL_LABELS[uiVal] || `Level ${uiVal}`,
          code0,
        };
      });
    return opts;
  }, [programRows, data.campus_id_code, campusChosen]);

  // Program options filtered by campus + internal level (UI - 1)
  const programOptions = useMemo(() => {
    if (!campusChosen || !levelChosen) return [];
    const campusId = Number(data.campus_id_code);
    const needLevel0 = Number(data.level); // already 0-based internally

    const rows = programRows.filter(
      (r) => r.campus_id_code === campusId && r.level_code === needLevel0
    );

    // simple client-side search filter
    const needle = programFilter.trim().toLowerCase();
    const filtered = needle
      ? rows.filter((r) => r.program_name.toLowerCase().includes(needle))
      : rows;

    // dedupe by program_core_id (already handled in CSV, but keep it just in case)
    const seenCore = new Set();
    const opts = [];
    for (const r of filtered) {
      if (!seenCore.has(r.program_core_id) && r.program_name) {
        seenCore.add(r.program_core_id);
        opts.push({ value: r.program_id_code, label: r.program_name });
      }
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label));
  }, [
    programRows,
    campusChosen,
    levelChosen,
    data.campus_id_code,
    data.level,
    programFilter,
  ]);

  // Small counters for hints
  const levelCountForCampus = levelOptions.length;
  const programCountForSelection = programOptions.length;

  // ---- Rendering
  if (loading) {
    return (
      <div style={{ marginTop: "2rem" }}>
        <Typography variant="h6" gutterBottom>
          🏫 Institutional Placement
        </Typography>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CircularProgress size={20} />
          <span>Loading campus & program lists…</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "2rem" }}>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend style={{ position: "absolute", height: 0, overflow: "hidden" }}>
          Institutional Placement
        </legend>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          Choose your <strong>campus</strong>, then pick the{" "}
          <strong>academic level</strong>, and finally select the{" "}
          <strong>program</strong>.
          <br />
          <em>
            Note: The program must match the campus and level you select. If you
            change campus or level, you may need to re-select the program.
          </em>
        </Typography>

        {loadError ? (
          <Typography color="error" variant="body2" gutterBottom>
            {loadError}
          </Typography>
        ) : null}

        <Grid container spacing={2}>
          {/* Campus */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Campus"
              placeholder="Select campus"
              required
              inputProps={{ "aria-label": "Campus" }}
              {...req("campus_id_code")}
              onChange={(e) => {
                const campusVal = Number(e.target.value);
                onChange("campus_id_code", campusVal);
                // reset level & program when campus changes
                onChange("level", "");
                onChange("program_id_code", "");
                setProgramFilter("");
              }}
              helperText={
                req("campus_id_code").error
                  ? req("campus_id_code").helperText
                  : `Available levels: ${levelCountForCampus || 0}`
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {campusChosen && (
                      <Tooltip title="Clear campus">
                        <IconButton
                          aria-label="Clear campus"
                          size="small"
                          onClick={() => {
                            onChange("campus_id_code", "");
                            onChange("level", "");
                            onChange("program_id_code", "");
                            setProgramFilter("");
                          }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Campus determines which levels and programs you can choose.">
                      <InfoOutlinedIcon
                        fontSize="small"
                        color="action"
                        sx={{ ml: 0.5 }}
                      />
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            >
              {campusOptions.map((o) => (
                <MenuItem
                  key={o.value}
                  value={o.value}
                  style={{ whiteSpace: "normal", lineHeight: 1.2 }}
                >
                  {o.label}
                </MenuItem>
              ))}
              {campusOptions.length === 0 && (
                <MenuItem disabled value="">
                  No campuses found
                </MenuItem>
              )}
            </TextField>
          </Grid>

          {/* Level (UI is 1-based; stored as 0-based) */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Academic Level"
              placeholder="Select level"
              required
              inputProps={{ "aria-label": "Academic level" }}
              {...req("level")}
              onChange={(e) => {
                const uiVal = Number(e.target.value); // 1-based from UI
                const modelVal = uiVal - 1; // 0-based for model & CSV
                onChange("level", modelVal);
                // reset program when level changes
                onChange("program_id_code", "");
                setProgramFilter("");
              }}
              disabled={!campusChosen}
              helperText={
                !campusChosen
                  ? "Select campus first"
                  : req("level").error
                  ? req("level").helperText
                  : `Programs available: ${programCountForSelection || 0}`
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {levelChosen && (
                      <Tooltip title="Clear level">
                        <IconButton
                          aria-label="Clear level"
                          size="small"
                          onClick={() => {
                            onChange("level", "");
                            onChange("program_id_code", "");
                            setProgramFilter("");
                          }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Level must match the program’s academic level.">
                      <InfoOutlinedIcon
                        fontSize="small"
                        color="action"
                        sx={{ ml: 0.5 }}
                      />
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            >
              {levelOptions.map((o) => (
                <MenuItem
                  key={o.value}
                  value={o.value}
                  style={{ whiteSpace: "normal", lineHeight: 1.2 }}
                >
                  {o.label}
                </MenuItem>
              ))}
              {levelOptions.length === 0 && (
                <MenuItem disabled value="">
                  {campusChosen
                    ? "No levels for selected campus"
                    : "Select campus first"}
                </MenuItem>
              )}
            </TextField>
          </Grid>

          {/* Program quick filter (client-side) */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Search program (optional)"
              placeholder="Type to filter program names…"
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              disabled={!campusChosen || !levelChosen}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: programFilter ? (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Clear program search"
                      size="small"
                      onClick={() => setProgramFilter("")}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              helperText={
                !campusChosen
                  ? "Select campus first"
                  : !levelChosen
                  ? "Select level first"
                  : "Optional: narrow down the list below"
              }
            />
          </Grid>

          {/* Program */}
          <Grid item xs={12}>
            <TextField
              select
              fullWidth
              label="Program"
              placeholder="Select program"
              required
              inputProps={{ "aria-label": "Program" }}
              {...req("program_id_code")}
              onChange={(e) =>
                onChange("program_id_code", Number(e.target.value))
              }
              disabled={!campusChosen || !levelChosen}
              helperText={
                !campusChosen
                  ? "Select campus first"
                  : !levelChosen
                  ? "Select level first"
                  : req("program_id_code").error
                  ? req("program_id_code").helperText
                  : `${programCountForSelection} program${
                      programCountForSelection === 1 ? "" : "s"
                    } found`
              }
            >
              {programOptions.map((o) => (
                <MenuItem
                  key={o.value}
                  value={o.value}
                  style={{ whiteSpace: "normal", lineHeight: 1.2 }}
                >
                  {o.label}
                </MenuItem>
              ))}
              {programOptions.length === 0 && (
                <MenuItem disabled value="">
                  {!campusChosen
                    ? "Select campus first"
                    : !levelChosen
                    ? "Select level first"
                    : programFilter
                    ? "No programs match your search"
                    : "No programs for selected campus & level"}
                </MenuItem>
              )}
            </TextField>

            {/* Live “no matches” status for screen readers */}
            <Box
              role="status"
              aria-live="polite"
              sx={{ mt: 0.5, fontSize: 12, color: "text.secondary" }}
            >
              {campusChosen &&
              levelChosen &&
              programFilter &&
              programOptions.length === 0
                ? "No programs match your search."
                : ""}
            </Box>
          </Grid>

          {/* Nationality (1=National, 0=International) */}
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Nationality"
              placeholder="Select nationality"
              value={data.is_national ?? ""}
              onChange={(e) => onChange("is_national", Number(e.target.value))}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Used for reporting only; does not change available programs.">
                      <InfoOutlinedIcon fontSize="small" color="action" />
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value={1}>National</MenuItem>
              <MenuItem value={0}>International</MenuItem>
            </TextField>
          </Grid>

          {/* Small context chips (purely informational) */}
          <Grid
            item
            xs={12}
            sm={6}
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {campusChosen && (
              <Chip
                size="small"
                label={`Campus selected`}
                color="default"
                variant="outlined"
              />
            )}
            {levelChosen && (
              <Chip
                size="small"
                label={`Level: ${
                  UI_LEVEL_LABELS[(data.level ?? 0) + 1] ??
                  (data.level ?? 0) + 1
                }`}
                color="default"
                variant="outlined"
              />
            )}
            {data.program_id_code ? (
              <Chip
                size="small"
                label={`Program chosen`}
                color="default"
                variant="outlined"
              />
            ) : null}
          </Grid>
        </Grid>
      </fieldset>
    </div>
  );
}

export default InstitutionalForm;
