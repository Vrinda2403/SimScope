import numpy as np
import pandas as pd

from ml.ml_predictor import predict_behavior


def analyze_simulation(df):

    if df is None or df.empty:
        raise ValueError("CSV file is empty.")

    if len(df.columns) < 2:
        raise ValueError("CSV must contain at least two columns.")

    time_col = df.columns[0]
    signal_col = df.columns[1]

    t = pd.to_numeric(
        df[time_col],
        errors="coerce"
    ).to_numpy()

    y = pd.to_numeric(
        df[signal_col],
        errors="coerce"
    ).to_numpy()

    valid = np.isfinite(t) & np.isfinite(y)

    t = t[valid]
    y = y[valid]

    if len(t) < 2:
        raise ValueError(
            "Not enough valid data points for analysis."
        )

    initial_val = float(y[0])

    steady_count = max(
        1,
        int(len(y) * 0.1)
    )

    final_val = float(
        np.mean(y[-steady_count:])
    )

    peak_idx = int(np.argmax(y))

    peak_val = float(
        y[peak_idx]
    )

    peak_time = float(
        t[peak_idx]
    )

    if final_val != 0:
        overshoot_pct = max(
            0.0,
            (
                (peak_val - final_val)
                / abs(final_val)
            ) * 100
        )
    else:
        overshoot_pct = 0.0

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

        if (
            len(r10_indices) == 0
            or len(r90_indices) == 0
        ):
            raise ValueError()

        r10_idx = r10_indices[0]
        r90_idx = r90_indices[0]

        rise_time = float(
            t[r90_idx] - t[r10_idx]
        )

    except (IndexError, ValueError):

        rise_time = 0.0

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

    if overshoot_pct > 5.0:

        damping_behavior = "Underdamped"

    elif overshoot_pct > 0.1:

        damping_behavior = "Slightly Underdamped"

    else:

        damping_behavior = (
            "Critically Damped / Overdamped"
        )

    if settling_time < (t[-1] * 0.8):

        stability_status = "Stable"

    else:

        stability_status = (
            "Slow Settling / Marginally Stable"
        )

    interpretation = (
        f"The system exhibits a "
        f"{damping_behavior.lower()} response "
        f"with an overshoot of "
        f"{overshoot_pct:.2f}%. "
        f"The response reaches a peak value of "
        f"{peak_val:.4f} at t = "
        f"{peak_time:.4f}s. "
        f"The rise time is "
        f"{rise_time:.4f}s and the settling time is "
        f"{settling_time:.4f}s. "
        f"The steady-state output converges near "
        f"{final_val:.4f}."
    )

    ml_prediction = None

    # ML requires a third CSV column containing control/input signal
    if len(df.columns) >= 3:

        control_col = df.columns[2]

        u = pd.to_numeric(
            df[control_col],
            errors="coerce"
        ).to_numpy()

        valid_u = np.isfinite(u) & np.isfinite(t) & np.isfinite(y)

        t_ml = t[valid_u]
        y_ml = y[valid_u]
        u_ml = u[valid_u]

        if len(t_ml) >= 2:

            dt = np.diff(t_ml)

            dt = np.maximum(
                dt,
                0
            )

            error = final_val - y_ml

            ess = float(
                abs(error[-1])
            )

            iae = float(
                np.sum(
                    (
                        np.abs(error[:-1])
                        + np.abs(error[1:])
                    )
                    * 0.5
                    * dt
                )
            )

            sigma_e = float(
                np.std(error)
            )

            eu = float(
                np.sum(
                    (
                        u_ml[:-1] ** 2
                        + u_ml[1:] ** 2
                    )
                    * 0.5
                    * dt
                )
            )

            u_max = float(
                np.max(
                    np.abs(u_ml)
                )
            )

            ml_prediction = predict_behavior(
                tr_ms=rise_time * 1000,
                ts_ms=settling_time * 1000,
                mp_percent=overshoot_pct,
                ess=ess,
                iae=iae,
                eu=eu,
                sigma_e=sigma_e,
                u_max=u_max
            )

            ml_prediction["features"] = {
                "tr_ms": round(rise_time * 1000, 6),
                "ts_ms": round(settling_time * 1000, 6),
                "Mp_percent": round(overshoot_pct, 6),
                "ess": round(ess, 6),
                "IAE": round(iae, 6),
                "Eu": round(eu, 6),
                "sigma_e": round(sigma_e, 6),
                "u_max": round(u_max, 6)
            }

    return {
        "metrics": {
            "initialValue": round(
                initial_val,
                6
            ),
            "steadyState": round(
                final_val,
                6
            ),
            "peakValue": round(
                peak_val,
                6
            ),
            "peakTime": round(
                peak_time,
                6
            ),
            "riseTime": round(
                rise_time,
                6
            ),
            "settlingTime": round(
                settling_time,
                6
            ),
            "overshoot": round(
                overshoot_pct,
                6
            )
        },

        "classification": {
            "damping": damping_behavior,
            "stability": stability_status
        },

        "interpretation": interpretation,

        "mlPrediction": ml_prediction,

        "data": [
            {
                "time": round(
                    float(time),
                    6
                ),
                "value": round(
                    float(value),
                    6
                )
            }
            for time, value in zip(t, y)
        ],

        "metadata": {
            "timeColumn": str(time_col),
            "signalColumn": str(signal_col),
            "sampleCount": int(len(t))
        }
    }