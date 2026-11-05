# SimScope

**SimScope** is a web-based dynamic response analyzer that processes simulation CSV data and provides transient-response metrics, visualization, system classification, and ML-based behavior prediction.

## Features

- 📊 Analyze simulation CSV files
- 📈 Interactive time-domain response graphs
- ⚙️ Calculate:
  - Rise Time
  - Settling Time
  - Overshoot
  - Peak Value
  - Peak Time
  - Steady-State Value
- 🔍 Damping and stability classification
- 🤖 Random Forest-based behavior classification
- 🔄 Compare multiple simulation runs
- 💬 Simulation Q&A interface

## Tech Stack

**Frontend**
- React
- Vite
- Tailwind CSS
- Recharts
- Lucide React

**Backend**
- Python
- FastAPI
- Pandas
- NumPy

**ML**
- Scikit-learn
- Random Forest
- Joblib

## Architecture

```text
CSV Simulation Data
        ↓
React Frontend
        ↓
FastAPI Backend
        ↓
Python Analysis Engine
        ↓
Metrics + Classification + ML
        ↓
React Dashboard
```

## Project Structure

```
├── simulation-analyzer/
│   └── src/
│       ├── App.jsx
│       ├── Home.jsx
│       ├── Dashboard.jsx
│       ├── Analysis.jsx
│       ├── Comparison.jsx
│       ├── Assistant.jsx
│       └── ResponseChart.jsx
│
└── server/
    ├── main.py
    ├── analyzer.py
    └── ml/
        ├── train_model.py
        ├── ml_predictor.py
        └── simuscope_model.pkl
```
## How It Works

1. Upload a simulation CSV file through the dashboard.
2. The FastAPI backend processes the simulation data using Python.
3. SimuScope calculates important transient-response parameters.
4. The results are returned to the React frontend.
5. The dashboard displays metrics, graphs, classifications, and comparisons.
6. ML-based behavior classification is applied when the required input data is available.

## Analysis Parameters

SimScope analyzes:

- Initial Value
- Steady-State Value
- Peak Value
- Peak Time
- Rise Time
- Settling Time
- Overshoot
- Damping Behavior
- Stability
