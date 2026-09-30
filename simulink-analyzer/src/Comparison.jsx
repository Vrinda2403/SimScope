import React from "react";
import { Trash2 } from "lucide-react";

const Comparison = ({
    runs,
    activeRun,
    setActiveRun,
    setComparisonRuns,
}) => {
    const handleClearComparison = () => {
        setComparisonRuns([]);
    };

    return (
        <section
            id="comparison"
            className="scroll-mt-20"
        >
            <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">

                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Multi-run Analysis
                    </p>

                    <h3 className="mt-1 text-lg font-semibold">
                        Simulation Comparison
                    </h3>
                </div>

                {runs.length > 0 && (
                    <button
                        onClick={handleClearComparison}
                        className="flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-400 transition hover:border-red-500/50 hover:bg-red-500/10"
                    >
                        <Trash2 size={14} />
                        Clear Comparison
                    </button>
                )}
            </div>

            {runs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center">

                    <p className="text-sm font-medium text-slate-400">
                        No simulations in comparison
                    </p>

                    <p className="mt-1 text-xs text-slate-600">
                        Upload simulations to add them here.
                    </p>

                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">

                    <table className="w-full text-left text-xs">

                        <thead className="border-b border-slate-800 bg-slate-950/50 text-[10px] uppercase text-slate-500">

                            <tr>

                                <th className="px-5 py-3">
                                    Simulation
                                </th>

                                <th className="py-3">
                                    Rise Time
                                </th>

                                <th className="py-3">
                                    Settling
                                </th>

                                <th className="py-3">
                                    Overshoot
                                </th>

                                <th className="py-3">
                                    Status
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {runs.map((run) => (
                                <tr
                                    key={run.id}
                                    onClick={() =>
                                        setActiveRun(run)
                                    }
                                    className={`cursor-pointer border-b border-slate-800 last:border-0 hover:bg-slate-800/50 ${
                                        activeRun.id === run.id
                                            ? "bg-blue-500/5"
                                            : ""
                                    }`}
                                >

                                    <td className="px-5 py-4">

                                        <b>
                                            {run.id}
                                        </b>

                                        <span className="ml-2 text-slate-500">
                                            {run.name}
                                        </span>

                                    </td>

                                    <td>
                                        {run.rise.toFixed(2)} s
                                    </td>

                                    <td>
                                        {run.settling.toFixed(2)} s
                                    </td>

                                    <td>
                                        {run.overshoot.toFixed(2)}%
                                    </td>

                                    <td>

                                        <span className="rounded bg-amber-500/10 px-2 py-1 text-[10px] text-amber-400">
                                            {run.status}
                                        </span>

                                    </td>

                                </tr>
                            ))}

                        </tbody>

                    </table>

                </div>
            )}

        </section>
    );
};

export default Comparison;