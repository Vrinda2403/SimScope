import React from "react";

import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ReferenceDot,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const CustomTooltip = ({
    active,
    payload,
    label,
    steadyState,
}) => {
    if (
        !active ||
        !payload ||
        !payload.length
    ) {
        return null;
    }

    const response =
        Number(payload[0].value);

    const steady =
        Number(steadyState);

    const deviation =
        response - steady;

    const deviationPercent =
        steady !== 0
            ? (deviation /
                  Math.abs(steady)) *
              100
            : 0;

    const settlingBand =
        Math.abs(steady) * 0.02;

    const insideBand =
        Math.abs(deviation) <=
        settlingBand;

    return (
        <div className="min-w-[220px] rounded-xl border border-slate-700 bg-slate-950/95 p-4 shadow-xl">

            <p className="mb-3 text-xs font-semibold text-white">
                Response Analysis
            </p>

            <div className="space-y-2 text-xs">

                <div className="flex justify-between gap-6">
                    <span className="text-slate-500">
                        Time
                    </span>

                    <span className="font-medium text-white">
                        {Number(label).toFixed(
                            4
                        )} s
                    </span>
                </div>

                <div className="flex justify-between gap-6">
                    <span className="text-slate-500">
                        Response
                    </span>

                    <span className="font-medium text-blue-400">
                        {response.toFixed(4)}
                    </span>
                </div>

                <div className="flex justify-between gap-6">
                    <span className="text-slate-500">
                        Steady State
                    </span>

                    <span className="font-medium text-green-400">
                        {steady.toFixed(4)}
                    </span>
                </div>

                <div className="flex justify-between gap-6">
                    <span className="text-slate-500">
                        Deviation
                    </span>

                    <span
                        className={
                            deviation >= 0
                                ? "font-medium text-amber-400"
                                : "font-medium text-purple-400"
                        }
                    >
                        {deviation >= 0
                            ? "+"
                            : ""}
                        {deviation.toFixed(
                            4
                        )}
                    </span>
                </div>

                <div className="flex justify-between gap-6">
                    <span className="text-slate-500">
                        Deviation %
                    </span>

                    <span className="font-medium text-white">
                        {deviationPercent >=
                        0
                            ? "+"
                            : ""}
                        {deviationPercent.toFixed(
                            2
                        )}
                        %
                    </span>
                </div>

                <div className="mt-3 border-t border-slate-800 pt-3">

                    <span
                        className={
                            insideBand
                                ? "text-green-400"
                                : "text-red-400"
                        }
                    >
                        {insideBand
                            ? "✓ Inside ±2% settling band"
                            : "× Outside ±2% settling band"}
                    </span>

                </div>

            </div>

        </div>
    );
};

const ResponseChart = ({
    data,
    steadyState,
    peakTime,
    peakValue,
}) => {
    const chartData =
        Array.isArray(data)
            ? data
            : [];

    const settlingBand =
        Math.abs(
            Number(steadyState) || 0
        ) * 0.02;

    const hasData =
        chartData.length > 0;

    return (
        <div className="h-[420px] w-full">

            {!hasData ? (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-800 bg-slate-950/50">

                    <div className="text-center">

                        <p className="text-sm font-medium text-slate-400">
                            No simulation data
                        </p>

                        <p className="mt-1 text-xs text-slate-600">
                            Upload a Simulink CSV to display the response.
                        </p>

                    </div>

                </div>
            ) : (

                <ResponsiveContainer
                    width="100%"
                    height="100%"
                >

                    <LineChart
                        data={chartData}
                        margin={{
                            top: 35,
                            right: 25,
                            left: 5,
                            bottom: 35,
                        }}
                    >

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#1e293b"
                        />

                        <XAxis
                            dataKey="time"
                            stroke="#64748b"
                            fontSize={11}
                            tickLine={false}
                            tickFormatter={(value) =>
                                Number(
                                    value
                                ).toFixed(1)
                            }
                            label={{
                                value: "Time (s)",
                                position:
                                    "insideBottom",
                                offset: -20,
                                fill: "#64748b",
                            }}
                        />

                        <YAxis
                            stroke="#64748b"
                            fontSize={11}
                            tickLine={false}
                            tickFormatter={(value) =>
                                Number(
                                    value
                                ).toFixed(2)
                            }
                            label={{
                                value: "Response",
                                angle: -90,
                                position:
                                    "insideLeft",
                                fill: "#64748b",
                                fontSize: 11,
                            }}
                        />

                        <Tooltip
                            content={
                                <CustomTooltip
                                    steadyState={
                                        steadyState
                                    }
                                />
                            }
                        />

                        {/* Moved ABOVE the graph
                            so it no longer overlaps
                            the X-axis. */}

                        <Legend
                            verticalAlign="top"
                            align="right"
                            height={30}
                            wrapperStyle={{
                                fontSize:
                                    "11px",
                                color: "#94a3b8",
                            }}
                        />

                        {/* Steady State */}

                        <ReferenceLine
                            y={steadyState}
                            stroke="#22c55e"
                            strokeDasharray="6 4"
                            label={{
                                value: "Steady State",
                                position:
                                    "insideTopRight",
                                fill: "#22c55e",
                                fontSize: 10,
                            }}
                        />

                        {/* +2% */}

                        <ReferenceLine
                            y={
                                Number(
                                    steadyState
                                ) +
                                settlingBand
                            }
                            stroke="#64748b"
                            strokeDasharray="3 4"
                        />

                        {/* -2% */}

                        <ReferenceLine
                            y={
                                Number(
                                    steadyState
                                ) -
                                settlingBand
                            }
                            stroke="#64748b"
                            strokeDasharray="3 4"
                        />

                        {/* Response */}

                        <Line
                            type="monotone"
                            dataKey="value"
                            name="System Response"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{
                                r: 6,
                            }}
                        />

                        {/* Peak */}

                        {peakTime !==
                            undefined &&
                            peakValue !==
                                undefined && (

                                <ReferenceDot
                                    x={
                                        peakTime
                                    }
                                    y={
                                        peakValue
                                    }
                                    r={6}
                                    fill="#ef4444"
                                    stroke="#ffffff"
                                    strokeWidth={
                                        2
                                    }
                                    label={{
                                        value: "Peak",
                                        position:
                                            "top",
                                        fill: "#ef4444",
                                        fontSize: 10,
                                    }}
                                />

                            )}

                    </LineChart>

                </ResponsiveContainer>

            )}

        </div>
    );
};

export default ResponseChart;