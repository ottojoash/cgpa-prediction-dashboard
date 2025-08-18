// src/components/InstitutionalForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Grid, TextField, MenuItem, Typography } from "@mui/material";

function InstitutionalForm({ data, onChange, touched = {} }) {
  const [campusOptions, setCampusOptions] = useState([]);
  const [programRows, setProgramRows] = useState([]); // raw rows from programs_by_campus.csv

  const req = (name) => ({
    value: data[name] ?? "",
    error: touched[name] && (data[name] === "" || data[name] === null),
    helperText:
      touched[name] && (data[name] === "" || data[name] === null)
        ? "Required"
        : " ",
  });

  const parseCSV = (text) => {
    const [header, ...rows] = text.trim().split(/\r?\n/);
    const cols = header.split(",").map((s) => s.trim());
    return rows
      .map((line) => {
        const parts = line.split(",").map((s) => s.trim());
        const obj = {};
        cols.forEach((c, i) => (obj[c] = parts[i]));
        return obj;
      })
      .filter((r) => Object.keys(r).length === cols.length);
  };

  useEffect(() => {
    // campuses
    fetch("/lookups/campuses.csv")
      .then((res) => res.text())
      .then((txt) => {
        const rows = parseCSV(txt);
        const opts = rows
          .map((r) => ({
            label: r.campus_name,
            value: Number(r.campus_id_code),
          }))
          .filter((o) => o.label && o.label.trim() !== "")
          .sort((a, b) => a.label.localeCompare(b.label));
        setCampusOptions(opts);
      })
      .catch(() => {
        setCampusOptions([
          { label: "Main", value: 0 },
          { label: "Kampala", value: 1 },
          { label: "Mbale", value: 2 },
        ]);
      });

    // programs_by_campus
    fetch("/lookups/programs_by_campus.csv")
      .then((res) => res.text())
      .then((txt) => {
        const rows = parseCSV(txt)
          .map((r) => ({
            campus_id_code: Number(r.campus_id_code),
            program_id_code: Number(r.program_id_code),
            program_name: r.program_name?.trim() ?? "",
          }))
          .filter((r) => r.program_name !== ""); // ignore blanks
        setProgramRows(rows);
      })
      .catch(() => {
        // fallback: none
        setProgramRows([]);
      });
  }, []);

  // Filter programs by selected campus
  const programOptions = useMemo(() => {
    const campusId = Number(data.campus_id_code);
    const rows = programRows.filter((r) => r.campus_id_code === campusId);
    // dedupe by program_id_code in case multiple rows slipped through
    const seen = new Set();
    const opts = [];
    for (const r of rows) {
      const key = r.program_id_code;
      if (!seen.has(key) && r.program_name) {
        seen.add(key);
        opts.push({ value: key, label: r.program_name });
      }
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label));
  }, [programRows, data.campus_id_code]);

  return (
    <div style={{ marginTop: "2rem" }}>
      <Typography variant="h6" gutterBottom>
        🏫 Institutional Placement
      </Typography>
      <Grid container spacing={2}>
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
              // reset program when campus changes
              onChange("program_id_code", "");
            }}
          >
            {campusOptions.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

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
            disabled={!data.campus_id_code && data.campus_id_code !== 0}
          >
            {programOptions.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
            {programOptions.length === 0 && (
              <MenuItem disabled value="">
                {data.campus_id_code === "" || data.campus_id_code === null
                  ? "Select campus first"
                  : "No programs for selected campus"}
              </MenuItem>
            )}
          </TextField>
        </Grid>

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
