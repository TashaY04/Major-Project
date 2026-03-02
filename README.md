# Hypertension Digital Twin

A personalized hypertension simulation and drug recommendation system with:
- ensemble ML-based medication ranking
- AI-generated personalized health guidance
- 4-week blood pressure trajectory simulation
- interactive what-if intervention modeling

## Tech Stack

- Frontend: React + Vite + Framer Motion
- Backend: Flask + XGBoost + RandomForest + GradientBoosting
- AI Tips: Gemini API (with structured personalized fallback)

## Core Features

### 1. Personalized Drug Recommendation
- Predicts top medication classes from patient profile
- Filters recommendations against reported allergies
- Returns top ranked options with confidence and explanation

### 2. Digital Twin Simulation
- Simulates weekly BP progression (Week 0 to Week 4)
- Outputs systolic/diastolic trajectory + risk stage per week
- Compares trajectories across recommended drug options

### 3. What-If Modeling
Interactive intervention engine with:
- dosage multiplier
- exercise level
- sodium reduction (%)
- salt intake (mg/day)
- medication adherence (%)
- stress intervention (%)
- sleep duration and sleep quality
- weight change (kg)
- medication switch (force a selected drug class)

### 4. AI Insights Page
- Dedicated `AI Insights` view (separate from Summary)
- 5 personalized guidance factors:
  1. Weight/BMI target
  2. Dietary measures
  3. Medication measures
  4. Workout measures
  5. Special measures (smoking/alcohol or pregnancy, with stress yoga guidance)

### 5. Input Validation & Safety Rules
Validated on frontend and backend:
- male cannot be pregnant
- age range: 13-100
- height range: 120-220 cm
- weight range: 35-250 kg
- systolic range: 80-260
- diastolic range: 40-160
- diastolic must be lower than systolic

## Project Structure

```text
Hypertension/
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── data_loader.py
│   ├── model.py
│   ├── train.py
│   ├── requirements.txt
│   └── models/
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        ├── App.css
        ├── index.css
        ├── main.jsx
        ├── components/
        │   ├── Avatar.jsx
        │   └── Avatar.css
        └── pages/
            ├── WelcomePage.jsx
            ├── WelcomePage.css
            ├── AssessmentPage.jsx
            ├── AssessmentPage.css
            ├── ResultsPage.jsx
            └── ResultsPage.css
```

## Setup

### Backend

```bash
cd backend
pip3 install -r requirements.txt
python3 train.py
python3 app.py
```

Backend runs at: `http://localhost:5000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

## API Endpoints

### `POST /api/predict`
Main prediction endpoint.

Returns:
- recommendations
- AI tips
- simulation trajectories
- patient summary
- disclaimer

### `POST /api/what-if`
Counterfactual scenario simulation endpoint.

Input:
- `patient_data`
- `scenario` interventions

Returns:
- reranked recommendations
- updated week-4 risk summary
- updated trajectories and comparisons
- scenario-applied echo

### `GET /api/health`
Model/service health check.

## Notes

- Restart backend after code changes in `backend/app.py`.
- If models are missing, run `python3 train.py`.
- AI tips gracefully fall back to deterministic personalized rules when Gemini is unavailable.

## Disclaimer

This system is for educational and decision-support use only.
Clinical decisions must be made by qualified healthcare professionals.
