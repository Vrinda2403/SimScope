import React, { useState } from "react";

import {
    Activity,
    BarChart3,
    Bot,
    GitCompare,
    Menu,
} from "lucide-react";

import Dashboard from "./Dashboard";
import Analysis from "./Analysis";
import Comparison from "./Comparison";
import Assistant from "./Assistant";

const generateData = (run) => {
    return Array.from({ length: 101 }, (_, index) => {
        const time = index * 0.05;

        const damping =
            run.id === "RUN-002"
                ? 2.3
                : run.id === "RUN-003"
                    ? 0.9
                    : 1.5;

        const frequency =
            run.id === "RUN-003"
                ? 3.7
                : run.id === "RUN-002"
                    ? 3.8
                    : 3.2;

        const value =
            run.steady *
            (
                1 -
                Math.exp(-damping * time) *
                (
                    Math.cos(frequency * time) +
                    0.18 * Math.sin(frequency * time)
                )
            );

        return {
            time: Number(time.toFixed(2)),
            value: Number(value.toFixed(4)),
        };
    });
};

const initialRuns = [
    {
        id: "RUN-001",
        name: "Baseline",
        initialValue: 0,
        steady: 1.24,
        peak: 1.42,
        peakTime: 0.83,
        rise: 0.41,
        settling: 2.17,
        overshoot: 14.52,
        status: "Underdamped",
        stability: "Stable",
        mlPrediction: null,
    },
    {
        id: "RUN-002",
        name: "Optimized",
        initialValue: 0,
        steady: 1.21,
        peak: 1.27,
        peakTime: 0.76,
        rise: 0.36,
        settling: 1.54,
        overshoot: 4.96,
        status: "Slightly Underdamped",
        stability: "Stable",
        mlPrediction: null,
    },
    {
        id: "RUN-003",
        name: "High Gain",
        initialValue: 0,
        steady: 1.31,
        peak: 1.58,
        peakTime: 0.69,
        rise: 0.29,
        settling: 3.12,
        overshoot: 20.61,
        status: "Underdamped",
        stability: "Slow Settling / Marginally Stable",
        mlPrediction: null,
    },
];

const initialRunsWithData = initialRuns.map((run) => ({
    ...run,
    chartData: generateData(run),
}));

const Home = () => {
    const [runs, setRuns] = useState(initialRunsWithData);

    const [activeRun, setActiveRun] = useState(
        initialRunsWithData[0]
    );

    const [comparisonRuns, setComparisonRuns] = useState([]);

    const [question, setQuestion] = useState("");

    const [answer, setAnswer] = useState(
        "Upload a simulation or ask me about the current response."
    );

    const [isUploading, setIsUploading] = useState(false);

    const [uploadError, setUploadError] = useState("");

    const [fileName, setFileName] = useState(
        "No simulation uploaded"
    );

    const [sampleCount, setSampleCount] = useState(0);

    const [interpretation, setInterpretation] = useState(
        "Upload a simulation CSV to generate a real Python-based analysis."
    );

    const scrollToSection = (id) => {
        const section = document.getElementById(id);

        if (!section) {
            return;
        }

        const y =
            section.getBoundingClientRect().top +
            window.pageYOffset -
            80;

        window.scrollTo({
            top: y,
            behavior: "smooth",
        });
    };

    const handleUpload = async (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (
            !file.name
                .toLowerCase()
                .endsWith(".csv")
        ) {
            setUploadError("Please upload a CSV file.");
            return;
        }

        setIsUploading(true);
        setUploadError("");

        try {
            const formData = new FormData();

            formData.append("file", file);

            const response = await fetch(
                "http://127.0.0.1:8000/api/analyze",
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await response.json();

            console.log("BACKEND RESPONSE:", data);

            if (!response.ok || !data.success) {
                throw new Error(
                    data.error || "Analysis failed."
                );
            }

            const result = data.result;

            const newRun = {
                id: `RUN-${String(
                    runs.length + 1
                ).padStart(3, "0")}`,

                name: file.name.replace(
                    /\.csv$/i,
                    ""
                ),

                initialValue: Number(
                    result.metrics.initialValue
                ),

                steady: Number(
                    result.metrics.steadyState
                ),

                peak: Number(
                    result.metrics.peakValue
                ),

                peakTime: Number(
                    result.metrics.peakTime
                ),

                rise: Number(
                    result.metrics.riseTime
                ),

                settling: Number(
                    result.metrics.settlingTime
                ),

                overshoot: Number(
                    result.metrics.overshoot
                ),

                status:
                    result.classification.damping,

                stability:
                    result.classification.stability,

                chartData: result.data,

                mlPrediction:
                    result.mlPrediction || null,
            };

            console.log("NEW RUN:", newRun);

            setRuns((previousRuns) => [
                ...previousRuns,
                newRun,
            ]);

            setActiveRun(newRun);

            setComparisonRuns(
                (previousRuns) => [
                    ...previousRuns,
                    newRun,
                ]
            );

            setFileName(data.filename);

            setSampleCount(
                result.metadata.sampleCount
            );

            setInterpretation(
                result.interpretation
            );

            if (result.mlPrediction) {
                setAnswer(
                    `AI classified this simulation as "${result.mlPrediction.class}" with ${(result.mlPrediction.confidence * 100).toFixed(1)}% confidence. Ask me about the response for more details.`
                );
            } else {
                setAnswer(
                    "Analysis completed successfully. Ask me about the response."
                );
            }
        } catch (error) {
            console.error(
                "UPLOAD / ANALYSIS ERROR:",
                error
            );

            setUploadError(
                error.message ||
                "Could not connect to the analysis server."
            );
        } finally {
            setIsUploading(false);

            event.target.value = "";
        }
    };

    const handleQuestion = () => {
        const query = question.toLowerCase().trim();

        if (!query) {
            return;
        }

        if (
            query.includes("what does settling time indicate") ||
            query.includes("what is settling time") ||
            query.includes("meaning of settling time") ||
            query.includes("explain settling time") ||
            query.includes("settling time mean") ||
            query.includes("settling time indicate")
        ) {
            setAnswer(
                `Settling time indicates how long the system takes to reach and remain within a specified tolerance band around its final steady-state value. Here, the ±2% criterion is used. For ${activeRun.name}, the settling time is ${activeRun.settling.toFixed(
                    2
                )} seconds, meaning the response settles within ±2% of its steady-state value after approximately this time.`
            );
        } else if (
            query.includes("what is overshoot") ||
            query.includes("what does overshoot mean") ||
            query.includes("meaning of overshoot") ||
            query.includes("explain overshoot")
        ) {
            setAnswer(
                `Overshoot indicates how much the system's response temporarily exceeds its final steady-state value. ${activeRun.name} has an overshoot of ${activeRun.overshoot.toFixed(
                    2
                )}%. A larger overshoot generally indicates a more pronounced transient response.`
            );
        } else if (
            query.includes("what is rise time") ||
            query.includes("what does rise time mean") ||
            query.includes("meaning of rise time") ||
            query.includes("explain rise time")
        ) {
            setAnswer(
                `Rise time indicates how quickly the system responds to a change. It is measured here as the time taken for the response to move approximately from 10% to 90% of its final value. ${activeRun.name} has a rise time of ${activeRun.rise.toFixed(
                    2
                )} seconds.`
            );
        } else if (
            query.includes("why") &&
            query.includes("underdamped")
        ) {
            setAnswer(
                `${activeRun.name} is classified as ${activeRun.status} because its response shows transient overshoot beyond the steady-state value. Its measured overshoot is ${activeRun.overshoot.toFixed(
                    2
                )}%.`
            );
        } else if (
            query.includes("why") &&
            query.includes("stable")
        ) {
            setAnswer(
                `${activeRun.name} is classified as "${activeRun.stability}". Its settling time is ${activeRun.settling.toFixed(
                    2
                )} seconds compared with the total recorded simulation duration.`
            );
        } else if (
            query.includes("compare") ||
            query.includes("fastest")
        ) {
            if (comparisonRuns.length === 0) {
                setAnswer(
                    "There are currently no simulations in the comparison."
                );
            } else {
                const fastestRun = [
                    ...comparisonRuns,
                ].sort(
                    (a, b) =>
                        a.settling - b.settling
                )[0];

                setAnswer(
                    `${fastestRun.name} has the shortest settling time at ${fastestRun.settling.toFixed(
                        2
                    )} seconds.`
                );
            }
        } else if (
            query.includes("overshoot")
        ) {
            setAnswer(
                `${activeRun.name} has ${activeRun.overshoot.toFixed(
                    2
                )}% overshoot.`
            );
        } else if (
            query.includes("settling")
        ) {
            setAnswer(
                `${activeRun.name} has a settling time of ${activeRun.settling.toFixed(
                    2
                )} seconds using the ±2% steady-state criterion.`
            );
        } else if (
            query.includes("rise")
        ) {
            setAnswer(
                `${activeRun.name} has a rise time of ${activeRun.rise.toFixed(
                    2
                )} seconds, measured from approximately 10% to 90% of the final response.`
            );
        } else if (
            query.includes("peak")
        ) {
            setAnswer(
                `The peak response of ${activeRun.name} is ${activeRun.peak.toFixed(
                    3
                )}, occurring at t = ${activeRun.peakTime.toFixed(
                    3
                )} seconds.`
            );
        } else if (
            query.includes("initial")
        ) {
            setAnswer(
                `The initial value of ${activeRun.name} is ${activeRun.initialValue.toFixed(
                    3
                )}.`
            );
        } else if (
            query.includes("stable") ||
            query.includes("stability")
        ) {
            setAnswer(
                `${activeRun.name} is classified as "${activeRun.stability}". Its damping behavior is "${activeRun.status}".`
            );
        } else if (
            query.includes("damped") ||
            query.includes("damping")
        ) {
            setAnswer(
                `${activeRun.name} is classified as ${activeRun.status}.`
            );
        } else if (
            query.includes("ai") ||
            query.includes("prediction") ||
            query.includes("behavior")
        ) {
            if (activeRun.mlPrediction) {
                setAnswer(
                    `The AI model classified ${activeRun.name} as "${activeRun.mlPrediction.class}" with ${(
                        activeRun.mlPrediction.confidence *
                        100
                    ).toFixed(
                        1
                    )}% confidence.`
                );
            } else {
                setAnswer(
                    "AI behavior classification is unavailable for this simulation because the uploaded CSV does not contain the required control-signal data."
                );
            }
        } else {
            setAnswer(
                `${activeRun.name}: steady-state = ${activeRun.steady.toFixed(
                    3
                )}, peak = ${activeRun.peak.toFixed(
                    3
                )}, rise time = ${activeRun.rise.toFixed(
                    2
                )} s, settling time = ${activeRun.settling.toFixed(
                    2
                )} s, overshoot = ${activeRun.overshoot.toFixed(
                    2
                )}%.`
            );
        }

        setQuestion("");
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <aside className="fixed hidden h-screen w-60 border-r border-slate-800 bg-slate-900 p-5 md:block">
                <div className="mb-10 flex items-center gap-3">
                    <div className="rounded-xl bg-blue-600 p-2">
                        <Activity size={20} />
                    </div>

                    <div>
                        <h1 className="font-bold text-white">
                            SimuScope
                        </h1>

                        <p className="text-xs text-slate-500">
                            Dynamic Analyzer
                        </p>
                    </div>
                </div>

                <nav className="space-y-2">
                    <button
                        onClick={() =>
                            scrollToSection("dashboard")
                        }
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
                    >
                        <Activity size={17} />
                        Dashboard
                    </button>

                    <button
                        onClick={() =>
                            scrollToSection("analysis")
                        }
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
                    >
                        <BarChart3 size={17} />
                        Analysis
                    </button>

                    <button
                        onClick={() =>
                            scrollToSection("comparison")
                        }
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
                    >
                        <GitCompare size={17} />
                        Comparison
                    </button>

                    <button
                        onClick={() =>
                            scrollToSection("assistant")
                        }
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
                    >
                        <Bot size={17} />
                        AI Assistant
                    </button>
                </nav>
            </aside>

            <main className="md:ml-60">
                <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/90 px-5 backdrop-blur">
                    <div className="flex items-center gap-3">
                        <Menu
                            className="md:hidden"
                            size={20}
                        />

                        <span className="text-sm text-slate-500">
                            Workspace /
                            <span className="ml-1 text-slate-200">
                                Dynamic Response Analyzer
                            </span>
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        Analysis Engine Ready
                    </div>
                </header>

                <div className="mx-auto max-w-7xl space-y-7 p-5 lg:p-8">
                    <Dashboard
                        fileName={fileName}
                        sampleCount={sampleCount}
                        isUploading={isUploading}
                        uploadError={uploadError}
                        handleUpload={handleUpload}
                    />

                    <Analysis
                        runs={runs}
                        activeRun={activeRun}
                        setActiveRun={setActiveRun}
                        interpretation={interpretation}
                    />

                    <Comparison
                        runs={comparisonRuns}
                        activeRun={activeRun}
                        setActiveRun={setActiveRun}
                        setComparisonRuns={
                            setComparisonRuns
                        }
                    />

                    <Assistant
                        question={question}
                        setQuestion={setQuestion}
                        answer={answer}
                        handleQuestion={handleQuestion}
                    />

                    <footer className="flex justify-between border-t border-slate-800 pt-5 text-[10px] text-slate-600">
                        <span>
                            SimuScope Dynamic Response Analyzer
                        </span>

                        <span>
                            React • Python • ML
                        </span>
                    </footer>
                </div>
            </main>
        </div>
    );
};

export default Home;