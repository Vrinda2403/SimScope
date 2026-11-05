
import pandas as pd

from microbolometer_analyzer import analyze_microbolometer

df = pd.read_csv("simulink_sample.csv")

# Temporary test data only.
# Replace these columns with your actual microbolometer CSV.
df = df.rename(columns={
    "Signal": "Temperature"
})

df["Temperature"] = 300 + df["Temperature"] * 5
df["BiasVoltage"] = 1.2

parameters = {
    "Gth": 0.00001,
    "Cth": 0.000001,
    "R0": 100000,
    "TCR": 0.02,
    "Ibias": 0.000001,
    "T0": 300
}

result = analyze_microbolometer(df, parameters)

print("\nMICROBOLOMETER RESULTS")
print("----------------------")

for key, value in result["metrics"].items():
    print(f"{key}: {value}")

print("\nInterpretation:")
print(result["interpretation"])
