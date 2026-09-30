import React from "react";

import {
    Activity,
    FileUp,
    Upload,
    Zap,
} from "lucide-react";

const Dashboard = ({
    fileName,
    sampleCount,
    isUploading,
    uploadError,
    handleUpload,
}) => {
    return (
        <section
            id="dashboard"
            className="scroll-mt-20"
        >

            {/* Hero */}

            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

                <div>

                    <div className="mb-3 inline-flex items-center gap-2 rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400">

                        <Zap size={13} />

                        Simulation Intelligence

                    </div>

                    <h2 className="text-3xl font-bold tracking-tight">
                        Dynamic Response Analyzer
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">

                        Analyze Simulink outputs, extract
                        transient-response metrics, compare
                        simulations and ask questions about
                        system behavior.

                    </p>

                </div>

                {/* Upload */}

                <label
                    className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                        isUploading
                            ? "cursor-not-allowed bg-slate-700 text-slate-400"
                            : "cursor-pointer bg-blue-600 hover:bg-blue-500"
                    }`}
                >

                    <Upload size={17} />

                    {isUploading
                        ? "Analyzing..."
                        : "Upload CSV"}

                    <input
                        type="file"
                        accept=".csv"
                        hidden
                        disabled={
                            isUploading
                        }
                        onChange={
                            handleUpload
                        }
                    />

                </label>

            </div>

            {/* File status */}

            <div className="mt-5 flex flex-col justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:flex-row sm:items-center">

                <div className="flex items-center gap-3">

                    <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                        <FileUp size={18} />
                    </div>

                    <div>

                        <p className="text-[10px] uppercase text-slate-500">
                            Current simulation
                        </p>

                        <p className="text-sm font-medium">
                            {fileName}
                        </p>

                    </div>

                </div>

                {isUploading ? (
                    <span className="text-xs text-blue-400">
                        Analyzing with Python...
                    </span>
                ) : uploadError ? (
                    <span className="max-w-md text-xs text-red-400">
                        {uploadError}
                    </span>
                ) : (
                    <span className="text-xs text-green-400">
                        ✓ Parsed successfully ·{" "}
                        {sampleCount} samples
                    </span>
                )}

            </div>

        </section>
    );
};

export default Dashboard;