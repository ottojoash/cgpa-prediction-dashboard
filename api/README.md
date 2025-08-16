# CGPA Prediction API

This is the backend API for the CGPA Prediction Dashboard, built using FastAPI. The API provides endpoints for predicting CGPA based on user input and for retrieving necessary lookup data.

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd cgpa-prediction-dashboard/api
   ```

2. **Create a Virtual Environment**
   It is recommended to create a virtual environment to manage dependencies.
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install Requirements**
   Install the required packages using pip.
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the API**
   Start the FastAPI application.
   ```bash
   uvicorn main:app --reload
   ```

   The API will be available at `http://localhost:8000`.

## API Endpoints

### POST /api/predict
- **Description**: This endpoint accepts user input data and returns the predicted CGPA.
- **Request Body**: JSON object containing the necessary fields for prediction.
- **Response**: JSON object with the predicted CGPA and performance band.

### GET /api/lookups
- **Description**: This endpoint returns dropdown data for various fields in the prediction form.
- **Response**: JSON object containing lookup values for demographic, O-Level, A-Level, and institutional data.

## Error Handling
The API includes error handling for invalid input and server errors. Appropriate HTTP status codes will be returned for different error scenarios.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.