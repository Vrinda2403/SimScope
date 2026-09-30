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

/* =========================================================
   SAMPLE DATA
========================================================= */

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
            (1 -
                Math.exp(-damping * time) *
                (Math.cos(frequency * time) +
                    0.18 * Math.sin(frequency * time)));

        return {
            time: Number(time.toFixed(2)),
            value: Number(value.toFixed(4)),
        };
    });
};

/* =========================================================
   INITIAL SAMPLE RUNS
========================================================= */

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
    },
];

const initialRunsWithData = initialRuns.map((run) => ({
    ...run,
    chartData: generateData(run),
}));

/* =========================================================
   HOME
========================================================= */

const Home = () => {
    /* -----------------------------------------------------
       Current analysis
    ----------------------------------------------------- */

    const [runs, setRuns] = useState(
        initialRunsWithData
    );

    const [activeRun, setActiveRun] = useState(
        initialRunsWithData[0]
    );

    /* -----------------------------------------------------
       Comparison

       Starts empty.

       Uploaded simulations are added here.
       Clear Comparison empties this list.
    ----------------------------------------------------- */

    const [comparisonRuns, setComparisonRuns] =
        useState([]);

    /* -----------------------------------------------------
       Assistant
    ----------------------------------------------------- */

    const [question, setQuestion] = useState("");

    const [answer, setAnswer] = useState(
        "Upload a simulation or ask me about the current response."
    );

    /* -----------------------------------------------------
       Upload state
    ----------------------------------------------------- */

    const [isUploading, setIsUploading] =
        useState(false);

    const [uploadError, setUploadError] =
        useState("");

    const [fileName, setFileName] = useState(
        "No simulation uploaded"
    );

    const [sampleCount, setSampleCount] =
        useState(0);

    const [interpretation, setInterpretation] =
        useState(
            "Upload a simulation CSV to generate a real Python-based analysis."
        );

    /* =====================================================
       SIDEBAR NAVIGATION
    ===================================================== */

    const scrollToSection = (id) => {
        const section =
            document.getElementById(id);

        if (!section) {
            console.log(
                `Section "${id}" not found`
            );

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

    /* =====================================================
       CSV UPLOAD
    ===================================================== */

    const handleUpload = async (event) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        /* -------------------------------------------------
           Validate CSV
        ------------------------------------------------- */

        if (
            !file.name
                .toLowerCase()
                .endsWith(".csv")
        ) {
            setUploadError(
                "Please upload a CSV file."
            );

            return;
        }

        setIsUploading(true);
        setUploadError("");

        try {
            /* ---------------------------------------------
               Prepare FormData
            --------------------------------------------- */

            const formData =
                new FormData();

            formData.append(
                "file",
                file
            );

            /* ---------------------------------------------
               Send CSV to FastAPI
            --------------------------------------------- */

            const response =
                await fetch(
                    "http://127.0.0.1:8000/api/analyze",
                    {
                        method: "POST",
                        body: formData,
                    }
                );

            const data =
                await response.json();

            console.log(
                "BACKEND RESPONSE:",
                data
            );

            /* ---------------------------------------------
               Handle backend errors
            --------------------------------------------- */

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.error ||
                        "Analysis failed."
                );
            }

            const result =
                data.result;

            /* ---------------------------------------------
               Convert Python response into frontend object
            --------------------------------------------- */

            const newRun = {
                id: `RUN-${String(
                    runs.length + 1
                ).padStart(3, "0")}`,

                name: file.name.replace(
                    /\.csv$/i,
                    ""
                ),

                /* Metrics */

                initialValue:
                    Number(
                        result.metrics
                            .initialValue
                    ),

                steady:
                    Number(
                        result.metrics
                            .steadyState
                    ),

                peak:
                    Number(
                        result.metrics
                            .peakValue
                    ),

                peakTime:
                    Number(
                        result.metrics
                            .peakTime
                    ),

                rise:
                    Number(
                        result.metrics
                            .riseTime
                    ),

                settling:
                    Number(
                        result.metrics
                            .settlingTime
                    ),

                overshoot:
                    Number(
                        result.metrics
                            .overshoot
                    ),

                /* Classification */

                status:
                    result.classification
                        .damping,

                stability:
                    result.classification
                        .stability,

                /* Actual Python-generated
                   response data */

                chartData:
                    result.data,
            };

            console.log(
                "NEW RUN:",
                newRun
            );

            /* ---------------------------------------------
               Add run to internal run list
            --------------------------------------------- */

            setRuns((previousRuns) => [
                ...previousRuns,
                newRun,
            ]);

            /* ---------------------------------------------
               Make uploaded file active
            --------------------------------------------- */

            setActiveRun(newRun);

            /* ---------------------------------------------
               ADD uploaded run to comparison

               This is separate from active analysis.
            --------------------------------------------- */

            setComparisonRuns(
                (previousRuns) => [
                    ...previousRuns,
                    newRun,
                ]
            );

            /* ---------------------------------------------
               Update file information
            --------------------------------------------- */

            setFileName(
                data.filename
            );

            setSampleCount(
                result.metadata
                    .sampleCount
            );

            /* ---------------------------------------------
               Python-generated interpretation
            --------------------------------------------- */

            setInterpretation(
                result.interpretation
            );

            /* ---------------------------------------------
               Update assistant
            --------------------------------------------- */

            setAnswer(
                "Analysis completed successfully. Ask me about the response."
            );

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

            /*
             * Allows the same CSV to be selected again.
             */

            event.target.value = "";
        }
    };

    /* =====================================================
       ASSISTANT
    ===================================================== */

    const handleQuestion = () => {
        const query =
            question
                .toLowerCase()
                .trim();

        if (!query) {
            return;
        }

        /* -------------------------------------------------
           Overshoot
        ------------------------------------------------- */

        if (
            query.includes(
                "overshoot"
            )
        ) {
            setAnswer(
                `${activeRun.name} has ${activeRun.overshoot.toFixed(
                    2
                )}% overshoot. This means the transient response exceeds its steady-state value before converging.`
            );
        }

        /* -------------------------------------------------
           Settling time
        ------------------------------------------------- */

        else if (
            query.includes(
                "settling"
            )
        ) {
            setAnswer(
                `The settling time is ${activeRun.settling.toFixed(
                    2
                )} seconds using the ±2% steady-state criterion.`
            );
        }

        /* -------------------------------------------------
           Rise time
        ------------------------------------------------- */

        else if (
            query.includes("rise")
        ) {
            setAnswer(
                `The rise time is ${activeRun.rise.toFixed(
                    2
                )} seconds, measured approximately from 10% to 90% of the response.`
            );
        }

        /* -------------------------------------------------
           Comparison / fastest
        ------------------------------------------------- */

        else if (
            query.includes(
                "compare"
            ) ||
            query.includes(
                "fastest"
            )
        ) {
            if (
                comparisonRuns.length ===
                0
            ) {
                setAnswer(
                    "There are currently no simulations in the comparison."
                );
            } else {
                const fastestRun =
                    [...comparisonRuns].sort(
                        (a, b) =>
                            a.settling -
                            b.settling
                    )[0];

                setAnswer(
                    `${fastestRun.name} has the shortest settling time at ${fastestRun.settling.toFixed(
                        2
                    )} seconds.`
                );
            }
        }

        /* -------------------------------------------------
           Stability
        ------------------------------------------------- */

        else if (
            query.includes(
                "stable"
            ) ||
            query.includes(
                "stability"
            )
        ) {
            setAnswer(
                `${activeRun.name} is classified as "${activeRun.stability}". The damping behavior is "${activeRun.status}".`
            );
        }

        /* -------------------------------------------------
           Damping
        ------------------------------------------------- */

        else if (
            query.includes(
                "damped"
            ) ||
            query.includes(
                "damping"
            )
        ) {
            setAnswer(
                `${activeRun.name} is classified as ${activeRun.status}.`
            );
        }

        /* -------------------------------------------------
           Initial value
        ------------------------------------------------- */

        else if (
            query.includes(
                "initial"
            )
        ) {
            setAnswer(
                `The initial value of ${activeRun.name} is ${activeRun.initialValue.toFixed(
                    3
                )}.`
            );
        }

        /* -------------------------------------------------
           Peak
        ------------------------------------------------- */

        else if (
            query.includes("peak")
        ) {
            setAnswer(
                `The peak response is ${activeRun.peak.toFixed(
                    3
                )} at t = ${activeRun.peakTime.toFixed(
                    3
                )} seconds.`
            );
        }

        /* -------------------------------------------------
           Default
        ------------------------------------------------- */

        else {
            setAnswer(
                `${activeRun.name}: steady-state = ${activeRun.steady.toFixed(
                    3
                )}, peak = ${activeRun.peak.toFixed(
                    3
                )}, rise time = ${activeRun.rise.toFixed(
                    3
                )} s, settling time = ${activeRun.settling.toFixed(
                    3
                )} s, overshoot = ${activeRun.overshoot.toFixed(
                    2
                )}%.`
            );
        }

        setQuestion("");
    };

    /* =====================================================
       UI
    ===================================================== */

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside className="fixed hidden h-screen w-60 border-r border-slate-800 bg-slate-900 p-5 md:block">

                {/* Logo */}

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

                {/* Navigation */}

                <nav className="space-y-2">

                    <button
                        onClick={() =>
                            scrollToSection(
                                "dashboard"
                            )
                        }
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
                    >
                        <Activity size={17} />
                        Dashboard
                    </button>

                    <button
                        onClick={() =>
                            scrollToSection(
                                "analysis"
                            )
                        }
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
                    >
                        <BarChart3 size={17} />
                        Analysis
                    </button>

                    <button
                        onClick={() =>
                            scrollToSection(
                                "comparison"
                            )
                        }
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
                    >
                        <GitCompare size={17} />
                        Comparison
                    </button>

                    <button
                        onClick={() =>
                            scrollToSection(
                                "assistant"
                            )
                        }
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
                    >
                        <Bot size={17} />
                        AI Assistant
                    </button>

                </nav>

            </aside>

            {/* =================================================
                MAIN
            ================================================= */}

            <main className="md:ml-60">

                {/* Header */}

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

                {/* =================================================
                    CONTENT
                ================================================= */}

                <div className="mx-auto max-w-7xl space-y-7 p-5 lg:p-8">

                    {/* =================================================
                        1. DASHBOARD
                    ================================================= */}

                    <Dashboard
                        fileName={fileName}
                        sampleCount={
                            sampleCount
                        }
                        isUploading={
                            isUploading
                        }
                        uploadError={
                            uploadError
                        }
                        handleUpload={
                            handleUpload
                        }
                    />

                    {/* =================================================
                        2. ANALYSIS
                    ================================================= */}

                    <Analysis
                        runs={runs}
                        activeRun={
                            activeRun
                        }
                        setActiveRun={
                            setActiveRun
                        }
                        interpretation={
                            interpretation
                        }
                    />

                    {/* =================================================
                        3. COMPARISON
                    ================================================= */}

                    <Comparison
                        runs={
                            comparisonRuns
                        }
                        activeRun={
                            activeRun
                        }
                        setActiveRun={
                            setActiveRun
                        }
                        setComparisonRuns={
                            setComparisonRuns
                        }
                    />

                    {/* =================================================
                        4. ASSISTANT
                    ================================================= */}

                    <Assistant
                        question={
                            question
                        }
                        setQuestion={
                            setQuestion
                        }
                        answer={answer}
                        handleQuestion={
                            handleQuestion
                        }
                    />

                    {/* =================================================
                        FOOTER
                    ================================================= */}

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