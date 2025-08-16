# CGPA Prediction Dashboard

This project is a CGPA Prediction Dashboard that consists of a backend API built with FastAPI and a frontend UI developed using React. The application allows users to input their academic information and receive predictions for their CGPA.

## Project Structure

The project is organized into two main directories: `api` for the backend and `cgpa-ui` for the frontend.

```
cgpa-prediction-dashboard
├── api
│   ├── main.py                # Entry point for the FastAPI application
│   ├── requirements.txt       # Python dependencies for the backend
│   ├── models
│   │   └── predictor.py       # Logic for loading the prediction model
│   ├── routes
│   │   └── predict.py         # API endpoints for predictions
│   └── README.md              # Documentation for the API
├── cgpa-ui
│   ├── src
│   │   ├── App.js             # Main component of the React application
│   │   ├── index.js           # Entry point for the React application
│   │   ├── components
│   │   │   ├── DemographicsForm.js  # Component for demographic information
│   │   │   ├── OLevelForm.js       # Component for O-Level information
│   │   │   ├── ALevelForm.js       # Component for A-Level information
│   │   │   └── InstitutionalForm.js # Component for institutional information
│   │   └── styles
│   │       └── theme.js          # Theme configuration for Material-UI
│   ├── package.json              # npm configuration for the React app
│   ├── README.md                 # Documentation for the React application
│   └── public
│       └── index.html            # Main HTML file for the React application
└── README.md                     # Overview of the entire project
```

## Setup Instructions

### Backend (API)

1. Navigate to the `api` directory:
   ```
   cd api
   ```

2. Install the required Python packages:
   ```
   pip install -r requirements.txt
   ```

3. Run the FastAPI application:
   ```
   uvicorn main:app --reload
   ```

4. The API will be available at `http://localhost:8000`.

### Frontend (UI)

1. Navigate to the `cgpa-ui` directory:
   ```
   cd cgpa-ui
   ```

2. Install the required npm packages:
   ```
   npm install
   ```

3. Start the React application:
   ```
   npm start
   ```

4. The UI will be available at `http://localhost:3000`.

## Features

- User-friendly forms to collect demographic, O-Level, A-Level, and institutional information.
- Real-time CGPA prediction based on user input.
- Responsive design using Material-UI components.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.