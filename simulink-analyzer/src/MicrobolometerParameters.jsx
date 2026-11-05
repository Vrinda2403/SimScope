
import { useState } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  Thermometer,
  Activity,
  Zap,
  Gauge,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cpu,
  ArrowRight,
  X,
  TrendingUp,
  Waves,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const API_URL = "http://127.0.0.1:8000";

const initialParameters = {
  Gth: "0.0000001",
  Cth: "0.000000045",
  R0: "100000",
  TCR: "-0.02",
  Ibias: "0.000001",
  T0: "300",
};

const parameterFields = [
  {
    key: "Gth",
    label: "Thermal Conductance",
    symbol: "Gth",
    unit: "W/K",
    description: "Heat transfer capability",
  },
  {
    key: "Cth",
    label: "Thermal Capacitance",
    symbol: "Cth",
    unit: "J/K",
    description: "Thermal energy storage",
  },
  {
    key: "R0",
    label: "Reference Resistance",
    symbol: "R0",
    unit: "Ω",
    description: "Resistance at reference temperature",
  },
  {
    key: "TCR",
    label: "Temperature Coefficient",
    symbol: "α",
    unit: "1/K",
    description: "Relative resistance change",
  },
  {
    key: "Ibias",
    label: "Bias Current",
    symbol: "Ibias",
    unit: "A",
    description: "Electrical bias current",
  },
  {
    key: "T0",
    label: "Ambient Temperature",
    symbol: "T0",
    unit: "K",
    description: "Reference temperature",
  },
];

const metricGroups = [
  {
    title: "Thermal Performance",
    icon: Thermometer,
    keys: [
      "theoreticalThermalTimeConstant",
      "heatingTimeConstant",
      "coolingTimeConstant",
      "maximumTemperatureRise",
      "steadyStateTemperatureRise",
      "temperatureRiseTime",
    ],
  },
  {
    title: "Electrical Performance",
    icon: Zap,
    keys: [
      "maximumResistance",
      "maximumResistanceChange",
      "maximumJoulePower",
      "biasPulseAmplitude",
      "biasPulseDuration",
    ],
  },
  {
    title: "Temperature Measurements",
    icon: Gauge,
    keys: [
      "maximumTemperature",
      "minimumTemperature",
      "steadyStateTemperature",
    ],
  },
];

const metricLabels = {
  theoreticalThermalTimeConstant: "Theoretical Thermal Time Constant",
  heatingTimeConstant: "Heating Time Constant",
  coolingTimeConstant: "Cooling Time Constant",
  maximumTemperature: "Maximum Temperature",
  minimumTemperature: "Minimum Temperature",
  maximumTemperatureRise: "Maximum Temperature Rise",
  steadyStateTemperature: "Heating Steady-State Temperature",
  steadyStateTemperatureRise: "Heating Steady-State Temperature Rise",
  temperatureRiseTime: "10–90% Temperature Rise Time",
  maximumResistance: "Maximum Resistance",
  maximumResistanceChange: "Maximum Resistance Change",
  maximumJoulePower: "Maximum Joule Power",
  biasPulseAmplitude: "Bias Pulse Amplitude",
  biasPulseDuration: "Bias Pulse Duration",
};

const metricUnits = {
  theoreticalThermalTimeConstant: "s",
  heatingTimeConstant: "s",
  coolingTimeConstant: "s",
  maximumTemperature: "K",
  minimumTemperature: "K",
  maximumTemperatureRise: "K",
  steadyStateTemperature: "K",
  steadyStateTemperatureRise: "K",
  temperatureRiseTime: "s",
  maximumResistance: "Ω",
  maximumResistanceChange: "Ω",
  maximumJoulePower: "W",
  biasPulseAmplitude: "V",
  biasPulseDuration: "s",
};

function formatMetric(value, key) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return "N/A";
  }

  const number = Number(value);

  if (
    number !== 0 &&
    (key === "maximumJoulePower" ||
      Math.abs(number) < 0.0001)
  ) {
    return number.toExponential(3);
  }

  return number.toLocaleString("en-US", {
    maximumFractionDigits: 6,
  });
}

function MetricCard({ label, value, unit, icon: Icon, metricKey }) {
  const available = value !== null && value !== undefined;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 transition hover:border-blue-500/40">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">
          {label}
        </span>
        <Icon size={17} className="text-blue-400" />
      </div>

      <div className="break-words text-xl font-bold text-slate-100">
        {available ? formatMetric(value, metricKey) : "N/A"}
      </div>

      <p className="mt-1 text-xs text-slate-500">
        {available ? unit : "Not available in response"}
      </p>
    </div>
  );
}

// Custom chart tooltip
function CustomTooltip({ active, payload, label, unit, scientific }) {
  if (!active || !payload?.length) return null;

  const value = Number(payload[0].value);

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 shadow-xl">
      <p className="mb-2 text-xs text-slate-400">
        Time: {Number(label).toFixed(3)} s
      </p>

      <p
        className="text-sm font-semibold"
        style={{ color: payload[0].color }}
      >
        {scientific
          ? value.toExponential(3)
          : value.toLocaleString("en-US", {
              maximumFractionDigits: 5,
            })}{" "}
        {unit}
      </p>
    </div>
  );
}

// Reusable graph component
function TimeSeriesChart({
  title,
  subtitle,
  icon: Icon,
  data,
  dataKey,
  color,
  unit,
  scientific = false,
  step = false,
}) {
  const formatter = (value) =>
    scientific
      ? Number(value).toExponential(2)
      : Number(value).toLocaleString("en-US", {
          maximumFractionDigits: 2,
        });

  return (
    <div className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-lg bg-blue-500/10 p-2">
          <Icon size={19} className="text-blue-400" />
        </div>

        <div>
          <h3 className="font-semibold text-slate-100">
            {title}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 10,
              right: 15,
              left: 10,
              bottom: 10,
            }}
          >
            <CartesianGrid
              stroke="#263449"
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="time"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
              tickFormatter={(value) => Number(value).toFixed(1)}
              label={{
                value: "Time (s)",
                position: "insideBottom",
                offset: -5,
                fill: "#94a3b8",
                fontSize: 11,
              }}
            />

            <YAxis
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatter}
              width={75}
            />

            <Tooltip
              content={
                <CustomTooltip
                  unit={unit}
                  scientific={scientific}
                />
              }
            />

            <Legend
              wrapperStyle={{
                color: "#cbd5e1",
                fontSize: 11,
                paddingTop: 12,
              }}
            />

            <Line
              type={step ? "stepAfter" : "monotone"}
              dataKey={dataKey}
              name={title}
              stroke={color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Four microbolometer graphs
function MicrobolometerCharts({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
          <TrendingUp size={16} />
          Response Visualization
        </div>

        <h2 className="text-2xl font-bold text-white">
          Simulation Graphs
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Time-domain analysis of thermal and electrical response.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <TimeSeriesChart
          title="Temperature vs Time"
          subtitle="Heating and cooling response"
          icon={Thermometer}
          data={data}
          dataKey="temperature"
          color="#38bdf8"
          unit="K"
        />

        <TimeSeriesChart
          title="Resistance vs Time"
          subtitle="Temperature-dependent detector resistance"
          icon={Activity}
          data={data}
          dataKey="resistance"
          color="#a78bfa"
          unit="Ω"
        />

        <TimeSeriesChart
          title="Bias Voltage vs Time"
          subtitle="Applied electrical bias pulse"
          icon={Zap}
          data={data}
          dataKey="biasVoltage"
          color="#fbbf24"
          unit="V"
          step
        />

        <TimeSeriesChart
          title="Joule Power vs Time"
          subtitle="Estimated electrical heating power"
          icon={Waves}
          data={data}
          dataKey="joulePower"
          color="#34d399"
          unit="W"
          scientific
        />
      </div>
    </div>
  );
}

export default function MicrobolometerParameters() {
  const [parameters, setParameters] = useState(initialParameters);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleParameterChange = (key, value) => {
    setParameters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    setResult(null);
    setError("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setFile(null);
      setError("Please select a valid CSV file.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
  };

  const removeFile = () => {
    setFile(null);
    setResult(null);
  };

  const handleAnalyze = async (event) => {
    event.preventDefault();

    setError("");
    setResult(null);

    if (!file) {
      setError("Please upload a microbolometer CSV file.");
      return;
    }

    for (const [key, value] of Object.entries(parameters)) {
      if (
        value.trim() === "" ||
        !Number.isFinite(Number(value))
      ) {
        setError(`Please enter a valid value for ${key}.`);
        return;
      }
    }

    if (
      Number(parameters.Gth) <= 0 ||
      Number(parameters.Cth) <= 0 ||
      Number(parameters.R0) <= 0 ||
      Number(parameters.T0) <= 0
    ) {
      setError(
        "Gth, Cth, R0 and T0 must be greater than zero."
      );
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("file", file);

      Object.entries(parameters).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await fetch(
        `${API_URL}/api/analyze/microbolometer`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Analysis failed.");
      }

      setResult(data.result);
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the analysis server."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setParameters(initialParameters);
    setFile(null);
    setResult(null);
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-400">
              <Cpu size={15} />
              SimuScope
              <ArrowRight size={13} />
              Analysis Modules
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Microbolometer Analysis
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              Electrothermal performance evaluation through
              physical parameters and simulation response analysis.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            <span className="text-sm font-medium text-blue-300">
              Microbolometer Mode
            </span>
          </div>
        </div>

        <form onSubmit={handleAnalyze}>

          {/* PHYSICAL PARAMETERS */}
          <section className="mb-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <div className="border-b border-slate-800 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2.5">
                  <Gauge className="text-blue-400" size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-white">
                    Physical Parameters
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Configure the microbolometer material and operating constants.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
              {parameterFields.map((field) => (
                <div key={field.key}>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-200">
                      {field.label}
                    </label>

                    <span className="rounded bg-slate-800 px-2 py-1 text-xs font-medium text-blue-300">
                      {field.symbol}
                    </span>
                  </div>

                  <div className="flex overflow-hidden rounded-lg border border-slate-700 bg-slate-950 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10">
                    <input
                      type="number"
                      step="any"
                      value={parameters[field.key]}
                      onChange={(e) =>
                        handleParameterChange(
                          field.key,
                          e.target.value
                        )
                      }
                      className="w-full min-w-0 bg-transparent px-3 py-3 text-sm text-slate-100 outline-none"
                      required
                    />

                    <span className="flex items-center border-l border-slate-700 bg-slate-900 px-3 text-xs text-slate-400">
                      {field.unit}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    {field.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 bg-slate-950/50 px-6 py-3">
              <p className="text-xs text-slate-500">
                Values are editable. Verify units and physical assumptions
                before interpreting calculated results.
              </p>
            </div>
          </section>

          {/* CSV UPLOAD */}
          <section className="mb-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <div className="border-b border-slate-800 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2.5">
                  <FileSpreadsheet
                    className="text-blue-400"
                    size={20}
                  />
                </div>

                <div>
                  <h2 className="font-semibold text-white">
                    Simulation Data
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Upload time-dependent microbolometer response signals.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950 px-6 py-10 text-center transition hover:border-blue-500 hover:bg-slate-800/50">
                <div className="mb-4 rounded-xl bg-blue-500/10 p-4">
                  <UploadCloud
                    size={28}
                    className="text-blue-400"
                  />
                </div>

                <p className="font-semibold text-slate-200">
                  Click to upload your CSV file
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Supported format: .csv
                </p>

                <p className="mt-4 text-xs text-slate-400">
                  Required columns:
                  <span className="ml-1 text-blue-300">
                    Time, Temperature, BiasVoltage
                  </span>
                </p>

                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {file && (
                <div className="mt-4 flex items-center justify-between rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileSpreadsheet className="shrink-0 text-blue-400" />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-200">
                        {file.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={removeFile}
                    className="rounded-md p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                    aria-label="Remove file"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Analyzing Data...
                </>
              ) : (
                <>
                  <Activity size={18} />
                  Run Microbolometer Analysis
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-6 py-3.5 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:bg-slate-800"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </form>

        {/* RESULTS */}
        {result && (
          <section className="mt-12">

            <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  <CheckCircle2 size={15} />
                  Analysis Completed
                </div>

                <h2 className="text-2xl font-bold text-white">
                  Performance Results
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Calculated microbolometer thermal and electrical metrics.
                </p>
              </div>

              <span className="self-start rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300">
                {result.data?.length || 0} samples processed
              </span>
            </div>

            {/* METRIC CARDS */}
            {metricGroups.map((group) => {
              const Icon = group.icon;

              return (
                <div key={group.title} className="mb-8">
                  <div className="mb-4 flex items-center gap-2">
                    <Icon size={18} className="text-blue-400" />

                    <h3 className="font-semibold text-slate-200">
                      {group.title}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.keys.map((key) => (
                      <MetricCard
                        key={key}
                        metricKey={key}
                        label={metricLabels[key]}
                        value={result.metrics?.[key]}
                        unit={metricUnits[key]}
                        icon={Icon}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* GRAPHS */}
            <MicrobolometerCharts data={result.data} />

            {/* INTERPRETATION */}
            <div className="mt-8 rounded-xl border border-blue-500/20 bg-blue-500/5 p-6">
              <div className="mb-3 flex items-center gap-2">
                <Activity size={19} className="text-blue-400" />

                <h3 className="font-semibold text-blue-300">
                  System Interpretation
                </h3>
              </div>

              <p className="text-sm leading-7 text-slate-300">
                {result.interpretation}
              </p>
            </div>

            {/* PARAMETERS USED */}
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="mb-4 font-semibold text-slate-200">
                Configuration Used
              </h3>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {Object.entries(result.parameters || {}).map(
                  ([key, value]) => (
                    <div key={key}>
                      <p className="text-xs text-slate-500">
                        {key}
                      </p>

                      <p className="mt-1 break-all text-sm font-semibold text-slate-200">
                        {value}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </section>
        )}

        {/* FOOTER */}
        <div className="mt-12 flex items-center justify-between border-t border-slate-800 pt-5 text-xs text-slate-500">
          <span>SimuScope · Microbolometer Module</span>

          <span className="flex items-center gap-1">
            <Clock size={13} />
            Electrothermal Analysis
          </span>
        </div>
      </div>
    </div>
  );
}
