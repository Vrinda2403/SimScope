import React from "react";

import {
    Activity,
    BarChart3,
    Clock3,
    Zap,
} from "lucide-react";

import ResponseChart from "./ResponseChart";

const metricConfig = [
    {
        label: "Initial Value",
        key: "initialValue",
        unit: "",
        icon: Activity,
    },
    {
        label: "Steady State",
        key: "steady",
        unit: "",
        icon: Activity,
    },
    {
        label: "Peak Value",
        key: "peak",
        unit: "",
        icon: Zap,
    },
    {
        label: "Peak Time",
        key: "peakTime",
        unit: "s",
        icon: Clock3,
    },
    {
        label: "Rise Time",
        key: "rise",
        unit: "s",
        icon: Clock3,
    },
    {
        label: "Settling Time",
        key: "settling",
        unit: "s",
        icon: Clock3,
    },
    {
        label: "Overshoot",
        key: "overshoot",
        unit: "%",
        icon: BarChart3,
    },
];

const Analysis = ({
    runs,
    activeRun,
    setActiveRun,
    interpretation,
}) => {
    return (
        <section
            id="analysis"
            className="scroll-mt-20"
        >

            {/* Heading */}

            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">

                <div>

                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Performance
                    </p>

                    <h3 className="mt-1 text-lg font-semibold">
                        Transient Response Analysis
                    </h3>

                </div>

                <select
                    value={activeRun.id}
                    onChange={(event) => {

                        const selectedRun =
                            runs.find(
                                (run) =>
                                    run.id ===
                                    event.target.value
                            );

                        if (selectedRun) {
                            setActiveRun(
                                selectedRun
                            );
                        }

                    }}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs outline-none"
                >

                    {runs.map((run) => (
                        <option
                            key={run.id}
                            value={run.id}
                        >
                            {run.id} —{" "}
                            {run.name}
                        </option>
                    ))}

                </select>

            </div>

            {/* =================================================
                METRICS
            ================================================= */}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">

                {metricConfig.map(
                    ({
                        label,
                        key,
                        unit,
                        icon: Icon,
                    }) => (

                        <div
                            key={label}
                            className="rounded-xl border border-slate-800 bg-slate-900 p-4 transition hover:border-slate-700 hover:bg-slate-800/70"
                        >

                            <div className="mb-4 w-fit rounded-lg bg-blue-500/10 p-2 text-blue-400">
                                <Icon size={17} />
                            </div>

                            <p className="text-[10px] text-slate-500">
                                {label}
                            </p>

                            <p className="mt-1 text-xl font-bold">

                                {Number(
                                    activeRun[key]
                                ).toFixed(3)}

                                <span className="ml-1 text-xs font-normal text-slate-500">
                                    {unit}
                                </span>

                            </p>

                        </div>

                    )
                )}

            </div>

            {/* =================================================
                GRAPH + INTERPRETATION
            ================================================= */}

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.7fr_1fr]">

                {/* Graph */}

                <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">

                    <div className="mb-2 flex items-start justify-between">

                        <div>

                            <p className="text-[10px] uppercase text-slate-500">
                                Time Domain
                            </p>

                            <h3 className="mt-1 font-semibold">
                                Dynamic Response
                            </h3>

                        </div>

                        <span className="rounded-md bg-amber-500/10 px-2 py-1 text-[10px] text-amber-400">
                            {activeRun.status}
                        </span>

                    </div>

                    <ResponseChart
                        data={
                            activeRun.chartData ||
                            []
                        }
                        steadyState={
                            activeRun.steady
                        }
                        peakTime={
                            activeRun.peakTime
                        }
                        peakValue={
                            activeRun.peak
                        }
                    />

                </div>

                {/* Interpretation */}

                <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">

                    <p className="text-[10px] uppercase text-slate-500">
                        Automated Interpretation
                    </p>

                    <h3 className="mt-1 font-semibold">
                        System Behavior
                    </h3>

                    <div className="mt-5 rounded-lg bg-green-500/10 p-4">

                        <p className="text-sm font-semibold text-green-400">
                            {activeRun.status}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                            Response classification
                        </p>

                    </div>

                    <div className="mt-5 space-y-4 text-xs leading-5 text-slate-400">

                        <p>
                            {interpretation}
                        </p>

                        <div className="border-t border-slate-800 pt-3">

                            <p className="text-slate-500">
                                Stability
                            </p>

                            <p className="mt-1 font-medium text-white">
                                {activeRun.stability}
                            </p>

                        </div>

                        <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3">

                            <div>

                                <p className="text-slate-500">
                                    Peak
                                </p>

                                <p className="mt-1 font-medium text-white">
                                    {activeRun.peak.toFixed(
                                        3
                                    )}
                                </p>

                            </div>

                            <div>

                                <p className="text-slate-500">
                                    Overshoot
                                </p>

                                <p className="mt-1 font-medium text-white">
                                    {activeRun.overshoot.toFixed(
                                        2
                                    )}
                                    %
                                </p>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </section>
    );
};

export default Analysis;