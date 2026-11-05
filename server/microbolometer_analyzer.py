
import numpy as np
import pandas as pd


def _interpolated_crossing(time, values, target, direction="up"):
    """Find the first threshold crossing using linear interpolation."""

    if len(time) < 2:
        return None

    if direction == "up":
        indices = np.where(
            (values[:-1] < target) & (values[1:] >= target)
        )[0]
    else:
        indices = np.where(
            (values[:-1] > target) & (values[1:] <= target)
        )[0]

    if len(indices) == 0:
        # Handle a crossing exactly at the first sample.
        if direction == "up" and values[0] >= target:
            return float(time[0])
        if direction == "down" and values[0] <= target:
            return float(time[0])
        return None

    i = int(indices[0])

    y1 = values[i]
    y2 = values[i + 1]
    t1 = time[i]
    t2 = time[i + 1]

    if y2 == y1:
        return float(t2)

    fraction = (target - y1) / (y2 - y1)

    return float(t1 + fraction * (t2 - t1))


def _get_heating_and_cooling_indices(time, temperature, bias_voltage):
    """Identify the bias-on heating interval and the subsequent cooling interval."""

    amplitude = float(np.max(bias_voltage) - np.min(bias_voltage))

    if amplitude > 0:
        threshold = np.min(bias_voltage) + 0.1 * amplitude
        active = np.where(bias_voltage > threshold)[0]
    else:
        # Fallback for datasets without a bias-voltage pulse.
        peak_idx = int(np.argmax(temperature))
        active = np.arange(0, peak_idx + 1)

    if len(active) < 3:
        raise ValueError(
            "Could not identify a heating interval. "
            "Check the BiasVoltage column."
        )

    start_idx = int(active[0])
    end_idx = int(active[-1])
    peak_idx = start_idx + int(
        np.argmax(temperature[start_idx:end_idx + 1])
    )

    heating_indices = np.arange(start_idx, peak_idx + 1)
    cooling_indices = np.arange(peak_idx, len(time))

    return heating_indices, cooling_indices, start_idx, end_idx, peak_idx


def analyze_microbolometer(df, parameters):

    if df is None or df.empty:
        raise ValueError("CSV file is empty.")

    required_columns = ["Time", "Temperature", "BiasVoltage"]

    column_map = {
        str(col).strip().lower(): col
        for col in df.columns
    }

    missing = [
        col for col in required_columns
        if col.lower() not in column_map
    ]

    if missing:
        raise ValueError(
            f"Missing CSV columns: {', '.join(missing)}. "
            "Required columns: Time, Temperature, BiasVoltage."
        )

    time = pd.to_numeric(
        df[column_map["time"]], errors="coerce"
    ).to_numpy(dtype=float)

    temperature = pd.to_numeric(
        df[column_map["temperature"]], errors="coerce"
    ).to_numpy(dtype=float)

    bias_voltage = pd.to_numeric(
        df[column_map["biasvoltage"]], errors="coerce"
    ).to_numpy(dtype=float)

    valid = (
        np.isfinite(time)
        & np.isfinite(temperature)
        & np.isfinite(bias_voltage)
    )

    time = time[valid]
    temperature = temperature[valid]
    bias_voltage = bias_voltage[valid]

    if len(time) < 5:
        raise ValueError("At least 5 valid CSV samples are required.")

    order = np.argsort(time)

    time = time[order]
    temperature = temperature[order]
    bias_voltage = bias_voltage[order]

    if np.any(np.diff(time) <= 0):
        raise ValueError("Time values must be strictly increasing.")

    try:
        g_th = float(parameters["Gth"])
        c_th = float(parameters["Cth"])
        r0 = float(parameters["R0"])
        tcr = float(parameters["TCR"])
        i_bias = float(parameters["Ibias"])
        ambient = float(parameters["T0"])
    except (KeyError, TypeError, ValueError):
        raise ValueError(
            "Please provide valid Gth, Cth, R0, TCR, Ibias and T0 values."
        )

    if not all(np.isfinite(v) for v in [
        g_th, c_th, r0, tcr, i_bias, ambient
    ]):
        raise ValueError("All physical parameters must be finite numbers.")

    if g_th <= 0 or c_th <= 0 or r0 <= 0:
        raise ValueError("Gth, Cth and R0 must be greater than zero.")

    if ambient <= 0:
        raise ValueError("Reference temperature must be in Kelvin.")

    if i_bias < 0:
        raise ValueError("Bias current cannot be negative.")

    # Identify heating and cooling regions from the bias pulse.
    (
        heating_indices,
        cooling_indices,
        pulse_start_idx,
        pulse_end_idx,
        peak_idx
    ) = _get_heating_and_cooling_indices(
        time, temperature, bias_voltage
    )

    heating_time = time[heating_indices]
    heating_temp = temperature[heating_indices]

    # Use the pre-pulse temperature as the initial temperature.
    if pulse_start_idx > 0:
        initial_temp = float(np.mean(
            temperature[:pulse_start_idx]
        ))
    else:
        initial_temp = float(temperature[0])

    peak_temp = float(np.max(heating_temp))
    observed_rise = peak_temp - initial_temp

    if observed_rise <= 0:
        raise ValueError(
            "No positive temperature rise was detected during heating."
        )

    # Theoretical thermal time constant.
    theoretical_tau = c_th / g_th

    # Heating time constant: 63.2% of observed heating rise.
    heating_target = initial_temp + 0.632 * observed_rise

    heating_crossing = _interpolated_crossing(
        heating_time,
        heating_temp,
        heating_target,
        direction="up"
    )

    heating_tau = (
        heating_crossing - float(heating_time[0])
        if heating_crossing is not None else None
    )

    # Cooling time constant: decay to 36.8% of excess temperature.
    cooling_time = time[cooling_indices]
    cooling_temp = temperature[cooling_indices]

    cooling_tau = None

    if len(cooling_time) >= 3:
        cooling_start_temp = float(cooling_temp[0])
        cooling_excess = cooling_start_temp - ambient

        if cooling_excess > 0:
            cooling_target = ambient + 0.368 * cooling_excess

            cooling_crossing = _interpolated_crossing(
                cooling_time,
                cooling_temp,
                cooling_target,
                direction="down"
            )

            if cooling_crossing is not None:
                cooling_tau = (
                    cooling_crossing - float(cooling_time[0])
                )

    # Temperature measurements.
    max_temperature = float(np.max(temperature))
    min_temperature = float(np.min(temperature))
    max_temperature_rise = max_temperature - ambient

    # Estimate heating steady-state temperature from the final 10%
    # of the bias-on heating interval, not the cooling tail.
    steady_count = max(
        3,
        int(np.ceil(len(heating_temp) * 0.1))
    )

    steady_temperature = float(
        np.mean(heating_temp[-steady_count:])
    )

    steady_temperature_rise = steady_temperature - ambient

    # 10%-90% temperature rise time, based on the heating interval.
    level_10 = initial_temp + 0.1 * observed_rise
    level_90 = initial_temp + 0.9 * observed_rise

    time_10 = _interpolated_crossing(
        heating_time, heating_temp, level_10, "up"
    )

    time_90 = _interpolated_crossing(
        heating_time, heating_temp, level_90, "up"
    )

    rise_time = (
        time_90 - time_10
        if time_10 is not None and time_90 is not None
        else None
    )

    # Temperature-dependent resistance.
    resistance = r0 * (
        1 + tcr * (temperature - ambient)
    )

    if np.any(resistance <= 0):
        raise ValueError(
            "Calculated resistance became non-positive. "
            "Check R0, TCR and temperature values."
        )

    resistance_change = resistance - r0

    # Absolute maximum resistance change handles positive and negative TCR.
    maximum_resistance_change = float(
        np.max(np.abs(resistance_change))
    )

    # Joule power using the supplied constant bias current.
    joule_power = (i_bias ** 2) * resistance

    # Bias pulse characteristics.
    bias_amplitude = float(
        np.max(bias_voltage) - np.min(bias_voltage)
    )

    bias_duration = float(
        time[pulse_end_idx] - time[pulse_start_idx]
    )

    metrics = {
        "theoreticalThermalTimeConstant": float(theoretical_tau),
        "heatingTimeConstant": (
            float(heating_tau) if heating_tau is not None else None
        ),
        "coolingTimeConstant": (
            float(cooling_tau) if cooling_tau is not None else None
        ),
        "maximumTemperature": max_temperature,
        "minimumTemperature": min_temperature,
        "maximumTemperatureRise": max_temperature_rise,
        "steadyStateTemperature": steady_temperature,
        "steadyStateTemperatureRise": steady_temperature_rise,
        "temperatureRiseTime": (
            float(rise_time) if rise_time is not None else None
        ),
        "maximumResistance": float(np.max(resistance)),
        "minimumResistance": float(np.min(resistance)),
        "maximumResistanceChange": maximum_resistance_change,
        "maximumJoulePower": float(np.max(joule_power)),
        "biasPulseAmplitude": bias_amplitude,
        "biasPulseDuration": bias_duration
    }

    # Time-series data for frontend graphs.
    chart_data = [
        {
            "time": float(t),
            "temperature": float(temp),
            "biasVoltage": float(voltage),
            "resistance": float(res),
            "joulePower": float(power)
        }
        for t, temp, voltage, res, power in zip(
            time,
            temperature,
            bias_voltage,
            resistance,
            joule_power
        )
    ]

    interpretation = (
        f"The detector reached a maximum temperature of "
        f"{max_temperature:.3f} K, corresponding to a "
        f"temperature rise of {max_temperature_rise:.3f} K. "
        f"The theoretical thermal time constant is "
        f"{theoretical_tau:.6g} seconds. "
        f"The estimated heating and cooling time constants are "
        f"{heating_tau if heating_tau is not None else 'unavailable'} "
        f"and "
        f"{cooling_tau if cooling_tau is not None else 'unavailable'} "
        f"seconds, respectively."
    )

    return {
        "metrics": metrics,
        "data": chart_data,
        "parameters": {
            "Gth": g_th,
            "Cth": c_th,
            "R0": r0,
            "TCR": tcr,
            "Ibias": i_bias,
            "T0": ambient
        },
        "interpretation": interpretation
    }
