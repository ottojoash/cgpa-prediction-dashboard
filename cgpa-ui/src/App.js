// src/App.js
import React, { useState, useMemo, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Box,
  ThemeProvider,
  CssBaseline,
} from "@mui/material";
import theme from "./styles/theme";
import SectionCard from "./components/SectionCard";
import DemographicsForm from "./components/DemographicsForm";
import OLevelForm from "./components/OLevelForm";
import ALevelForm from "./components/ALevelForm";
import InstitutionalForm from "./components/InstitutionalForm";
import SummarySidebar from "./components/SummarySidebar";

const steps = ["Demographics", "O-Level", "A-Level", "Institutional", "Review"];

// Map step index <-> sidebar section key (must match SummarySidebar’s internal keys)
const stepToSection = ["demographics", "olevel", "alevel", "institutional"];
const sectionToStep = {
  demographics: 0,
  olevel: 1,
  alevel: 2,
  institutional: 3,
};

function App() {
  const [activeStep, setActiveStep] = useState(0);

  const [formData, setFormData] = useState({
    age_at_entry: "",
    marital_status: "",
    is_national: "",
    gender: "",
    level: "",
    year_of_entry_code: "",
    uce_year_code: "",
    olevel_subjects: "",
    uce_distinctions: "",
    uce_credits: "",
    average_olevel_grade: "",
    count_weak_grades_olevel: "",
    std_dev_olevel_grade: "",
    uace_year_code: "",
    general_paper: "",
    alevel_average_grade_weight: "",
    alevel_std_dev_grade_weight: "",
    alevel_dominant_grade_weight: "",
    alevel_count_weak_grades: "",
    campus_id_code: "",
    program_id_code: "",
    high_school_performance_variance: "",
    high_school_performance_stability_index: "",
  });

  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Smoothly scroll to top on step change (keeps users oriented)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeStep]);

  // const handleFormChange = (field, value) => {
  //   setFormData((prev) => ({ ...prev, [field]: value }));
  //   setTouched((t) => ({ ...t, [field]: true }));
  // };

  const handleFormChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((t) => ({ ...t, [field]: true }));
  }, []);

  const castPayload = useMemo(() => {
    const n = (v) => (v === "" || v === null ? NaN : Number(v));
    const f = (v) => (v === "" || v === null ? NaN : parseFloat(v));
    return {
      ...formData,
      age_at_entry: n(formData.age_at_entry),
      gender: n(formData.gender),
      marital_status: n(formData.marital_status),
      is_national: n(formData.is_national),
      level: n(formData.level),
      uce_year_code: n(formData.uce_year_code),
      olevel_subjects: n(formData.olevel_subjects),
      uce_distinctions: n(formData.uce_distinctions),
      uce_credits: n(formData.uce_credits),
      average_olevel_grade: f(formData.average_olevel_grade),
      count_weak_grades_olevel: n(formData.count_weak_grades_olevel),
      std_dev_olevel_grade: f(formData.std_dev_olevel_grade),
      uace_year_code: n(formData.uace_year_code),
      general_paper: n(formData.general_paper),
      alevel_average_grade_weight: f(formData.alevel_average_grade_weight),
      alevel_std_dev_grade_weight: f(formData.alevel_std_dev_grade_weight),
      alevel_dominant_grade_weight: f(formData.alevel_dominant_grade_weight),
      alevel_count_weak_grades: n(formData.alevel_count_weak_grades),
      year_of_entry_code: n(formData.year_of_entry_code),
      campus_id_code: n(formData.campus_id_code),
      program_id_code: n(formData.program_id_code),
      high_school_performance_variance: f(
        formData.high_school_performance_variance
      ),
      high_school_performance_stability_index: f(
        formData.high_school_performance_stability_index
      ),
    };
  }, [formData]);

  const missingFields = useMemo(
    () =>
      Object.entries(castPayload)
        .filter(([_, val]) => val === "" || val === null || Number.isNaN(val))
        .map(([key]) => key),
    [castPayload]
  );

  const handleNext = () =>
    setActiveStep((s) => Math.min(s + 1, steps.length - 1));
  const handleBack = () => setActiveStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (missingFields.length > 0) {
      setError(
        `Please complete all required fields: ${missingFields.join(", ")}`
      );
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const API = process.env.REACT_APP_API_BASE || "http://localhost:8000";
      const response = await axios.post(`${API}/api/predict`, castPayload);
      setResult(response.data);
      setActiveStep(steps.length - 1);
    } catch (err) {
      setError(
        err?.response?.data?.detail || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ mt: 3, mb: 6 }}>
        <Typography variant="h4" align="center" sx={{ mb: 3 }}>
          🎓 CGPA Prediction Dashboard
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            {activeStep === 0 && (
              <SectionCard
                title="Demographic Details"
                subtitle="Basic student information"
              >
                <DemographicsForm
                  data={formData}
                  onChange={handleFormChange}
                  touched={touched}
                />
              </SectionCard>
            )}

            {activeStep === 1 && (
              <SectionCard
                title="📘 O-Level Academic Details"
                subtitle="UCE performance summary"
              >
                <OLevelForm
                  data={formData}
                  onChange={handleFormChange}
                  touched={touched}
                />
              </SectionCard>
            )}

            {activeStep === 2 && (
              <SectionCard
                title="🏫 A-Level (UACE) Information"
                subtitle="UACE performance summary"
              >
                <ALevelForm
                  data={formData}
                  onChange={handleFormChange}
                  touched={touched}
                />
              </SectionCard>
            )}

            {activeStep === 3 && (
              <SectionCard
                title="🏫 Institutional Placement"
                subtitle="Details about your campus and program"
              >
                <InstitutionalForm
                  data={formData}
                  onChange={handleFormChange}
                  touched={touched}
                />
              </SectionCard>
            )}

            {activeStep === 4 && (
              <SectionCard
                title="Review & Submit"
                subtitle="Confirm all details are correct"
                actions={
                  <>
                    <Button
                      variant="outlined"
                      onClick={handleBack}
                      sx={{ mr: 1 }}
                    >
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? (
                        <CircularProgress size={20} />
                      ) : (
                        "Predict CGPA"
                      )}
                    </Button>
                  </>
                }
              >
                {result && (
                  <Alert
                    severity="success"
                    sx={{ mt: 2, backgroundColor: "#172a22", color: "#00ff95" }}
                  >
                    🤖 <strong>Predicted CGPA:</strong> {result.predicted_cgpa}
                    <br />
                    🧠 <strong>Performance Band:</strong>{" "}
                    {result.performance_band}
                  </Alert>
                )}
                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}
                {!result && !error && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Click <strong>Predict CGPA</strong> to run the model.
                  </Alert>
                )}
              </SectionCard>
            )}

            {/* Sticky actions below the form for steps 0–3 */}
            {activeStep < 4 && (
              <Box
                sx={{
                  position: "sticky",
                  bottom: 0,
                  py: 2,
                  background:
                    "linear-gradient(180deg, rgba(15,17,21,0) 0%, rgba(15,17,21,0.9) 40%)",
                }}
              >
                <SectionCard
                  title=""
                  subtitle=""
                  actions={
                    <>
                      <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                        sx={{ mr: 1 }}
                      >
                        Back
                      </Button>
                      <Button variant="contained" onClick={handleNext}>
                        Next
                      </Button>
                    </>
                  }
                />
              </Box>
            )}
          </Grid>

          {/* Right sidebar (now synced with the current step) */}
          <Grid item xs={12} md={4}>
            <SummarySidebar
              data={formData}
              selectedSection={stepToSection[activeStep] || null}
              onSectionChange={(sectionKey) => {
                const idx = sectionToStep[sectionKey];
                if (typeof idx === "number") {
                  setActiveStep(idx);
                }
              }}
            />
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}

export default App;
