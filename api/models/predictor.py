import joblib
import numpy as np
import pandas as pd

class CGPAPredictor:
    def __init__(self, model_path):
        self.model = joblib.load(model_path)
        # List of features in the order your model expects
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
            "year_of_entry_code"
        ]  # <-- update this list to match your model's training features

    def predict(self, features_dict):
        # Ensure features_dict is a dict with all required keys
        X = pd.DataFrame([features_dict], columns=self.feature_names)
        prediction = self.model.predict(X)
        # You may want to add band logic here
        return {"predicted_cgpa": float(prediction[0]), "performance_band": "TODO"}