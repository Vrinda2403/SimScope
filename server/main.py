from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

import pandas as pd
from io import BytesIO

from analyzer import analyze_simulation


app = FastAPI(
    title="SimuScope Analysis API",
    version="1.0.0",
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Health Check
# --------------------------------------------------

@app.get("/")
def root():

    return {
        "message": "SimuScope Analysis API is running"
    }


# --------------------------------------------------
# Analyze CSV
# --------------------------------------------------

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
            "filename": file.filename,
            "result": result,
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e),
        }