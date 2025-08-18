# models/predictor.py
import joblib
import numpy as np
import pandas as pd
from pathlib import Path

class CGPAPredictor:
    def __init__(self, model_path):
        model_path = Path(model_path).resolve()
        self.model = joblib.load(model_path)

        # Exact training feature order (23)
        self.feature_names = [
            "age_at_entry",
            "average_olevel_grade",
            "uce_credits",
            "uce_distinctions",
            "alevel_average_grade_weight",
            "alevel_count_weak_grades",
            "alevel_dominant_grade_weight",
            "alevel_std_dev_grade_weight",
            "count_weak_grades_olevel",
            "olevel_subjects",
            "std_dev_olevel_grade",
            "high_school_performance_variance",
            "high_school_performance_stability_index",
            "marital_status",
            "level",
            "gender",
            "is_national",
            "general_paper",
            "campus_id_code",
            "program_id_code",
            "uce_year_code",
            "uace_year_code",
            "year_of_entry_code",
        ]

    def predict(self, features_dict: dict):
        """
        features_dict may contain **only** the 23 keys above.
        If the client accidentally sends extras, we ignore them.
        """
        row = {k: features_dict[k] for k in self.feature_names}
        X = pd.DataFrame([row], columns=self.feature_names)
        y = self.model.predict(X)

        # Optional: convert to band here if you have thresholds
        return {"predicted_cgpa": float(y[0]), "performance_band": "TODO"}
