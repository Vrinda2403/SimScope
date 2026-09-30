import numpy as np
import pandas as pd


def analyze_simulation(df):
    """
    Analyze a Simulink CSV dataframe.

    Assumptions:
    - First column = time
    - Second column = signal
    """

    if df is None or df.empty:
        raise ValueError("CSV file is empty.")

    if len(df.columns) < 2:
        raise ValueError("CSV must contain at least two columns.")

    # --------------------------------------------------
    # Extract time and signal
    # --------------------------------------------------

    time_col = df.columns[0]
    signal_col = df.columns[1]

    t = pd.to_numeric(df[time_col], errors="coerce").to_numpy()
    y = pd.to_numeric(df[signal_col], errors="coerce").to_numpy()

    # Remove invalid rows
    valid = np.isfinite(t) & np.isfinite(y)

    t = t[valid]
    y = y[valid]

    if len(t) < 2:
        raise ValueError(
            "Not enough valid data points for analysis."
        )

    # --------------------------------------------------
    # Initial Value
    # --------------------------------------------------

    initial_val = float(y[0])

    # --------------------------------------------------
    # Steady-State Value
    # Average of final 10% samples
    # --------------------------------------------------

    steady_count = max(1, int(len(y) * 0.1))

    final_val = float(
        np.mean(y[-steady_count:])
    )

    # --------------------------------------------------
    # Peak Value
    # --------------------------------------------------

    peak_idx = int(np.argmax(y))

    peak_val = float(y[peak_idx])

    peak_time = float(t[peak_idx])

    # --------------------------------------------------
    # Overshoot
    # --------------------------------------------------

    if final_val != 0:

        overshoot_pct = max(
            0.0,
            (
                (peak_val - final_val)
                / abs(final_val)
            )
            * 100,
        )

    else:

        overshoot_pct = 0.0

    # --------------------------------------------------
    # Rise Time
    # 10% -> 90%
    # --------------------------------------------------

    try:

        ten_percent_level = (
            initial_val
            + 0.1 * (final_val - initial_val)
        )

        ninety_percent_level = (
            initial_val
            + 0.9 * (final_val - initial_val)
        )

        r10_indices = np.where(
            y >= ten_percent_level
        )[0]

        r90_indices = np.where(
            y >= ninety_percent_level
        )[0]

        if len(r10_indices) == 0 or len(r90_indices) == 0:
            raise ValueError()

        r10_idx = r10_indices[0]
        r90_idx = r90_indices[0]

        rise_time = float(
            t[r90_idx] - t[r10_idx]
        )

    except (IndexError, ValueError):

        rise_time = 0.0

    # --------------------------------------------------
    # Settling Time
    # ±2% of steady-state value
    # --------------------------------------------------

    settling_band = (
        0.02 * abs(final_val)
    )

    outside_band = np.where(
        np.abs(y - final_val)
        > settling_band
    )[0]

    if len(outside_band) > 0:

        settling_time = float(
            t[outside_band[-1]]
        )

    else:

        settling_time = float(t[-1])

    # --------------------------------------------------
    # Damping Classification
    # --------------------------------------------------

    if overshoot_pct > 5.0:

        damping_behavior = "Underdamped"

    elif overshoot_pct > 0.1:

        damping_behavior = "Slightly Underdamped"

    else:

        damping_behavior = (
            "Critically Damped / Overdamped"
        )

    # --------------------------------------------------
    # Stability / Settling Status
    # --------------------------------------------------

    if settling_time < (t[-1] * 0.8):

        stability_status = "Stable"

    else:

        stability_status = (
            "Slow Settling / Marginally Stable"
        )

    # --------------------------------------------------
    # Automated Interpretation
    # --------------------------------------------------

    interpretation = (
        f"The system exhibits a "
        f"{damping_behavior.lower()} response "
        f"with an overshoot of "
        f"{overshoot_pct:.2f}%. "
        f"The response reaches a peak value of "
        f"{peak_val:.4f} at "
        f"t = {peak_time:.4f}s. "
        f"The rise time is "
        f"{rise_time:.4f}s and the settling "
        f"time is "
        f"{settling_time:.4f}s. "
        f"The steady-state output converges "
        f"near {final_val:.4f}."
    )

    # --------------------------------------------------
    # Return structured result
    # --------------------------------------------------

    return {

        "metrics": {

            "initialValue": round(
                initial_val, 6
            ),

            "steadyState": round(
                final_val, 6
            ),

            "peakValue": round(
                peak_val, 6
            ),

            "peakTime": round(
                peak_time, 6
            ),

            "riseTime": round(
                rise_time, 6
            ),

            "settlingTime": round(
                settling_time, 6
            ),

            "overshoot": round(
                overshoot_pct, 6
            ),

        },

        "classification": {

            "damping": damping_behavior,

            "stability": stability_status,

        },

        "interpretation": interpretation,

        "data": [

            {
                "time": round(
                    float(time), 6
                ),

                "value": round(
                    float(value), 6
                ),

            }

            for time, value in zip(t, y)

        ],

        "metadata": {

            "timeColumn": str(time_col),

            "signalColumn": str(signal_col),

            "sampleCount": int(len(t)),

        },

    }