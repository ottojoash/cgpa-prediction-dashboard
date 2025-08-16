from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models.predictor import CGPAPredictor
import os

router = APIRouter()

MODEL_PATH = os.path.join(os.path.dirname(__file__), '../../final_best_cgpa_model.pkl')
predictor = CGPAPredictor(MODEL_PATH)

class PredictionRequest(BaseModel):
    age_at_entry: float
    gender: int
    level: int
    year_of_entry_code: int
    uce_year_code: int
    uce_credits: int
    average_olevel_grade: float
    best_sum_out_of_six: int
    best_sum_out_of_eight: int
    best_sum_out_of_ten: int
    count_weak_grades_olevel: int
    highest_olevel_grade: int
    lowest_olevel_grade: int
    std_dev_olevel_grade: float
    uace_year_code: int
    general_paper: int
    alevel_average_grade_weight: float
    alevel_total_grade_weight: float
    alevel_std_dev_grade_weight: float
    alevel_dominant_grade_weight: float
    alevel_count_weak_grades: int
    campus_id_code: int
    program_id_code: int
    curriculum_id_code: int
    high_school_performance_variance: float
    high_school_performance_stability_index: float

class PredictionResponse(BaseModel):
    predicted_cgpa: float
    performance_band: str

@router.post("/api/predict", response_model=PredictionResponse)
async def predict_cgpa(request: PredictionRequest):
    try:
        prediction = predictor.predict(request.dict())
        return PredictionResponse(predicted_cgpa=prediction['predicted_cgpa'], performance_band=prediction['performance_band'])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/lookups")
async def get_lookups():
    # This is a placeholder for lookup data
    return {"campus_ids": [], "program_ids": [], "curriculum_ids": []}