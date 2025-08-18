// src/components/InstitutionalForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Grid,
  TextField,
  MenuItem,
  Typography,
  CircularProgress,
} from "@mui/material";

function InstitutionalForm({ data, onChange, touched = {} }) {
  const [campusOptions, setCampusOptions] = useState([]);
  const [programRows, setProgramRows] = useState([]); // [{campus_id_code, program_id_code, program_name}]
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Required-field helper
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

  // Minimal CSV parser (no quoted fields support)
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

    const loadLookups = async () => {
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
            program_id_code: Number(r.program_id_code),
            program_name: (r.program_name || "").trim(),
          }))
          .filter(
            (r) =>
              r.program_name !== "" &&
              Number.isFinite(r.program_id_code) &&
              Number.isFinite(r.campus_id_code)
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
    };

    loadLookups();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter programs by selected campus (allow campus id 0)
  const programOptions = useMemo(() => {
    const campusId = Number(data.campus_id_code);
    const filtered = programRows.filter((r) => r.campus_id_code === campusId);

    // Deduplicate by program_id_code
    const seen = new Set();
    const opts = [];
    for (const r of filtered) {
      if (!seen.has(r.program_id_code) && r.program_name) {
        seen.add(r.program_id_code);
        opts.push({ value: r.program_id_code, label: r.program_name });
      }
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label));
  }, [programRows, data.campus_id_code]);

  // Campus chosen check (0 is valid)
  const campusChosen =
    typeof data.campus_id_code !== "undefined" &&
    data.campus_id_code !== "" &&
    data.campus_id_code !== null;

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
              // Reset program when campus changes
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

        {/* Program (filtered by campus) */}
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
            disabled={!campusChosen}
          >
            {programOptions.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
            {programOptions.length === 0 && (
              <MenuItem disabled value="">
                {campusChosen
                  ? "No programs for selected campus"
                  : "Select campus first"}
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
