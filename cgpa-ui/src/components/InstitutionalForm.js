// src/components/InstitutionalForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Grid,
  TextField,
  MenuItem,
  Typography,
  CircularProgress,
} from "@mui/material";

const LEVEL_LABELS = {
  0: "Certificate",
  1: "Diploma",
  2: "Bachelor’s",
  3: "Master’s",
  4: "PhD",
  5: "Short Courses",
  6: "Postgraduate Diploma",
  7: "Unknown",
};

function InstitutionalForm({ data, onChange, touched = {} }) {
  const [campusOptions, setCampusOptions] = useState([]);
  const [programRows, setProgramRows] = useState([]); // raw: {campus_id_code, level_code, program_core_id, program_id_code, program_name}
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const req = (name) => ({
    value: data[name] ?? "",
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

        // programs_by_campus.csv
        const pRes = await fetch("/lookups/programs_by_campus.csv");
        if (!pRes.ok) throw new Error("programs_by_campus.csv not found");
        const pTxt = await pRes.text();
        const pRows = parseCSV(pTxt)
          .map((r) => ({
            campus_id_code: Number(r.campus_id_code),
            level_code: Number(r.level_code),
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
            "Failed to load lookups from /public/lookups (campuses.csv / programs_by_campus.csv)."
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

  // --- NORMALIZE LEVEL CODES ---
  // Detect if CSV level_code is 0-based or 1-based. If we see a 0, assume 0-based.
  // Else if we see a 1 (and no 0), treat as 1-based and subtract 1.
  const levelOffset = useMemo(() => {
    const codes = programRows.map((r) => r.level_code).filter(Number.isFinite);
    const hasZero = codes.includes(0);
    const hasOne = codes.includes(1);
    // 0-based if 0 present; otherwise if 1 present assume 1-based -> offset 1
    return hasZero ? 0 : hasOne ? 1 : 0;
  }, [programRows]);

  const normalizeLevel = (raw) =>
    Number.isFinite(raw) ? raw - levelOffset : raw;

  // Campus chosen? (0 is valid)
  const campusChosen =
    typeof data.campus_id_code !== "undefined" &&
    data.campus_id_code !== "" &&
    data.campus_id_code !== null;

  // Level options (normalized) for chosen campus
  const levelOptions = useMemo(() => {
    if (!campusChosen) return [];
    const campusId = Number(data.campus_id_code);
    const levels = new Set(
      programRows
        .filter((r) => r.campus_id_code === campusId)
        .map((r) => normalizeLevel(r.level_code))
        .filter((v) => Number.isFinite(v))
    );
    const opts = Array.from(levels)
      .sort((a, b) => a - b)
      .map((code) => ({
        value: code,
        label: LEVEL_LABELS[code] || `Level ${code}`,
      }));
    return opts;
  }, [programRows, data.campus_id_code, campusChosen, levelOffset]);

  const levelChosen =
    typeof data.level !== "undefined" &&
    data.level !== "" &&
    data.level !== null;

  // Program options filtered by campus + normalized level; dedupe by core
  const programOptions = useMemo(() => {
    if (!campusChosen || !levelChosen) return [];
    const campusId = Number(data.campus_id_code);
    const wantLevel = Number(data.level);

    const rows = programRows.filter(
      (r) =>
        r.campus_id_code === campusId &&
        normalizeLevel(r.level_code) === wantLevel
    );

    const seenCore = new Set();
    const opts = [];
    for (const r of rows) {
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
    levelOffset,
  ]);

  if (loading) {
    return (
      <div style={{ marginTop: "2rem" }}>
        <Typography variant="h6" gutterBottom>
          🏫 Institutional Placement
        </Typography>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CircularProgress size={20} />{" "}
          <span>Loading campus/program lookups…</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "2rem" }}>
      <Typography variant="h6" gutterBottom>
        🏫 Institutional Placement
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
            required
            {...req("campus_id_code")}
            onChange={(e) => {
              const campusVal = Number(e.target.value);
              onChange("campus_id_code", campusVal);
              // reset level & program when campus changes
              onChange("level", "");
              onChange("program_id_code", "");
            }}
          >
            {campusOptions.map((o) => (
              <MenuItem key={o.value} value={o.value}>
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

        {/* Level (derived from campus; normalized) */}
        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label="Academic Level"
            required
            {...req("level")}
            onChange={(e) => {
              const lvl = Number(e.target.value); // always ordinal (0-based)
              onChange("level", lvl);
              // reset program when level changes
              onChange("program_id_code", "");
            }}
            disabled={!campusChosen}
          >
            {levelOptions.map((o) => (
              <MenuItem key={o.value} value={o.value}>
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

        {/* Program (filtered by campus + normalized level) */}
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
            disabled={!campusChosen || !levelChosen}
          >
            {programOptions.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
            {programOptions.length === 0 && (
              <MenuItem disabled value="">
                {!campusChosen
                  ? "Select campus first"
                  : !levelChosen
                  ? "Select level first"
                  : "No programs for selected campus & level"}
              </MenuItem>
            )}
          </TextField>
        </Grid>

        {/* Nationality (1=National, 0=International) */}
        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label="Nationality"
            value={data.is_national ?? ""}
            onChange={(e) => onChange("is_national", Number(e.target.value))}
          >
            <MenuItem value={1}>National</MenuItem>
            <MenuItem value={0}>International</MenuItem>
          </TextField>
        </Grid>
      </Grid>
    </div>
  );
}

export default InstitutionalForm;
