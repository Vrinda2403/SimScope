
import React, { useState } from "react";
import { Activity, Thermometer, ArrowLeft } from "lucide-react";

import MotorAnalysis from "./MotorAnalysis";
import MicrobolometerParameters from "./MicrobolometerParameters";

const Home = () => {
    const [activeModule, setActiveModule] = useState("motor");

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">

            {/* Module Navigation */}
            <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">

                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-600 p-2">
                            <Activity size={21} />
                        </div>

                        <div>
                            <h1 className="text-lg font-bold text-white">
                                SimuScope
                            </h1>
                            <p className="text-xs text-slate-500">
                                Simulation Analysis Platform
                            </p>
                        </div>
                    </div>

                    <nav className="flex flex-wrap items-center gap-2">

                        <button
                            onClick={() => setActiveModule("motor")}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                                activeModule === "motor"
                                    ? "bg-blue-600 text-white"
                                    : "border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                            }`}
                        >
                            <Activity size={16} />
                            Motor Analysis
                        </button>

                        <button
                            onClick={() => setActiveModule("microbolometer")}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                                activeModule === "microbolometer"
                                    ? "bg-blue-600 text-white"
                                    : "border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                            }`}
                        >
                            <Thermometer size={16} />
                            Microbolometer Analysis
                        </button>

                    </nav>
                </div>
            </header>

            {/* Selected Analysis Module */}
            <main>
                {activeModule === "motor" ? (
                    <MotorAnalysis />
                ) : (
                    <div>
                        <div className="mx-auto max-w-7xl px-5 pt-5">
                            <button
                                onClick={() => setActiveModule("motor")}
                                className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
                            >
                                <ArrowLeft size={16} />
                                Back to Motor Analysis
                            </button>
                        </div>

                        <MicrobolometerParameters />
                    </div>
                )}
            </main>

        </div>
    );
};

export default Home;
