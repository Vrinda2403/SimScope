
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

import pandas as pd
from io import BytesIO

from analyzer import analyze_simulation
from microbolometer_analyzer import analyze_microbolometer


app = FastAPI(
    title="SimuScope Analysis API",
    version="1.1.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://YOUR-FRONTEND.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/")
def root():
    return {
        "message": "SimuScope Analysis API is running",
        "modules": [
            "Motor Analysis",
            "Microbolometer Analysis"
        ]
    }


# ==========================================
# MOTOR ANALYSIS
# ==========================================

@app.post("/api/analyze")
async def analyze_csv(
    file: UploadFile = File(...)
):

    if not file.filename.lower().endswith(".csv"):
        return {
            "success": False,
            "error": "Please upload a CSV file."
        }

    try:
        contents = await file.read()

        df = pd.read_csv(
            BytesIO(contents)
        )

        result = analyze_simulation(df)

        return {
            "success": True,
            "mode": "motor",
            "filename": file.filename,
            "result": result
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# ==========================================
# MICROBOLOMETER ANALYSIS
# ==========================================

@app.post("/api/analyze/microbolometer")
async def analyze_microbolometer_csv(
    file: UploadFile = File(...),

    Gth: float = Form(...),
    Cth: float = Form(...),
    R0: float = Form(...),
    TCR: float = Form(...),
    Ibias: float = Form(...),
    T0: float = Form(...)
):

    if not file.filename.lower().endswith(".csv"):
        return {
            "success": False,
            "error": "Please upload a CSV file."
        }

    try:
        contents = await file.read()

        df = pd.read_csv(
            BytesIO(contents)
        )

        parameters = {
            "Gth": Gth,
            "Cth": Cth,
            "R0": R0,
            "TCR": TCR,
            "Ibias": Ibias,
            "T0": T0
        }

        result = analyze_microbolometer(
            df,
            parameters
        )

        return {
            "success": True,
            "mode": "microbolometer",
            "filename": file.filename,
            "result": result
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
