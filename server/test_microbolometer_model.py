
import joblib
import pandas as pd

MODEL_PATH = "microbolometer_rf_model.pkl"

artifact = joblib.load(MODEL_PATH)

model = artifact["model"]
features = artifact["features"]

# Test scenarios with manually selected combinations.
test_cases = [
    {
        "name": "Normal-like condition",
        "maximum_temperature_rise": 6.0,
        "heating_time_constant": 0.45,
        "cooling_time_constant": 0.65,
        "temperature_rise_time": 0.99,
        "maximum_resistance_change": 12000,
        "maximum_joule_power": 0.00000012,
        "bias_pulse_amplitude": 1.2,
        "bias_voltage_variation": 0.01,
    },
    {
        "name": "High temperature condition",
        "maximum_temperature_rise": 25.0,
        "heating_time_constant": 0.5,
        "cooling_time_constant": 0.8,
        "temperature_rise_time": 1.1,
        "maximum_resistance_change": 20000,
        "maximum_joule_power": 0.00000012,
        "bias_pulse_amplitude": 1.2,
        "bias_voltage_variation": 0.01,
    },
    {
        "name": "Slow response condition",
        "maximum_temperature_rise": 9.0,
        "heating_time_constant": 2.5,
        "cooling_time_constant": 2.8,
        "temperature_rise_time": 5.5,
        "maximum_resistance_change": 18000,
        "maximum_joule_power": 0.00000012,
        "bias_pulse_amplitude": 1.2,
        "bias_voltage_variation": 0.01,
    },
    {
        "name": "Unusual bias condition",
        "maximum_temperature_rise": 8.0,
        "heating_time_constant": 0.5,
        "cooling_time_constant": 0.6,
        "temperature_rise_time": 1.1,
        "maximum_resistance_change": 15000,
        "maximum_joule_power": 0.00000012,
        "bias_pulse_amplitude": 1.2,
        "bias_voltage_variation": 0.25,
    },
]

for case in test_cases:

    name = case.pop("name")

    X = pd.DataFrame([case])[features]

    prediction = model.predict(X)[0]

    probabilities = model.predict_proba(X)[0]

    confidence = max(probabilities) * 100

    print("\nScenario:", name)
    print("Predicted class:", prediction)
    print(f"Confidence: {confidence:.2f}%")
