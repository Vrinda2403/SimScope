
import numpy as np
import pandas as pd
import joblib

from pathlib import Path

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)


# ==========================================================
# CONFIGURATION
# ==========================================================

RANDOM_STATE = 42
SAMPLES_PER_CLASS = 1000

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "microbolometer_rf_model.pkl"
DATASET_PATH = BASE_DIR / "microbolometer_training_data.csv"

rng = np.random.default_rng(RANDOM_STATE)


# ==========================================================
# CLASS DEFINITIONS
# ==========================================================

CLASSES = [
    "Normal Operation",
    "Overheating",
    "Slow Thermal Response",
    "High Resistance Variation",
    "Bias Instability",
]

FEATURES = [
    "maximum_temperature_rise",
    "heating_time_constant",
    "cooling_time_constant",
    "temperature_rise_time",
    "maximum_resistance_change",
    "maximum_joule_power",
    "bias_pulse_amplitude",
    "bias_voltage_variation",
]


# ==========================================================
# SYNTHETIC DATA GENERATION
# ==========================================================

def generate_sample(class_name):

    # Common reference values
    ambient = rng.uniform(295, 305)
    r0 = rng.uniform(80000, 120000)
    ibias = rng.uniform(0.8e-6, 1.2e-6)

    # Each operating condition has a different feature profile.
    if class_name == "Normal Operation":

        temperature_rise = rng.uniform(3, 8)
        heating_tau = rng.uniform(0.2, 0.7)
        cooling_tau = rng.uniform(0.3, 0.9)
        tcr = rng.uniform(0.015, 0.025)
        bias_amplitude = rng.uniform(1.0, 1.3)
        bias_variation = rng.uniform(0.001, 0.025)

    elif class_name == "Overheating":

        temperature_rise = rng.uniform(18, 35)
        heating_tau = rng.uniform(0.2, 0.8)
        cooling_tau = rng.uniform(0.4, 1.2)
        tcr = rng.uniform(0.015, 0.025)
        bias_amplitude = rng.uniform(1.0, 1.3)
        bias_variation = rng.uniform(0.001, 0.025)

    elif class_name == "Slow Thermal Response":

        temperature_rise = rng.uniform(5, 12)
        heating_tau = rng.uniform(1.5, 4.0)
        cooling_tau = rng.uniform(1.5, 4.0)
        tcr = rng.uniform(0.015, 0.025)
        bias_amplitude = rng.uniform(1.0, 1.3)
        bias_variation = rng.uniform(0.001, 0.025)

    elif class_name == "High Resistance Variation":

        temperature_rise = rng.uniform(8, 15)
        heating_tau = rng.uniform(0.3, 0.9)
        cooling_tau = rng.uniform(0.3, 1.0)
        tcr = rng.uniform(0.045, 0.08)
        bias_amplitude = rng.uniform(1.0, 1.3)
        bias_variation = rng.uniform(0.001, 0.025)

    elif class_name == "Bias Instability":

        temperature_rise = rng.uniform(5, 12)
        heating_tau = rng.uniform(0.3, 0.9)
        cooling_tau = rng.uniform(0.3, 1.0)
        tcr = rng.uniform(0.015, 0.025)
        bias_amplitude = rng.uniform(1.0, 1.3)
        bias_variation = rng.uniform(0.15, 0.40)

    else:
        raise ValueError("Unknown operating condition.")

    # Approximate 10-90% rise time for a first-order response.
    rise_time = 2.197 * heating_tau

    # Linear resistance-temperature approximation.
    maximum_resistance_change = (
        r0 * abs(tcr) * temperature_rise
    )

    maximum_resistance = (
        r0 + r0 * abs(tcr) * temperature_rise
    )

    # Approximate Joule power at the maximum resistance.
    maximum_joule_power = (
        ibias ** 2
    ) * maximum_resistance

    return {
        "maximum_temperature_rise": temperature_rise,
        "heating_time_constant": heating_tau,
        "cooling_time_constant": cooling_tau,
        "temperature_rise_time": rise_time,
        "maximum_resistance_change": maximum_resistance_change,
        "maximum_joule_power": maximum_joule_power,
        "bias_pulse_amplitude": bias_amplitude,
        "bias_voltage_variation": bias_variation,
        "operating_condition": class_name,
    }


def generate_dataset():

    records = []

    for class_name in CLASSES:

        print(f"Generating: {class_name}")

        for _ in range(SAMPLES_PER_CLASS):

            records.append(generate_sample(class_name))

    dataset = pd.DataFrame(records)

    # Shuffle the dataset.
    dataset = dataset.sample(
        frac=1,
        random_state=RANDOM_STATE
    ).reset_index(drop=True)

    return dataset


# ==========================================================
# MODEL TRAINING
# ==========================================================

def train_model():

    print("\nGenerating synthetic dataset...")

    dataset = generate_dataset()

    dataset.to_csv(DATASET_PATH, index=False)

    print(f"\nDataset saved: {DATASET_PATH}")
    print("Dataset shape:", dataset.shape)

    X = dataset[FEATURES]
    y = dataset["operating_condition"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    print("\nTraining Random Forest classifier...")

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )

    model.fit(X_train, y_train)

    # ======================================================
    # EVALUATION
    # ======================================================

    predictions = model.predict(X_test)

    accuracy = accuracy_score(y_test, predictions)

    print("\n===================================")
    print("MICROBOLOMETER MODEL EVALUATION")
    print("===================================")

    print(f"\nTest Accuracy: {accuracy * 100:.2f}%")

    print("\nClassification Report:")

    print(
        classification_report(
            y_test,
            predictions,
            zero_division=0
        )
    )

    print("\nConfusion Matrix:")

    print(
        confusion_matrix(
            y_test,
            predictions,
            labels=CLASSES
        )
    )

    # Feature importance
    importance = pd.DataFrame({
        "Feature": FEATURES,
        "Importance": model.feature_importances_,
    }).sort_values(
        by="Importance",
        ascending=False
    )

    print("\nFeature Importance:")

    print(importance.to_string(index=False))

    # ======================================================
    # SAVE MODEL
    # ======================================================

    model_artifact = {
        "model": model,
        "features": FEATURES,
        "classes": CLASSES,
        "accuracy": accuracy,
    }

    joblib.dump(model_artifact, MODEL_PATH)

    print("\n===================================")
    print("TRAINING COMPLETED")
    print("===================================")

    print(f"Model saved at: {MODEL_PATH}")
    print(f"Dataset saved at: {DATASET_PATH}")


if __name__ == "__main__":
    train_model()
