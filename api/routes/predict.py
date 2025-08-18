# routes/predictor.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, Extra
from models.predictor import CGPAPredictor
from pathlib import Path

router = APIRouter()

# Robust model path (adjust if your file lives somewhere else)
MODEL_PATH = Path(__file__).resolve().parents[2] / "final_best_cgpa_model.pkl"
predictor = CGPAPredictor(MODEL_PATH)

class PredictionRequest(BaseModel):
    # Demographics / institutional
    age_at_entry: float
    marital_status: int
    is_national: int
    gender: int
    level: int

    # Years / codes
    year_of_entry_code: int
    uce_year_code: int
    uace_year_code: int

    # O-Level
    olevel_subjects: int
    uce_distinctions: int
    uce_credits: int
    average_olevel_grade: float
    count_weak_grades_olevel: int
    std_dev_olevel_grade: float

    # A-Level
    general_paper: int
    alevel_average_grade_weight: float
    alevel_std_dev_grade_weight: float
    alevel_dominant_grade_weight: float
    alevel_count_weak_grades: int

    # Institutional codes
    campus_id_code: int
    program_id_code: int

    # Derived HS performance
    high_school_performance_variance: float
    high_school_performance_stability_index: float

    class Config:
        # If the UI accidentally sends extra fields, ignore them instead of 422
        extra = Extra.ignore

class PredictionResponse(BaseModel):
    predicted_cgpa: float
    performance_band: str

@router.post("/api/predict", response_model=PredictionResponse)
async def predict_cgpa(request: PredictionRequest):
    try:
        prediction = predictor.predict(request.dict())
        return PredictionResponse(
            predicted_cgpa=prediction["predicted_cgpa"],
            performance_band=prediction["performance_band"],
        )
    except KeyError as ke:
        # This would only happen if any of the 23 keys is missing internally
        raise HTTPException(status_code=400, detail=f"Missing required feature: {ke}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/lookups")
async def get_lookups():
    # Drop curriculum; only return what UI needs
    return {"campus_ids": [], "program_ids": []}
