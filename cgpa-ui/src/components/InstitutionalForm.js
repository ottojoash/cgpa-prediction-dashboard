// src/components/InstitutionalForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Grid,
  TextField,
  MenuItem,
  Typography,
  CircularProgress,
} from "@mui/material";

/**
 * Human labels for the ordinal level codes expected by the model (0-based).
 * 0: Certificate, 1: Diploma, 2: Bachelor’s, 3: Master’s, 4: PhD, 5: Short, 6: PG Dip, 7: Unknown
 */
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

/**
 * Tiny CSV parser that respects quoted fields with commas.
 * Returns array of objects keyed by header cells.
 */
function parseCSV(text) {
  if (!text || !text.trim()) return [];
  const rows = [];
  const lines = [];
  let i = 0;
  const s = text.replace(/\r\n/g, "\n");

  // Split into lines while keeping empty last line out
  for (const line of s.split("\n")) {
    if (line !== "") lines.push(line);
  }
  if (lines.length === 0) return [];

  // Tokenize a CSV line respecting quotes
  const splitLine = (line) => {
    const out = [];
    let cur = "";
    let quoted = false;
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') {
        // Toggle quoted unless escaping a quote
        if (quoted && line[j + 1] === '"') {
          cur += '"'; // escaped quote
          j++;
        } else {
          quoted = !quoted;
        }
      } else if (ch === "," && !quoted) {
        out.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((x) => x.trim());
  };

  const header = splitLine(lines[0]);
  for (i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    // ignore ragged line lengths
    if (cols.length !== header.length) continue;
    const obj = {};
    header.forEach((h, idx) => {
      obj[h] = cols[idx];
    });
    rows.push(obj);
  }
  return rows;
}

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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");

    (async () => {
      try {
        // --- campuses.csv ---
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

        // --- programs_by_campus.csv ---
        const pRes = await fetch("/lookups/programs_by_campus.csv");
        if (!pRes.ok) throw new Error("programs_by_campus.csv not found");
        const pTxt = await pRes.text();
        const pRows = parseCSV(pTxt)
          .map((r) => ({
            campus_id_code: Number(r.campus_id_code),
            level_code: Number(r.level_code), // may be 0-based OR 1-based
            program_core_id: Number(r.program_core_id),
            program_id_code: Number(r.program_id_code),
            program_name: (r.program_name || "").trim(),
          }))
          .filter(
            (r) =>
              r.program_name !== "" &&
              Number.isFinite(r.campus_id_code) &&
              Number.isFinite(r.level_code) &&
              Number.isFinite(r.program_core_id) &&
              Number.isFinite(r.program_id_code)
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

  // --- Detect if level_code in CSV is 0-based or 1-based ---
  // If any row has 0 => 0-based. Else if any row has 1 (and none has 0) => treat as 1-based and subtract 1.
  const levelOffset = useMemo(() => {
    const codes = programRows.map((r) => r.level_code).filter(Number.isFinite);
    const hasZero = codes.includes(0);
    const hasOne = codes.includes(1);
    return hasZero ? 0 : hasOne ? 1 : 0;
  }, [programRows]);

  const normalizeLevel = (raw) =>
    Number.isFinite(raw) ? raw - levelOffset : raw;

  // Campus chosen? (0 is a valid campus)
  const campusChosen =
    typeof data.campus_id_code !== "undefined" &&
    data.campus_id_code !== "" &&
    data.campus_id_code !== null;

  // Level options (normalized -> 0-based) for chosen campus
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

  // Program options filtered by campus + normalized level; dedupe by core id
  const programOptions = useMemo(() => {
    if (!campusChosen || !levelChosen) return [];
    const campusId = Number(data.campus_id_code);
    const wantLevel = Number(data.level);
    const rows = programRows.filter(
      (r) =>
        r.campus_id_code === campusId &&
        normalizeLevel(r.level_code) === wantLevel
    );

    // Deduplicate by program_core_id (keep first by name asc)
    const byName = [...rows].sort((a, b) =>
      (a.program_name || "").localeCompare(b.program_name || "")
    );
    const seenCore = new Set();
    const opts = [];
    for (const r of byName) {
      if (r.program_name && !seenCore.has(r.program_core_id)) {
        seenCore.add(r.program_core_id);
        opts.push({ value: r.program_id_code, label: r.program_name });
      }
    }
    return opts;
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
              // Reset level & program when campus changes
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

        {/* Level (normalized ordinal) */}
        <Grid item xs={12} sm={6}>
          <TextField
            select
            fullWidth
            label="Academic Level"
            required
            {...req("level")}
            onChange={(e) => {
              const lvl = Number(e.target.value); // model expects ordinal (0-based)
              onChange("level", lvl);
              // Reset program when level changes
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

        {/* Program (filtered by campus & level) */}
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
