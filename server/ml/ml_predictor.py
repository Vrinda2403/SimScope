import os
import joblib
import pandas as pd


MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "simuscope_model.pkl"
)

model = joblib.load(MODEL_PATH)


def predict_behavior(
    tr_ms,
    ts_ms,
    mp_percent,
    ess,
    iae,
    eu,
    sigma_e,
    u_max
):
    data = pd.DataFrame([{
        "tr_ms": tr_ms,
        "ts_ms": ts_ms,
        "Mp_percent": mp_percent,
        "ess": ess,
        "IAE": iae,
        "Eu": eu,
        "sigma_e": sigma_e,
        "u_max": u_max
    }])

    prediction = model.predict(data)[0]

    probabilities = model.predict_proba(data)[0]

    classes = model.classes_

    confidence = float(max(probabilities))

    probability_data = {
        str(cls): round(float(prob), 4)
        for cls, prob in zip(classes, probabilities)
    }

    return {
        "class": str(prediction),
        "confidence": round(confidence, 4),
        "probabilities": probability_data
    }